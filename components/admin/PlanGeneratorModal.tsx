"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Sparkles,
  Copy,
  Download,
  Send,
  Link as LinkIcon,
  RefreshCw,
  Eye,
  FileImage,
  MessageSquare,
  Compass,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { toBlob, toPng } from "html-to-image";
import { StudentPlanPoster } from "@/components/plans/StudentPlanPoster";
import { PosterScaler } from "@/components/plans/PosterScaler";
import { deriveReadinessScore } from "@/lib/plans/readiness";
import {
  generatePlanDraftAction,
  saveStudentPlanAction,
} from "@/app/admin/dm-leads/actions";
import type { DmConversation } from "@/types/dm-leads";
import type { GeneratedPlanDraft, StudentPlan } from "@/types/student-plan";

interface PlanGeneratorModalProps {
  conversation: DmConversation;
  onInsertReply?: (text: string) => void;
  triggerClassName?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

export function PlanGeneratorModal({
  conversation,
  onInsertReply,
  triggerClassName = "",
  triggerVariant = "outline",
}: PlanGeneratorModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedPlan, setSavedPlan] = useState<StudentPlan | null>(null);

  // Form State
  const defaultName =
    conversation.display_name || conversation.username || "น้อง";
  const defaultGrade = conversation.grade_level || "ม.5";
  const defaultField =
    conversation.interests.length > 0
      ? conversation.interests.join(" / ")
      : "วิศวกรรมศาสตร์";

  const [studentName, setStudentName] = useState(defaultName);
  const [gradeLevel, setGradeLevel] = useState(defaultGrade);
  const [targetField, setTargetField] = useState(defaultField);
  // Derived from the conversation's classification signals (stage, hands-on
  // experience, activities, interests) — the admin can still adjust it.
  const [readinessScore, setReadinessScore] = useState(() =>
    deriveReadinessScore(conversation)
  );

  // Draft State
  const [draft, setDraft] = useState<GeneratedPlanDraft | null>(null);
  const [editedDmCopy, setEditedDmCopy] = useState("");

  const posterRef = useRef<HTMLDivElement>(null);

  // Re-sync form state whenever the active conversation changes
  useEffect(() => {
    const name = conversation.display_name || conversation.username || "น้อง";
    const grade = conversation.grade_level || "ม.5";
    const field =
      conversation.interests.length > 0
        ? conversation.interests.join(" / ")
        : "วิศวกรรมศาสตร์";

    setStudentName(name);
    setGradeLevel(grade);
    setTargetField(field);
    setReadinessScore(
      deriveReadinessScore({
        stage: conversation.stage,
        has_hands_on_experience: conversation.has_hands_on_experience,
        activities_summary: conversation.activities_summary,
        interests: conversation.interests,
      })
    );
    setDraft(null);
    setSavedPlan(null);
  }, [
    conversation.id,
    conversation.display_name,
    conversation.username,
    conversation.grade_level,
    conversation.interests,
    conversation.stage,
    conversation.has_hands_on_experience,
    conversation.activities_summary,
  ]);

  // Generate Draft on load or when opened
  const handleGenerate = useCallback(
    (name = studentName, grade = gradeLevel, field = targetField, readiness = readinessScore) => {
      startTransition(async () => {
        try {
          const result = await generatePlanDraftAction({
            studentName: name,
            gradeLevel: grade,
            targetField: field,
            interests: conversation.interests,
            conversationId: conversation.id,
            readinessScore: readiness,
          });
          setDraft(result);
          setStudentName(result.studentName);
          setGradeLevel(result.gradeLevel);
          setTargetField(result.targetField);
          setEditedDmCopy(result.dmCopy);
          setSavedPlan(null);
        } catch (err) {
          console.error("Failed to generate plan draft:", err);
          toast.error("ไม่สามารถสร้างแผนได้ กรุณาลองใหม่อีกครั้ง");
        }
      });
    },
    [studentName, gradeLevel, targetField, readinessScore, conversation.interests, conversation.id]
  );

  useEffect(() => {
    if (open && !draft) {
      handleGenerate();
    }
  }, [open, draft, handleGenerate]);

