export type RadarWysiwygDraft = {
  field: Record<string, unknown>;
  cards: Array<Record<string, unknown>>;
};

export type RadarDraftReadResult<TCanonical> = {
  status: "draft" | "canonical";
  draft: RadarWysiwygDraft | null;
  revision: number | null;
  updatedAt: string | null;
  canonical: TCanonical | null;
};

export interface RadarDraftStore<TCanonical> {
  read(fieldId: string): Promise<RadarDraftReadResult<TCanonical>>;
  save(
    fieldId: string,
    draft: RadarWysiwygDraft,
    actorId: string,
    expectedRevision: number | null
  ): Promise<{ revision: number; updatedAt: string }>;
}

export function createRadarDraftStore<TCanonical>({
  loadCanonical,
  loadDraft,
  persistDraft,
}: {
  loadCanonical: (fieldId: string) => Promise<TCanonical | null>;
  loadDraft: (fieldId: string) => Promise<{
    content: RadarWysiwygDraft;
    revision: number;
    updated_at: string;
  } | null>;
  persistDraft: (input: {
    fieldId: string;
    content: RadarWysiwygDraft;
    actorId: string;
    expectedRevision: number | null;
  }) => Promise<{ revision: number; updated_at: string }>;
}): RadarDraftStore<TCanonical> {
  return {
    async read(fieldId) {
      const [canonical, draft] = await Promise.all([
        loadCanonical(fieldId),
        loadDraft(fieldId),
      ]);
      return {
        status: draft ? "draft" : "canonical",
        draft: draft?.content ?? null,
        revision: draft?.revision ?? null,
        updatedAt: draft?.updated_at ?? null,
        canonical,
      };
    },
    async save(fieldId, draft, actorId, expectedRevision) {
      const saved = await persistDraft({
        fieldId,
        content: draft,
        actorId,
        expectedRevision,
      });
      return { revision: saved.revision, updatedAt: saved.updated_at };
    },
  };
}
