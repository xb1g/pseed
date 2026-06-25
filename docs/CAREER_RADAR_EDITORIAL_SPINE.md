# Career Radar — Editorial Spine

The content rule for every `radar_fields` carousel. Read before writing or editing any field's cards.

## Why this exists

Radar is the **"what the world needs + what it pays"** leg of ikigai. It is **not** the whole compass:

- **Passion** is captured later, via the `reflection` cards in each deck.
- **Mastery** is proven later, when the student actually tries the path (PathLab 7-day squad).

So Radar's only job is to be the **honest external-reality map**. The moment it reads like a salary-flex listicle, a smart 16-year-old discounts the whole thing — and trust is the entire product. (This doc started from a tester reaction: a `104k–200k` headline felt "เวอร์ไป / exaggerated" for a fresh grad because nothing told them what it costs to get there.)

## The four rules

### 1. Money de-heroed
Hooks lead with the **mission / shift**, not the big number. Salary is a supporting stat. Every big number must carry its price tag — years + what it takes — or it reads as hype.

- ❌ Hook stat `104k–200k+` as the headline, no context.
- ✅ Hook leads with the role's purpose; stat labeled `experienced level`; body notes the number is a 4–8yr ceiling, entry starts ~40k.

### 2. Snapshot → trajectory
Salary, jobs, and day-in-life are **today's photo, and it decays**. The practitioner did A, is shifting to B, and the student graduates into C. AI is the force bending the curve. Every snapshot needs a "where this is heading" signal.

### 3. Durable-skill anchor
Each `salaryProgression.note` = **(a) what it takes at that level + (b) the durable skill underneath** that survives A→B→C. Anchor on judgment, framing, decisions under uncertainty — **not** tool mastery (tools churn every 6 months).

### 4. realPeople = real paths, not bios
The strongest, highest-trust card. Show a **time-stamped trajectory**, not a résumé line.

Enriched `realPeople` person shape (`components/radar/RadarCards.tsx`, jsonb — no migration needed):

```ts
{
  name?, role?, background,   // bio (background kept for back-compat)
  salary?,                    // ONLY if the person actually shared it
  path?: [{ year?, label }],  // started → pivots → now
  nowDoing?,                  // daily work + with whom
  whereHeading?,              // where they think the role is going
  advice?,                    // what they wish they'd known
  publisher?, url?            // citation
}
```

**Hard rule: never fabricate a salary or a quote.** A made-up number re-breaks the exact trust this spine exists to build. Empty is better than fake. Real profiles come from interviews / cited threads.

## Reference template

`ai-business` (`สายงานกลยุทธ์และผลิตภัณฑ์ AI`) is the canonical example — hook, `salaryProgression`, and `aiImpact` were reworked to this spine. Copy its shape when applying to other fields.

## Applying to a field

Per field, patch (content-only, both `content_th` + `content_en`):
1. **hook** — reframe to mission-first; label/anchor the salary stat.
2. **salaryProgression** — fill every `note` (rule 3); flag figures as a dated snapshot in the eyebrow.
3. **aiImpact** — make the `verdict` carry the A→B→C shift + the durable skill.
4. **realPeople** — replace bio-only entries with real sourced trajectories as interviews land.

Source each claim against the field's existing `radar_sources` rows; don't invent numbers.
