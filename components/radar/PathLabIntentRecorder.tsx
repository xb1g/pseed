"use client";

import { useEffect } from "react";
import { getRadarField, recordRadarPathIntent } from "@/lib/supabase/radar";

/**
 * Records that someone landed on a PathLab page from Radar. Fire-and-forget:
 * a failed write must never block the page it sits on.
 */
export function PathLabIntentRecorder({
  fieldSlug,
  pathSlug,
  buttonLabel,
}: {
  fieldSlug: string;
  pathSlug: string;
  buttonLabel: string;
}) {
  useEffect(() => {
    let cancelled = false;

    const record = async () => {
      try {
        const field = await getRadarField(fieldSlug);
        if (cancelled) return;
        await recordRadarPathIntent({
          fieldSlug,
          fieldId: field?.id,
          pathSlug,
          buttonLabel,
        });
      } catch (error) {
        console.error(`Error recording ${pathSlug} path intent:`, error);
      }
    };

    void record();

    return () => {
      cancelled = true;
    };
  }, [fieldSlug, pathSlug, buttonLabel]);

  return null;
}
