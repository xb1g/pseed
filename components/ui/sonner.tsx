"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";

const MOBILE_QUERY = "(max-width: 639px)";

/** Clears the 64px sticky app navbar */
const DESKTOP_OFFSET = 80;
// The mobile equivalent lives in globals.css: sonner writes
// --mobile-offset-top as an inline style, so a prop can't outrank it.

/**
 * App toaster.
 *
 * Toasts anchor to the top on every breakpoint. The bottom edge belongs to
 * sticky primary actions (the PathLab action bar, the seed CTA), and a bottom
 * toast landed directly on top of the button the student needed next.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <Sonner
      theme="dark"
      position={isMobile ? "top-center" : "top-right"}
      offset={DESKTOP_OFFSET}
      duration={3500}
      visibleToasts={3}
      gap={10}
      closeButton
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" />,
        error: <CircleAlert className="h-[18px] w-[18px] text-rose-400" />,
        warning: <TriangleAlert className="h-[18px] w-[18px] text-amber-400" />,
        info: <Info className="h-[18px] w-[18px] text-sky-400" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:items-start group-[.toaster]:gap-3 group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:bg-[#17171a]/95 group-[.toaster]:p-4 group-[.toaster]:text-white group-[.toaster]:shadow-[0_12px_40px_rgba(0,0,0,0.55)] group-[.toaster]:backdrop-blur-xl",
          title:
            "group-[.toast]:text-[14px] group-[.toast]:font-semibold group-[.toast]:leading-5",
          description:
            "group-[.toast]:mt-1 group-[.toast]:text-[13px] group-[.toast]:leading-5 group-[.toast]:text-neutral-400",
          icon: "group-[.toast]:mt-0.5",
          actionButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-white group-[.toast]:px-3 group-[.toast]:text-[13px] group-[.toast]:font-semibold group-[.toast]:text-black",
          cancelButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-white/[0.06] group-[.toast]:px-3 group-[.toast]:text-[13px] group-[.toast]:text-neutral-300",
          closeButton:
            "group-[.toast]:border-white/10 group-[.toast]:bg-[#17171a] group-[.toast]:text-neutral-400 group-[.toast]:hover:text-white",
          success: "group-[.toaster]:border-emerald-400/25",
          error: "group-[.toaster]:border-rose-400/30",
          warning: "group-[.toaster]:border-amber-400/30",
          info: "group-[.toaster]:border-sky-400/25",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