  // Save Plan to Supabase
  const handleSavePlan = async (): Promise<StudentPlan | null> => {
    if (!draft) return null;
    if (savedPlan) return savedPlan;

    setIsSaving(true);
    try {
      const res = await saveStudentPlanAction({
        token: draft.token,
        conversation_id: conversation.id,
        student_name: draft.studentName,
        grade_level: draft.gradeLevel,
        target_field: draft.targetField,
        readiness_score: draft.readinessScore,
        ranked_priorities: draft.rankedPriorities,
        timeline: draft.timeline,
        step_one_action: draft.stepOneAction,
        parent_notes: draft.parentNotes,
        custom_advice: draft.customAdvice,
      });

      if (!res.ok || !res.plan) {
        throw new Error(res.error || "Save failed");
      }

      setSavedPlan(res.plan);
      toast.success(`บันทึกแผนสำเร็จ! (Token: ${res.plan.token})`);
      return res.plan;
    } catch (err) {
      console.error("Failed to save plan:", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกแผน");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Plan URL
  const handleCopyLink = async () => {
    const plan = await handleSavePlan();
    if (!plan) return;

    const url = `${window.location.origin}/plan/${plan.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("คัดลอกลิงก์แผนเรียบร้อย!");
    } catch {
      toast.error("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  // Copy Poster PNG Image to Clipboard
  const handleCopyPosterImage = async () => {
    if (!posterRef.current) return;
    setIsCopyingImage(true);

    try {
      const blob = await toBlob(posterRef.current, {
        pixelRatio: 2,
        quality: 1,
      });

      if (!blob) throw new Error("Failed to create image blob");

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      toast.success("คัดลอกรูปภาพโปสเตอร์ (PNG) แล้ว! กดวาง (Cmd+V) ในแชทได้ทันที");
    } catch (err) {
      console.error("Error copying image:", err);
      toast.error("เบราว์เซอร์ไม่อนุญาตให้คัดลอกรูปภาพโดยตรง ให้กด 'ดาวน์โหลด' แทน");
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Download Poster as PNG
  const handleDownloadPoster = async () => {
    if (!posterRef.current || !draft) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        quality: 1,
      });

      const link = document.createElement("a");
      const cleanField = draft.targetField.replace(/[^a-zA-Z0-9ก-๙]/g, "-");
      link.download = `portfolio-plan-${cleanField}-${draft.gradeLevel}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("ดาวน์โหลดรูปภาพโปสเตอร์เรียบร้อย!");
    } catch (err) {
      console.error("Error downloading poster:", err);
      toast.error("ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setIsDownloading(false);
    }
  };

  // Insert DM Copy directly into reply box
  const handleInsertToReply = () => {
    if (!editedDmCopy.trim()) return;
    onInsertReply?.(editedDmCopy);
    setOpen(false);
    toast.success("แทรกข้อความลงในช่องตอบกลับเรียบร้อย!");
  };

  const leadHandle = conversation.username
    ? `@${conversation.username.replace(/^@+/, "")}`
    : conversation.display_name || "Lead";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          title={`สร้างแผนพอร์ตสำหรับ ${leadHandle}`}
          className={`h-8 gap-1.5 border-cyan-500/40 bg-cyan-950/20 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/40 hover:text-cyan-100 ${triggerClassName}`}
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="truncate">⚡ สร้างแผนพอร์ต ({leadHandle})</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Plan & Poster Generator
                </DialogTitle>
                <p className="text-xs text-slate-400">
                  สร้างแผนเตรียมพอร์ต 6 เดือน + โปสเตอร์ และข้อความปิดการขายสำหรับ {leadHandle}
                </p>
              </div>
            </div>
            {draft && (
              <Badge
                variant={draft.isPresell ? "outline" : "default"}
                className={
                  draft.isPresell
                    ? "border-amber-500/50 text-amber-300 bg-amber-950/30"
                    : "bg-emerald-600 text-white"
                }
              >
                {draft.isPresell ? "Pre-sell (299฿ แผนส่งวันนี้)" : "Covered Seed (299฿)"}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
            <span className="text-muted-foreground">กำลังสนทนากับ:</span>
            <span className="font-bold text-cyan-400">{leadHandle}</span>
            <span className="text-slate-600">•</span>
            <span className="capitalize text-slate-400">{conversation.platform}</span>
            {conversation.grade_level && (
              <>
                <span className="text-slate-600">•</span>
                <Badge variant="outline" className="text-[10px] py-0 border-slate-700 text-slate-200">
                  {conversation.grade_level}
                </Badge>
              </>
            )}
            {conversation.interests.length > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="truncate text-slate-400">
                  ความสนใจ: {conversation.interests.join(", ")}
                </span>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Input Parameters Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400">ชื่อนักเรียน / บัญชี</Label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="น้อง..."
              className="h-8 bg-slate-950 border-slate-800 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400">ระดับชั้น</Label>
            <Input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="ม.4, ม.5, ม.6..."
              className="h-8 bg-slate-950 border-slate-800 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400">
              ความพร้อมพอร์ต (1–8) · คำนวณจาก stage ในแชท
            </Label>
            <Input
              type="number"
              min={1}
              max={8}
              value={readinessScore}
              onChange={(e) => {
                const next = Math.min(8, Math.max(1, Number(e.target.value) || 1));
                setReadinessScore(next);
              }}
              className="h-8 bg-slate-950 border-slate-800 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400">สาย / คณะที่สนใจ</Label>
            <div className="flex gap-2">
              <Input
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                placeholder="วิศวะ, นิเทศ, แพทย์..."
                className="h-8 bg-slate-950 border-slate-800 text-xs text-white"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleGenerate(studentName, gradeLevel, targetField)}
                disabled={isPending}
                className="h-8 px-2.5 shrink-0 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs: Poster vs DM Copy vs Details */}
        {draft ? (
          <Tabs defaultValue="poster" className="mt-4">
            <TabsList className="grid grid-cols-3 bg-slate-900 border border-slate-800">
              <TabsTrigger value="poster" className="text-xs data-[state=active]:bg-slate-800">
                <FileImage className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
                รูปโปสเตอร์ (PNG)
              </TabsTrigger>
              <TabsTrigger value="dm_copy" className="text-xs data-[state=active]:bg-slate-800">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                ข้อความส่งใน DM
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs data-[state=active]:bg-slate-800">
                <Compass className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
                รายละเอียดแผน 6 เดือน
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: POSTER PREVIEW */}
            <TabsContent value="poster" className="mt-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Poster Element (Rendered) — scaled preview, full poster always visible */}
                <div className="w-full md:w-[380px] shrink-0 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-[#000006]">
                  <PosterScaler designWidth={1080}>
                    <StudentPlanPoster ref={posterRef} plan={draft} />
                  </PosterScaler>
                </div>

                {/* Actions & Sharing Tools */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      เครื่องมือส่งรูปภาพ & แผน
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      กด <b>&quot;คัดลอกรูปภาพ (PNG)&quot;</b> แล้วนำไปกดวาง (Cmd+V) ในแชท IG หรือ Meta Inbox ได้โดยตรง หรือดาวน์โหลดเป็นไฟล์รูปภาพกว้าง 1080px คมชัดสูง ความสูงปรับตามเนื้อหาอัตโนมัติ
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <Button
                        onClick={handleCopyPosterImage}
                        disabled={isCopyingImage}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-9"
                      >
                        {isCopyingImage ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        คัดลอกรูปภาพ (Copy PNG)
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={handleDownloadPoster}
                        disabled={isDownloading}
                        className="bg-slate-800 hover:bg-slate-700 text-xs h-9"
                      >
                        {isDownloading ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        ดาวน์โหลดรูป (PNG 1080px)
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        เว็บหน้าแผนพอร์ต (สำหรับผู้ปกครอง)
                      </h4>
                      {savedPlan && (
                        <span className="font-mono text-[10px] text-cyan-400">
                          /plan/{savedPlan.token}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      ลิงก์เว็บฉบับเต็มเพื่อให้นักเรียนส่งต่อให้ผู้ปกครองดูความน่าเชื่อถือ
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCopyLink}
                        disabled={isSaving}
                        className="border-indigo-500/50 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/50 text-xs h-9 flex-1"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {savedPlan ? "คัดลอกลิงก์แผน (Copy Link)" : "บันทึก & สร้างลิงก์แผน"}
                      </Button>

                      {savedPlan && (
                        <a
                          href={`/plan/${savedPlan.token}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-9 px-3 bg-slate-800 hover:bg-slate-700 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: DM COPY */}
            <TabsContent value="dm_copy" className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-300">
                    ข้อความสำหรับส่งตอบกลับใน DM (ปรับแต่งได้)
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(editedDmCopy);
                      toast.success("คัดลอกข้อความแล้ว!");
                    }}
                    className="h-7 text-xs text-slate-400 hover:text-white"
                  >
                    <Copy className="mr-1 h-3 w-3" /> คัดลอกข้อความ
                  </Button>
                </div>

                <Textarea
                  value={editedDmCopy}
                  onChange={(e) => setEditedDmCopy(e.target.value)}
                  rows={10}
                  className="font-sans text-xs leading-relaxed bg-slate-900/90 border-slate-800 text-slate-100 p-3.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <Button
                  onClick={handleInsertToReply}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9 px-4"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  ใส่ข้อความลงในช่องตอบกลับ (Insert to Reply Box)
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: DETAILS */}
            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200">
                  3 ลำดับความสำคัญ (Ranked Priorities)
                </h4>
                <div className="space-y-2">
                  {draft.rankedPriorities.map((item) => (
                    <div
                      key={item.rank}
                      className="rounded border border-slate-800 bg-slate-950 p-2.5 text-xs flex justify-between items-start gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-200">
                          {item.rank}. {item.title}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-amber-400 font-mono text-xs shrink-0">
                        {"★".repeat(item.stars)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200">
                  ปฏิทิน 6 เดือน & รายการแข่งขันที่ตรงสาย
                </h4>
                <div className="space-y-2">
                  {draft.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-slate-800 bg-slate-950 p-2.5 text-xs flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-950 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300">
                          {item.month}
                        </span>
                        <span className="text-slate-200 text-xs">{item.title}</span>
                      </div>
                      <span className="text-cyan-400 font-mono text-[10px] shrink-0">
                        {item.deadline}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mb-2" />
            <p className="text-xs">กำลังสร้างแผนพอร์ตและดึงข้อมูลการแข่งขัน...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
