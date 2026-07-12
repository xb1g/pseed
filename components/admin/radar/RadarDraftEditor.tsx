"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Plus, Save } from "lucide-react";

type CanonicalField = {
  field: Record<string, unknown>;
  cards: Array<Record<string, unknown>>;
};

type Recommendation = {
  id: string;
  type: "youtube" | "resource";
  titleTh: string;
  titleEn: string;
  url: string;
  ctaTh: string;
  ctaEn: string;
};

function BilingualFields({
  label,
  thai,
  english,
  onThaiChange,
  onEnglishChange,
}: {
  label: string;
  thai: string;
  english: string;
  onThaiChange: (value: string) => void;
  onEnglishChange: (value: string) => void;
}) {
  return (
    <fieldset className="grid gap-3 md:grid-cols-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="space-y-1.5">
        <Label>ไทย</Label>
        <Input value={thai} onChange={(event) => onThaiChange(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>English</Label>
        <Input
          value={english}
          onChange={(event) => onEnglishChange(event.target.value)}
        />
      </div>
    </fieldset>
  );
}

export function RadarDraftEditor({
  canonical,
}: {
  canonical: CanonicalField;
}) {
  const field = canonical.field;
  const [language, setLanguage] = useState<"th" | "en">("th");
  const [nameTh, setNameTh] = useState(String(field.name_th ?? ""));
  const [nameEn, setNameEn] = useState(String(field.name_en ?? ""));
  const [taglineTh, setTaglineTh] = useState(String(field.tagline_th ?? ""));
  const [taglineEn, setTaglineEn] = useState(String(field.tagline_en ?? ""));
  const [tags, setTags] = useState(
    Array.isArray(field.tags) ? field.tags.join(", ") : ""
  );
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const preview = useMemo(
    () => ({
      name: language === "th" ? nameTh : nameEn,
      tagline: language === "th" ? taglineTh : taglineEn,
    }),
    [language, nameTh, nameEn, taglineTh, taglineEn]
  );

  const addRecommendation = () => {
    setRecommendations((items) => [
      ...items,
      {
        id: `recommendation-${items.length + 1}`,
        type: "youtube",
        titleTh: "",
        titleEn: "",
        url: "",
        ctaTh: "",
        ctaEn: "",
      },
    ]);
  };

  const updateRecommendation = (
    index: number,
    patch: Partial<Recommendation>
  ) => {
    setRecommendations((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 space-y-5">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Draft workspace</h2>
              <p className="text-sm text-muted-foreground">
                Editing is available, saving waits for versioned draft storage.
              </p>
            </div>
            <Button disabled>
              <Save className="mr-2 h-4 w-4" />
              Save draft
            </Button>
          </div>
        </div>

        <Tabs defaultValue="identity">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="start">Start here</TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-6 rounded-lg border p-5">
            <BilingualFields
              label="Field name"
              thai={nameTh}
              english={nameEn}
              onThaiChange={setNameTh}
              onEnglishChange={setNameEn}
            />
            <BilingualFields
              label="Tagline"
              thai={taglineTh}
              english={taglineEn}
              onThaiChange={setTaglineTh}
              onEnglishChange={setTaglineEn}
            />
            <div className="space-y-1.5">
              <Label htmlFor="radar-tags">Tags, comma separated</Label>
              <Input
                id="radar-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="rounded-lg border p-5">
            <h3 className="font-semibold">Metrics and explanations</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Each metric requires a visible value, bilingual label, plain-language
              explanation, and source URL. Structured metric rows will connect to
              versioned storage when available.
            </p>
          </TabsContent>

          <TabsContent value="cards" className="space-y-3 rounded-lg border p-5">
            <h3 className="font-semibold">Content cards</h3>
            {canonical.cards.map((card, index) => (
              <details key={String(card.id)} className="rounded-md border p-4">
                <summary className="cursor-pointer font-medium">
                  {index + 1}. {String(card.kind ?? "text")}
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Textarea
                    aria-label={`Card ${index + 1} Thai content`}
                    defaultValue={JSON.stringify(card.content_th ?? {}, null, 2)}
                    rows={6}
                  />
                  <Textarea
                    aria-label={`Card ${index + 1} English content`}
                    defaultValue={JSON.stringify(card.content_en ?? {}, null, 2)}
                    rows={6}
                  />
                </div>
              </details>
            ))}
          </TabsContent>

          <TabsContent value="skills" className="rounded-lg border p-5">
            <h3 className="font-semibold">Skill progression</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add foundation, working, and advanced skills as short bilingual rows.
            </p>
          </TabsContent>

          <TabsContent value="start" className="space-y-4 rounded-lg border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Start recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Add a YouTube video or another trusted resource, then write the
                  learner intent in first-person CTA language.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addRecommendation}>
                <Plus className="mr-2 h-4 w-4" />
                Add recommendation
              </Button>
            </div>
            {recommendations.map((item, index) => (
              <div key={item.id} className="space-y-4 rounded-md border p-4">
                <div className="flex gap-2">
                  {(["youtube", "resource"] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      size="sm"
                      variant={item.type === type ? "default" : "outline"}
                      onClick={() => updateRecommendation(index, { type })}
                    >
                      {type === "youtube" ? "YouTube" : "Resource"}
                    </Button>
                  ))}
                </div>
                <BilingualFields
                  label="Recommendation title"
                  thai={item.titleTh}
                  english={item.titleEn}
                  onThaiChange={(value) =>
                    updateRecommendation(index, { titleTh: value })
                  }
                  onEnglishChange={(value) =>
                    updateRecommendation(index, { titleEn: value })
                  }
                />
                <div className="space-y-1.5">
                  <Label>Resource URL</Label>
                  <Input
                    type="url"
                    value={item.url}
                    onChange={(event) =>
                      updateRecommendation(index, { url: event.target.value })
                    }
                  />
                </div>
                <BilingualFields
                  label="Intent CTA, for example “I want to try…”"
                  thai={item.ctaTh}
                  english={item.ctaEn}
                  onThaiChange={(value) =>
                    updateRecommendation(index, { ctaTh: value })
                  }
                  onEnglishChange={(value) =>
                    updateRecommendation(index, { ctaEn: value })
                  }
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </section>

      <aside className="h-fit space-y-4 rounded-lg border bg-muted/10 p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Preview</h2>
          <div className="flex gap-1">
            {(["th", "en"] as const).map((locale) => (
              <Button
                key={locale}
                size="sm"
                variant={language === locale ? "default" : "outline"}
                onClick={() => setLanguage(locale)}
              >
                {locale === "th" ? "ไทย" : "EN"}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-md border bg-background p-4">
          <div className="text-3xl">{String(field.emoji ?? "◌")}</div>
          <h3 className="text-xl font-semibold">{preview.name || "Untitled field"}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {preview.tagline || "Add a concise field promise."}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
              .map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
          </div>
        </div>
        <Button asChild variant="outline" className="w-full">
          <a href={`/radar/${String(field.slug ?? "")}`} target="_blank" rel="noreferrer">
            View published page
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </aside>
    </div>
  );
}
