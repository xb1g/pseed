// Shared image upload helper for the learning-material editors. Posts to the
// existing Backblaze B2 pipeline (app/api/upload/images) and resolves with the
// public URL. Throws with the server's error message on failure so callers can
// surface it in a toast.

export interface UploadedImage {
  fileUrl: string;
  fileName: string;
}

export async function uploadImage(
  file: File,
  nodeId: string,
): Promise<UploadedImage> {
  const formData = new FormData();
  const ext = file.type.split("/")[1] || "png";
  const fileName = `pasted-image-${Date.now()}.${ext}`;
  formData.append("file", file, fileName);
  formData.append("nodeId", nodeId);

  const res = await fetch("/api/upload/images", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  if (!data.fileUrl) {
    throw new Error("Upload did not return a file URL");
  }

  return { fileUrl: data.fileUrl, fileName: data.fileName || fileName };
}
