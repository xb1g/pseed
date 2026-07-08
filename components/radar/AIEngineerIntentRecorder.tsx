"use client";

import { useEffect } from "react";
import { getRadarField, recordRadarPathIntent } from "@/lib/supabase/radar";

const FIELD_SLUG = "ai-engineer";
const PATH_SLUG = "ai-engineer";

export function AIEngineerIntentRecorder() {
  useEffect(() => {
    let cancelled = false;

    const record = async () => {
      try {
        const field = await getRadarField(FIELD_SLUG);
        if (cancelled) return;
        await recordRadarPathIntent({
          fieldSlug: FIELD_SLUG,
          fieldId: field?.id,
          pathSlug: PATH_SLUG,
          buttonLabel: "ai-engineer-path-page",
        });
      } catch (error) {
        console.error("Error recording AI Engineer path intent:", error);
      }
    };

    void record();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
