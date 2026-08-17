import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { type FieldCard } from "@/lib/content/pathlab-page";
import {
  PARENTS_FIELDS,
  PARENTS_FIELD_CARDS,
} from "@/lib/content/pathlab-parents";
import { ParentsNote, ParentsSection, SectionHeading } from "./section";

/**
 * The menu of paths, read-only. Parents choose a direction, not a curriculum,
 * so the tiles carry only the field name; the full five-day breakdown stays
 * on the student page one link away.
 */
export function ParentsFields() {
  return (
    <ParentsSection labelledBy="parents-fields">
      <SectionHeading
        id="parents-fields"
        eyebrow={PARENTS_FIELDS.eyebrow}
        title={PARENTS_FIELDS.title}
      />

      <FieldGroup label={PARENTS_FIELDS.openLabel} fields={PARENTS_FIELD_CARDS} />

      <Link
        href="/pathlab#pathlab-fields"
        className="mt-8 inline-flex min-h-11 items-center gap-2 font-bai-jamjuree text-sm font-semibold text-blue-200 transition-colors hover:text-white"
      >
        {PARENTS_FIELDS.cta}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>

      <ParentsNote tilt="pathlab-note--tilt-l-sm">
        {PARENTS_FIELDS.note}
      </ParentsNote>
    </ParentsSection>
  );
}

function FieldGroup({
  label,
  fields,
}: {
  label: string;
  fields: FieldCard[];
}) {
  if (fields.length === 0) return null;

  return (
    <div className="mt-10">
      <p className="font-space-mono text-xs uppercase tracking-[0.18em] text-blue-200/70">
        {label}
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {fields.map((field) => (
          <li
            key={field.label}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60"
          >
            <div className="relative aspect-[4/3]">
              {field.src ? (
                <Image
                  src={field.src}
                  alt={field.alt ?? field.label}
                  fill
                  sizes="(max-width: 640px) 45vw, 220px"
                  className="object-cover"
                />
              ) : null}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"
              />
              <p className="absolute inset-x-0 bottom-0 p-3 font-kodchasan text-sm font-medium leading-snug text-white">
                {field.label}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
