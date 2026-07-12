export type RadarEditorCard = {
  id: string;
  kind: string;
  position: number;
  content_th?: Record<string, unknown> | null;
  content_en?: Record<string, unknown> | null;
  is_hidden?: boolean | null;
  [key: string]: unknown;
};

function updateValueAtPath(
  current: unknown,
  path: string[],
  value: unknown
): unknown {
  if (path.length === 0) return value;

  const [segment, ...remaining] = path;
  if (Array.isArray(current)) {
    const index = Number(segment);
    if (!Number.isInteger(index) || index < 0) return current;
    const next = [...current];
    next[index] = updateValueAtPath(next[index], remaining, value);
    return next;
  }

  const object =
    current && typeof current === "object"
      ? { ...(current as Record<string, unknown>) }
      : {};
  object[segment] = updateValueAtPath(object[segment], remaining, value);
  return object;
}

export function updateRadarEditorContent<T extends RadarEditorCard>(
  card: T,
  locale: "th" | "en",
  path: string[],
  value: unknown
): T {
  const key = locale === "th" ? "content_th" : "content_en";
  const content = (card[key] as Record<string, unknown> | null) ?? {};
  return {
    ...card,
    [key]: updateValueAtPath(content, path, value) as Record<string, unknown>,
  };
}

export function moveRadarEditorCard<T extends RadarEditorCard>(
  cards: T[],
  index: number,
  direction: -1 | 1
): T[] {
  const target = index + direction;
  if (index < 0 || index >= cards.length || target < 0 || target >= cards.length) {
    return cards;
  }
  const next = [...cards];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((card, cardIndex) => ({ ...card, position: cardIndex * 10 }));
}
