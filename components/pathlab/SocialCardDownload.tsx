"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

interface SocialCardDownloadProps {
  /** Id of the fixed-size node to capture. */
  targetId: string;
  /** Downloaded file name, without the .png extension. */
  fileName?: string;
  /**
   * Capture size in CSS px. Omit for canvases sized in physical units (mm),
   * where the node is measured at render time instead.
   */
  width?: number;
  height?: number;
  /** Multiplier on the captured resolution. 2 gives a print-usable sheet. */
  scale?: number;
  /** Button copy. The size hint is appended by the caller if wanted. */
  label?: string;
}

/**
 * Downloads a fixed-size card or sheet as a PNG. The preview scaler transforms
 * only its wrapper, never the captured node, so the export stays at natural
 * resolution regardless of screen size.
 *
 * Canvases authored in px (the 1200×630 social card) pass their size in.
 * Canvases authored in mm (the A4 poster) omit it and are measured from the
 * live node, since mm resolves to a device-dependent pixel count.
 */
export function SocialCardDownload({
  targetId,
  fileName = "pathlab-social-1200x630",
  width,
  height,
  scale = 1,
  label = "ดาวน์โหลด PNG (1200×630)",
}: SocialCardDownloadProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    const node = document.getElementById(targetId);
    if (!node || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      /* Make sure Kodchasan/Bai Jamjuree are loaded before the capture
         inlines them, or the PNG falls back to a system font. */
      await document.fonts.ready;

      /* getBoundingClientRect would report the scaler's transform; offset*
         gives the node's own untransformed layout size. */
      const captureWidth = width ?? node.offsetWidth;
      const captureHeight = height ?? node.offsetHeight;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: scale,
        width: captureWidth,
        height: captureHeight,
        canvasWidth: captureWidth * scale,
        canvasHeight: captureHeight * scale,
      });
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("PNG export failed:", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pathlab-social__actions">
      <button
        type="button"
        className="pathlab-social__download"
        onClick={download}
        disabled={busy}
      >
        {busy ? "กำลังสร้าง PNG…" : label}
      </button>
      {failed && (
        <p className="pathlab-social__error" role="alert">
          สร้าง PNG ไม่สำเร็จ ลองอีกครั้ง
        </p>
      )}
    </div>
  );
}
