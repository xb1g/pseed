import { notFound } from "next/navigation";
import { RadarDraftEditor } from "@/components/admin/radar/RadarDraftEditor";
import { loadCanonicalRadarField } from "@/lib/radar/admin-canonical";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function RadarFieldEditorPage({
  params,
}: {
  params: Promise<{ fieldId: string }>;
}) {
  const { fieldId } = await params;
  const supabase = await createClient();
  const canonical = await loadCanonicalRadarField(supabase, fieldId);

  if (!canonical) notFound();

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-muted-foreground">Career Radar content</p>
        <h2 className="text-2xl font-semibold">
          {String(canonical.field.name_en ?? canonical.field.slug ?? "Field")}
        </h2>
      </header>
      <RadarDraftEditor canonical={canonical} />
    </div>
  );
}
