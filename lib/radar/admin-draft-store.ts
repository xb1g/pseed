import type { RadarContentDraft } from "@/lib/radar/admin-content";

export class RadarDraftNotConfiguredError extends Error {
  readonly code = "RADAR_DRAFT_PERSISTENCE_NOT_CONFIGURED";

  constructor() {
    super(
      "Radar draft persistence is not configured. Apply the radar_drafts/radar_versions schema before saving."
    );
    this.name = "RadarDraftNotConfiguredError";
  }
}

export type RadarDraftReadResult<TCanonical> = {
  status: "not_configured";
  draft: null;
  canonical: TCanonical | null;
};

export interface RadarDraftStore<TCanonical> {
  read(fieldId: string): Promise<RadarDraftReadResult<TCanonical>>;
  save(
    fieldId: string,
    draft: RadarContentDraft,
    actorId: string
  ): Promise<never>;
}

export function createRadarDraftStore<TCanonical>({
  loadCanonical,
}: {
  loadCanonical: (fieldId: string) => Promise<TCanonical | null>;
}): RadarDraftStore<TCanonical> {
  return {
    async read(fieldId) {
      return {
        status: "not_configured",
        draft: null,
        canonical: await loadCanonical(fieldId),
      };
    },
    async save() {
      throw new RadarDraftNotConfiguredError();
    },
  };
}
