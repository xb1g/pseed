import { NextRequest, NextResponse } from "next/server";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getKimiModel } from "@/lib/ai/modelRegistry";
import {
  aiChatRequestSchema,
  aiChatProviderTurnSchema,
  buildMapAIChatFinalFeedbackPrompt,
  buildMapAIChatSystemPrompt,
  containsChineseCharacters,
  createPlainTextAIChatTurn,
  normalizeAIChatTurnResponse,
  parseAIChatTurnResponse,
  resolveMapAIChatConfig,
} from "@/lib/ai/map-assessment-chat";
import type { AIChatAssessmentMetadata } from "@/types/map";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ assessmentId: string }> };

async function getAuthorizedAssessment(assessmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" as const, status: 401 };

  const { data: assessment, error } = await supabase
    .from("node_assessments")
    .select("id, node_id, assessment_type, metadata")
    .eq("id", assessmentId)
    .single();

  if (error || !assessment || assessment.assessment_type !== "ai_chat") {
    return { error: "AI Chat assessment not found" as const, status: 404 };
  }

  return { user, assessment };
}

async function getOrCreateProgress(
  userId: string,
  nodeId: string,
  admin: ReturnType<typeof createAdminClient>,
) {
  const { data: existing } = await admin
    .from("student_node_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("node_id", nodeId)
    .maybeSingle();

  if (existing) return existing;

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("student_node_progress")
    .insert({
      user_id: userId,
      node_id: nodeId,
      status: "in_progress",
      arrived_at: now,
      started_at: now,
    })
    .select("*")
    .single();

  if (!error && data) return data;

  if (error?.code === "23505") {
    const { data: racedProgress } = await admin
      .from("student_node_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("node_id", nodeId)
      .single();
    if (racedProgress) return racedProgress;
  }

  throw new Error(error?.message || "Could not start node progress");
}

async function getOrCreateSession(args: {
  assessmentId: string;
  progressId: string;
  userId: string;
  objective: string;
  openingMessage: string;
  admin: ReturnType<typeof createAdminClient>;
}) {
  const { admin, assessmentId, progressId, userId, objective, openingMessage } = args;
  const { data: existing } = await admin
    .from("node_ai_chat_sessions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await admin
    .from("node_ai_chat_sessions")
    .insert({
      assessment_id: assessmentId,
      progress_id: progressId,
      user_id: userId,
      objective,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      const { data: racedSession } = await admin
        .from("node_ai_chat_sessions")
        .select("*")
        .eq("assessment_id", assessmentId)
        .eq("user_id", userId)
        .single();
      if (racedSession) return racedSession;
    }
    throw new Error(error?.message || "Could not create chat session");
  }

  await admin.from("node_ai_chat_messages").insert({
    session_id: data.id,
    role: "assistant",
    content: openingMessage,
  });

  return data;
}

async function loadMessages(
  sessionId: string,
  admin: ReturnType<typeof createAdminClient>,
) {
  const { data, error } = await admin
    .from("node_ai_chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function generateFinalFeedback(args: {
  config: ReturnType<typeof resolveMapAIChatConfig>;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  fallback: string;
}) {
  const { config, messages, fallback } = args;
  const transcript = messages
    .map((message) => `${message.role === "user" ? "Student" : "Mentor"}: ${message.content}`)
    .join("\n\n")
    .slice(-50000);

  try {
    const { text } = await generateText({
      model: getKimiModel(),
      system: buildMapAIChatFinalFeedbackPrompt(config),
      prompt: `Conversation transcript:\n\n${transcript}`,
      temperature: 0.3,
      maxOutputTokens: 700,
    });
    const feedback = await ensureEnglishStudentText(text);
    const cleanedFeedback = feedback
      .trim()
      .replace(/\s*—\s*/g, ", ")
      .slice(0, 2000);
    return cleanedFeedback || fallback;
  } catch (error) {
    console.warn("[Map AI Chat] Final feedback generation failed", error);
    return fallback;
  }
}

async function ensureEnglishStudentText(text: string) {
  const trimmed = text.trim();
  if (!containsChineseCharacters(trimmed)) return trimmed;

  try {
    const { text: translated } = await generateText({
      model: getKimiModel(),
      system:
        "Translate the provided student-facing mentor response into natural English. Preserve its meaning, tone, and questions. Return only the English translation.",
      prompt: trimmed,
      temperature: 0.1,
      maxOutputTokens: 1200,
    });
    const english = translated.trim();
    return english && !containsChineseCharacters(english)
      ? english
      : "Please continue by explaining your thinking in a little more detail.";
  } catch (error) {
    console.warn("[Map AI Chat] English translation safeguard failed", error);
    return "Please continue by explaining your thinking in a little more detail.";
  }
}

async function createCompletionSubmission(args: {
  session: any;
  assessmentId: string;
  nodeId: string;
  autoPass: boolean;
  criteriaMet: boolean;
  feedback: string;
  evidence: string;
  completionPercentage: number;
  admin: ReturnType<typeof createAdminClient>;
}) {
  const {
    session,
    assessmentId,
    nodeId,
    autoPass,
    criteriaMet,
    feedback,
    evidence,
    completionPercentage,
    admin,
  } = args;

  const { data: existingSubmission } = await admin
    .from("assessment_submissions")
    .select("id")
    .eq("progress_id", session.progress_id)
    .eq("assessment_id", assessmentId)
    .contains("metadata", { ai_chat_session_id: session.id })
    .maybeSingle();

  let submissionId = existingSubmission?.id;
  if (!submissionId) {
    const { data: submission, error } = await admin
      .from("assessment_submissions")
      .insert({
        progress_id: session.progress_id,
        assessment_id: assessmentId,
        text_answer: feedback,
        metadata: {
          ai_chat_session_id: session.id,
          completion_percentage: completionPercentage,
          completion_evidence: evidence,
          criteria_met: criteriaMet,
        },
      })
      .select("id")
      .single();
    if (error || !submission) throw new Error(error?.message || "Could not submit AI Chat");
    submissionId = submission.id;
  }

  const shouldPass = autoPass && criteriaMet;
  await admin
    .from("student_node_progress")
    .update({
      status: shouldPass ? "passed" : "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", session.progress_id)
    .eq("node_id", nodeId);

  if (shouldPass && submissionId) {
    const { data: existingGrade } = await admin
      .from("submission_grades")
      .select("id")
      .eq("submission_id", submissionId)
      .maybeSingle();
    if (!existingGrade) {
      await admin.from("submission_grades").insert({
        submission_id: submissionId,
        graded_by: null,
        grade: "pass",
        rating: 5,
        points_awarded: null,
        comments: feedback || "AI Chat completion criteria met.",
      });
    }
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { assessmentId } = await params;
    const authorized = await getAuthorizedAssessment(assessmentId);
    if ("error" in authorized) {
      return NextResponse.json({ error: authorized.error }, { status: authorized.status });
    }

    const config = resolveMapAIChatConfig(
      authorized.assessment.metadata as AIChatAssessmentMetadata | null,
    );
    const admin = createAdminClient();
    const { data: session } = await admin
      .from("node_ai_chat_sessions")
      .select("*")
      .eq("assessment_id", assessmentId)
      .eq("user_id", authorized.user.id)
      .maybeSingle();

    const messages = session ? await loadMessages(session.id, admin) : [];
    return NextResponse.json({
      session,
      messages,
      objective: config.objective,
      opening_message: config.openingMessage,
      max_turns: config.maxTurns,
    });
  } catch (error) {
    console.error("[Map AI Chat] GET failed", error);
    return NextResponse.json({ error: "Could not load the AI Chat" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { assessmentId } = await params;
    const authorized = await getAuthorizedAssessment(assessmentId);
    if ("error" in authorized) {
      return NextResponse.json(
        { error: authorized.error },
        { status: authorized.status },
      );
    }

    const config = resolveMapAIChatConfig(
      authorized.assessment.metadata as AIChatAssessmentMetadata | null,
    );
    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin
      .from("node_ai_chat_sessions")
      .select("id, is_completed")
      .eq("assessment_id", assessmentId)
      .eq("user_id", authorized.user.id)
      .maybeSingle();

    if (sessionError) throw new Error(sessionError.message);
    if (session?.is_completed) {
      return NextResponse.json(
        { error: "A completed AI Chat cannot be reset" },
        { status: 409 },
      );
    }

    if (session) {
      const { data: deletedSession, error: deleteError } = await admin
        .from("node_ai_chat_sessions")
        .delete()
        .eq("id", session.id)
        .eq("assessment_id", assessmentId)
        .eq("user_id", authorized.user.id)
        .eq("is_completed", false)
        .select("id")
        .maybeSingle();
      if (deleteError) throw new Error(deleteError.message);
      if (!deletedSession) {
        return NextResponse.json(
          { error: "A completed AI Chat cannot be reset" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({
      reset: true,
      objective: config.objective,
      opening_message: config.openingMessage,
      max_turns: config.maxTurns,
    });
  } catch (error) {
    console.error("[Map AI Chat] DELETE failed", error);
    return NextResponse.json(
      { error: "Could not reset the AI Chat. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { assessmentId } = await params;
    const parsed = aiChatRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Message must be between 1 and 2,000 characters" }, { status: 400 });
    }

    const authorized = await getAuthorizedAssessment(assessmentId);
    if ("error" in authorized) {
      return NextResponse.json({ error: authorized.error }, { status: authorized.status });
    }

    const config = resolveMapAIChatConfig(
      authorized.assessment.metadata as AIChatAssessmentMetadata | null,
    );
    const admin = createAdminClient();
    const progress = await getOrCreateProgress(
      authorized.user.id,
      authorized.assessment.node_id,
      admin,
    );
    const session = await getOrCreateSession({
      assessmentId,
      progressId: progress.id,
      userId: authorized.user.id,
      objective: config.objective,
      openingMessage: config.openingMessage,
      admin,
    });

    if (session.is_completed) {
      return NextResponse.json({ error: "This AI Chat is already complete" }, { status: 409 });
    }
    if (session.turn_count >= config.maxTurns) {
      return NextResponse.json({ error: "This AI Chat has reached its turn limit" }, { status: 409 });
    }

    const history = await loadMessages(session.id, admin);
    const messages = [
      ...history.map((message: any) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
      { role: "user" as const, content: parsed.data.message },
    ];

    let object;
    try {
      const { object: providerObject } = await generateObject({
        model: getKimiModel(),
        schema: aiChatProviderTurnSchema,
        system: buildMapAIChatSystemPrompt(config),
        messages,
        temperature: 0.4,
        maxOutputTokens: 1200,
      });
      object = normalizeAIChatTurnResponse(providerObject);
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error) || !error.text?.trim()) {
        throw error;
      }

      console.warn(
        "[Map AI Chat] Provider returned plain text; continuing without turn evaluation",
      );
      try {
        object = parseAIChatTurnResponse(error.text);
      } catch {
        object = createPlainTextAIChatTurn(
          error.text,
          session.completion_percentage || 0,
        );
      }
    }

    object = {
      ...object,
      reply: await ensureEnglishStudentText(object.reply),
    };

    const nextTurnCount = session.turn_count + 1;
    const reachedTurnLimit = nextTurnCount >= config.maxTurns;
    const isCompleted = object.isComplete || reachedTurnLimit;
    const completionReason = object.isComplete ? "criteria_met" : reachedTurnLimit ? "max_turns" : null;
    const evaluationFeedback = reachedTurnLimit && !object.isComplete
      ? `${object.feedback || "Your conversation is ready for instructor review."} The maximum number of turns was reached.`
      : object.feedback;

    const completedTranscript = [
      ...messages,
      { role: "assistant" as const, content: object.reply },
    ];
    const studentFeedback = isCompleted && config.feedbackEnabled
      ? await generateFinalFeedback({
          config,
          messages: completedTranscript,
          fallback:
            evaluationFeedback ||
            "Thank you for completing the conversation. Your instructor can review your responses with you.",
        })
      : null;
    const submissionFeedback = studentFeedback || evaluationFeedback;

    const { error: messageError } = await admin.from("node_ai_chat_messages").insert([
      { session_id: session.id, role: "user", content: parsed.data.message },
      { session_id: session.id, role: "assistant", content: object.reply },
    ]);
    if (messageError) throw new Error(messageError.message);

    const now = new Date().toISOString();
    const { data: updatedSession, error: sessionError } = await admin
      .from("node_ai_chat_sessions")
      .update({
        turn_count: nextTurnCount,
        completion_percentage: object.isComplete ? 100 : object.completionPercentage,
        is_completed: isCompleted,
        completion_reason: completionReason,
        final_feedback: studentFeedback,
        completion_evidence: isCompleted ? object.evidence : null,
        completed_at: isCompleted ? now : null,
        updated_at: now,
      })
      .eq("id", session.id)
      .eq("user_id", authorized.user.id)
      .select("*")
      .single();
    if (sessionError || !updatedSession) throw new Error(sessionError?.message || "Could not update chat session");

    if (isCompleted) {
      await createCompletionSubmission({
        session: updatedSession,
        assessmentId,
        nodeId: authorized.assessment.node_id,
        autoPass: config.autoPass,
        criteriaMet: object.isComplete,
        feedback: submissionFeedback,
        evidence: object.evidence,
        completionPercentage: object.isComplete ? 100 : object.completionPercentage,
        admin,
      });
    }

    return NextResponse.json({
      message: object.reply,
      completion_percentage: updatedSession.completion_percentage,
      is_completed: updatedSession.is_completed,
      completion_reason: updatedSession.completion_reason,
      feedback: updatedSession.final_feedback,
      turn_count: updatedSession.turn_count,
      max_turns: config.maxTurns,
    });
  } catch (error) {
    console.error("[Map AI Chat] POST failed", error);
    const message = error instanceof Error && /KIMI_API_KEY/.test(error.message)
      ? "Kimi is not configured on the server"
      : "The AI mentor is unavailable right now. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
