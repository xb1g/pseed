import type { MetaAttachmentType } from "@/lib/meta/graph";

export type UploadDmAttachmentResult =
  | { ok: true; url: string; attachmentType: MetaAttachmentType }
  | { ok: false; error: string };

/**
 * Uploads a pasted/picked file (image, video, audio, or generic file) to
 * Supabase Storage via the admin API route and returns its public URL and
 * classified Meta attachment type, ready to hand to replyToLead.
 */
export async function uploadDmAttachment(
  file: File,
  conversationId: string
): Promise<UploadDmAttachmentResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversationId", conversationId);

  try {
    const res = await fetch("/api/admin/dm-leads/upload-image", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json.error || "Failed to upload file" };
    }
    return { ok: true, url: json.url, attachmentType: json.attachmentType };
  } catch {
    return { ok: false, error: "Failed to upload file" };
  }
}
