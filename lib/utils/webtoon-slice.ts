import type { WebtoonPanel, WebtoonBody } from "@/types/map";

// A webtoon is one very long vertical image. Two hard limits make uploading it
// whole a bad idea:
//   1. /api/upload/images caps a single file at 10MB, and a 1080x20000 panel
//      strip lands well past that.
//   2. Browsers cap how tall an image they will decode (Safari on iOS is the
//      strictest). Past the ceiling the <img> silently renders blank.
// So we cut the strip into ordered panels on the client before uploading. The
// reader stacks them back with no gap, and gets lazy loading for free.

// Max height of one slice. Comfortably under every browser's decode ceiling,
// and small enough that each WebP chunk stays a few hundred KB.
export const PANEL_MAX_HEIGHT = 2000;

// Refuse inputs that are not plausibly a webtoon strip, before we spend time
// decoding them.
export const MAX_SOURCE_HEIGHT = 200_000;
export const MAX_SOURCE_WIDTH = 4096;

export class WebtoonSliceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebtoonSliceError";
  }
}

/**
 * Work out where to cut a strip of `totalHeight` into slices no taller than
 * `maxHeight`. Kept pure and separate from canvas work so the arithmetic is
 * testable on its own.
 *
 * The last slice takes the remainder, so slices tile the strip exactly with no
 * overlap and no gap.
 */
export function planSlices(
  totalHeight: number,
  maxHeight: number = PANEL_MAX_HEIGHT,
): Array<{ y: number; height: number }> {
  if (!Number.isFinite(totalHeight) || totalHeight <= 0) {
    throw new WebtoonSliceError("Image height must be a positive number");
  }
  if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
    throw new WebtoonSliceError("Slice height must be a positive number");
  }

  const slices: Array<{ y: number; height: number }> = [];
  for (let y = 0; y < totalHeight; y += maxHeight) {
    slices.push({ y, height: Math.min(maxHeight, totalHeight - y) });
  }
  return slices;
}

/**
 * Parse the JSON stored in content_body for a webtoon. Returns an empty panel
 * list rather than throwing, so a malformed row degrades to an empty state
 * instead of taking down the whole node view.
 */
export function parseWebtoonBody(contentBody?: string | null): WebtoonBody {
  if (!contentBody?.trim()) return { panels: [] };

  try {
    const parsed = JSON.parse(contentBody);
    const panels = Array.isArray(parsed?.panels) ? parsed.panels : [];

    return {
      panels: panels.filter(
        (p: unknown): p is WebtoonPanel =>
          !!p &&
          typeof p === "object" &&
          typeof (p as WebtoonPanel).url === "string" &&
          (p as WebtoonPanel).url.length > 0 &&
          Number.isFinite((p as WebtoonPanel).w) &&
          Number.isFinite((p as WebtoonPanel).h),
      ),
    };
  } catch {
    return { panels: [] };
  }
}

export function serializeWebtoonBody(panels: WebtoonPanel[]): string {
  return JSON.stringify({ panels } satisfies WebtoonBody);
}

/**
 * Decode a file into a bitmap. createImageBitmap decodes off the main thread
 * and, unlike an <img> element, gives us a hard failure instead of a silently
 * blank draw when the image is too large.
 */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new WebtoonSliceError(
      "Could not read that image. It may be corrupted, or too large for this browser to open.",
    );
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new WebtoonSliceError("Failed to encode a webtoon panel")),
      "image/webp",
      0.9,
    );
  });
}

export interface SliceProgress {
  /** 1-based index of the panel currently being handled. */
  current: number;
  total: number;
  stage: "slicing" | "uploading";
}

export interface SliceAndUploadOptions {
  file: File;
  nodeId: string;
  maxHeight?: number;
  onProgress?: (progress: SliceProgress) => void;
  signal?: AbortSignal;
}

async function uploadPanel(
  blob: Blob,
  index: number,
  nodeId: string,
  signal?: AbortSignal,
): Promise<string> {
  const formData = new FormData();
  const name = `webtoon-${Date.now()}-${String(index).padStart(3, "0")}.webp`;
  formData.append("file", blob, name);
  formData.append("nodeId", nodeId);

  const res = await fetch("/api/upload/images", {
    method: "POST",
    body: formData,
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new WebtoonSliceError(
      err.error || `Panel ${index + 1} failed to upload (${res.status})`,
    );
  }

  const data = await res.json();
  if (!data.fileUrl) {
    throw new WebtoonSliceError(`Panel ${index + 1} uploaded without a URL`);
  }
  return data.fileUrl;
}

/**
 * Slice one long image into panels and upload them in order.
 *
 * Panels upload sequentially rather than in parallel: order matters, a webtoon
 * can be dozens of panels, and firing all of them at B2 at once is how you get
 * throttled. Each panel is encoded right before its own upload so we never hold
 * the whole strip in memory as blobs.
 */
export async function sliceAndUploadWebtoon({
  file,
  nodeId,
  maxHeight = PANEL_MAX_HEIGHT,
  onProgress,
  signal,
}: SliceAndUploadOptions): Promise<WebtoonPanel[]> {
  if (!file.type.startsWith("image/")) {
    throw new WebtoonSliceError("Please choose an image file");
  }

  const bitmap = await decode(file);

  try {
    const { width, height } = bitmap;

    if (width > MAX_SOURCE_WIDTH) {
      throw new WebtoonSliceError(
        `That image is ${width}px wide. Webtoons should be at most ${MAX_SOURCE_WIDTH}px wide.`,
      );
    }
    if (height > MAX_SOURCE_HEIGHT) {
      throw new WebtoonSliceError(
        `That image is ${height}px tall, which is past the ${MAX_SOURCE_HEIGHT}px limit.`,
      );
    }

    const plan = planSlices(height, maxHeight);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new WebtoonSliceError("This browser cannot process images");
    }

    const panels: WebtoonPanel[] = [];

    for (let i = 0; i < plan.length; i++) {
      if (signal?.aborted) throw new WebtoonSliceError("Upload cancelled");

      const { y, height: sliceHeight } = plan[i];

      onProgress?.({ current: i + 1, total: plan.length, stage: "slicing" });

      canvas.width = width;
      canvas.height = sliceHeight;
      ctx.clearRect(0, 0, width, sliceHeight);
      ctx.drawImage(
        bitmap,
        0, y, width, sliceHeight, // source rect
        0, 0, width, sliceHeight, // destination rect
      );

      const blob = await canvasToBlob(canvas);

      onProgress?.({ current: i + 1, total: plan.length, stage: "uploading" });
      const url = await uploadPanel(blob, i, nodeId, signal);

      panels.push({ url, w: width, h: sliceHeight });
    }

    return panels;
  } finally {
    bitmap.close();
  }
}
