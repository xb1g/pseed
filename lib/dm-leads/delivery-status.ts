import type { DmMessage } from "@/types/dm-leads";

/**
 * Checks whether an outbound message failed to deliver specifically because
 * the Instagram user's account does not accept DMs from non-contacts / accounts they don't follow.
 */
export function isDeliveryBlockedByPrivacy(
  message?: Pick<DmMessage, "send_status" | "body" | "metadata"> | null
): boolean {
  if (!message) return false;

  const body = typeof message.body === "string" ? message.body.toLowerCase() : "";
  if (
    body.includes("don't allow new message requests from everyone") ||
    body.includes("can't receive your message") ||
    body.includes("privacy")
  ) {
    return true;
  }

  const metaError =
    message.metadata && typeof (message.metadata as Record<string, unknown>).send_error === "string"
      ? ((message.metadata as Record<string, unknown>).send_error as string).toLowerCase()
      : "";

  if (
    metaError.includes("don't allow new message requests") ||
    metaError.includes("2534019") ||
    metaError.includes("cannot receive") ||
    metaError.includes("privacy")
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether a message failed to send or deliver.
 */
export function isDeliveryFailed(
  message?: Pick<DmMessage, "send_status" | "body" | "metadata"> | null
): boolean {
  if (!message) return false;
  return message.send_status === "failed" || isDeliveryBlockedByPrivacy(message);
}

/**
 * Checks whether any outbound message in the thread has suffered a delivery failure.
 */
export function hasThreadDeliveryFailure(messages?: DmMessage[] | null): boolean {
  if (!messages || messages.length === 0) return false;
  return messages.some((m) => m.direction === "outbound" && isDeliveryFailed(m));
}

/**
 * Returns the default friendly public comment reply prompting the student
 * to initiate a DM since Instagram blocked our outbound message.
 */
export function getDefaultPublicCommentReply(username?: string | null): string {
  const mention = username ? `@${username} ` : "";
  return `${mention}พอดีน้องตั้งค่า privacy ไม่เปิดรับ DM จากคนแปลกหน้า พี่เลยส่ง DM หาไม่ได้ 🥺 รบกวนน้องกดทัก DM พี่มาก่อนได้เลยน้า เดี๋ยวพี่ส่งข้อมูล/แนะนำให้ครับ! 📩✨`;
}

export async function getPersonalizedPublicCommentReply(lead: {
  username?: string | null;
  displayName?: string | null;
  gradeLevel?: string | null;
  interests?: string[];
}): Promise<string> {
  const { personalizeMessage } = await import("@/lib/dm-leads/personalize");
  return personalizeMessage({
    template: getDefaultPublicCommentReply(lead.username),
    lead: {
      displayName: lead.displayName,
      username: lead.username,
      gradeLevel: lead.gradeLevel,
      interests: lead.interests,
    },
    kind: "public_comment",
  });
}
