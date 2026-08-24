"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/ui/dialog";

export interface FullscreenImageViewerProps {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

/**
 * Controlled Radix Dialog that renders a single image fullscreen.
 *
 * The parent owns open state and passes `onClose`; the dialog is mounted only
 * while open so closing fully unmounts it. Radix portals to `document.body`,
 * which keeps it above the `z-10` map container stacking context.
 *
 * The default close button in `DialogContent` is suppressed with `hideClose`
 * so we can render our own top-right close button over the transparent
 * backdrop.
 */
export function FullscreenImageViewer({
  src,
  alt,
  caption,
  onClose,
}: FullscreenImageViewerProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        hideClose
        overlayClassName="bg-black/85 backdrop-blur-sm"
        className="max-w-none max-h-none p-0 bg-transparent border-0 shadow-none
                   data-[state=open]:animate-in data-[state=closed]:animate-out
                   flex items-center justify-center"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="relative z-10 max-w-[95vw] max-h-[90vh] object-contain
                     rounded-lg shadow-2xl select-none"
        />
        {caption ? (
          <p
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
                       text-white/90 text-sm bg-black/40 px-3 py-1 rounded
                       max-w-[90vw] truncate"
          >
            {caption}
          </p>
        ) : null}
        <DialogClose
          aria-label="Close image viewer"
          className="absolute top-4 right-4 z-10 rounded-full p-2
                     text-white/80 hover:text-white
                     bg-black/40 hover:bg-black/60
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white/60 transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}