type RadarCollectionFilter = {
  key: string;
  label_th: string | null;
  label_en: string | null;
};

type RadarFilterField = {
  tags: string[] | null;
  name_th: string | null;
  name_en: string | null;
  tagline_th: string | null;
  tagline_en: string | null;
};

export function normalizeRadarCollections<T extends RadarCollectionFilter>(
  collections: T[]
): { allLabel: string; filters: T[] } {
  const all = collections.find((collection) => collection.key === "all");
  return {
    allLabel: all?.label_th || all?.label_en || "ทั้งหมด",
    filters: collections.filter((collection) => collection.key !== "all"),
  };
}

export function filterRadarFields<T extends RadarFilterField>(
  fields: T[],
  collectionKey: string | null,
  searchQuery: string
): T[] {
  const query = searchQuery.trim().toLocaleLowerCase();

  return fields.filter((field) => {
    if (collectionKey && !(field.tags ?? []).includes(collectionKey)) return false;
    if (!query) return true;
    return [field.name_th, field.name_en, field.tagline_th, field.tagline_en]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
}
