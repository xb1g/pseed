# Gallery Submission — Build Plan

## Goal
Allow hackathon teams to submit their product to the public gallery from the dashboard.
Admin reviews and publishes. Visitors can express interest.

---

## Current State

### Already exists
- `hackathon_gallery_products` table (migration `20260614000000_hackathon_gallery.sql`)
- `hackathon_gallery_interests` table + interest count trigger
- `lib/hackathon/gallery.ts` — read functions: `getGalleryProducts`, `getGalleryProduct`, `submitGalleryInterest`, `getAllTags`
- Gallery public page `/hackathon/gallery` — browse + filter by tag
- Gallery detail page `/hackathon/gallery/[teamId]` — full product view + interest form
- RLS: published products readable by anyone; interests insertable by anyone

### Missing everything below

---

## Step 1 — RLS policies for team submission

**File:** `supabase/migrations/YYYYMMDD_hackathon_gallery_submit_rls.sql`

Add policies so authenticated team owners/members can insert and update their own product:

```sql
-- Team owner or member can insert their product
CREATE POLICY gallery_products_team_insert
  ON public.hackathon_gallery_products FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM hackathon_team_members WHERE participant_id = auth.uid()
    )
  );

-- Team owner or member can update their own product (not is_published)
CREATE POLICY gallery_products_team_update
  ON public.hackathon_gallery_products FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE owner_id = auth.uid()
      UNION
      SELECT team_id FROM hackathon_team_members WHERE participant_id = auth.uid()
    )
  );
```

Note: hackathon uses custom session auth (not Supabase auth), so RLS via `auth.uid()` won't work directly.
Instead, the API routes use service role key and do auth checks in code. Policies for submit will be
enforced at the API layer, not RLS. Admin publish uses service role.

---

## Step 2 — API: `GET /api/hackathon/gallery/my-product`

**File:** `app/api/hackathon/gallery/my-product/route.ts`

- Read session cookie → verify participant
- Find their team via `hackathon_teams.owner_id` or `hackathon_team_members.participant_id`
- Return their `hackathon_gallery_products` row (any `is_published` value) or `null`
- Used by dashboard to pre-fill the form

---

## Step 3 — API: `POST /api/hackathon/gallery/submit`

**File:** `app/api/hackathon/gallery/submit/route.ts`

- Read session cookie → verify participant
- Find their team
- Validate fields:
  - `product_name` — required, max 80 chars
  - `problem_statement` — required, max 300 chars
  - `solution_description` — required, max 1000 chars
  - `tags` — array, 1–5 tags, each from allowed list
  - `demo_url` — optional, must be valid URL
  - `cover_image_url` — optional, must be B2 URL
  - `additional_images` — optional, max 4 URLs
- Upsert into `hackathon_gallery_products` (one per team, `is_published` stays false until admin)
- Return the saved product

---

## Step 4 — API: `POST /api/hackathon/gallery/upload-image`

**File:** `app/api/hackathon/gallery/upload-image/route.ts`

- Auth-gated (same session check)
- Accept `multipart/form-data` with image file
- Validate: image only (jpeg/png/webp), max 5MB
- Upload to Backblaze B2 under `hackathon/gallery/{teamId}/{filename}`
- Return `{ url: string }`

---

## Step 5 — Dashboard: gallery submission section

**File:** `app/hackathon/dashboard/page.tsx` (add section) or new `app/hackathon/dashboard/gallery/page.tsx`

Decision: add as a new tab/section in dashboard to keep it focused.

### UI sections

#### Status banner
Shows current submission state:
- No submission → "You haven't submitted yet"
- Submitted (`is_published: false`) → "Under review — we'll notify you when it's live"
- Published (`is_published: true`) → "Live on gallery" + link

#### Form fields
| Field | Input | Notes |
|---|---|---|
| Product name | text | max 80 chars |
| Problem statement | textarea | 1–2 sentences, max 300 chars |
| Solution description | textarea | 150–300 words, max 1000 chars |
| Tags | multi-select pills | from allowed tag list |
| Demo URL | text | optional, link to video/live demo |
| Cover image | file upload | optional, 16:9 recommended |
| Additional screenshots | file upload (multi) | optional, max 4 |

#### Allowed tags (match existing gallery)
Health, Mental Health, Education, Productivity, Community, Elderly Care, Disability, Nutrition, Fitness, Research, Diagnosis, Telemedicine, Other

#### Behaviour
- On load: fetch `GET /api/hackathon/gallery/my-product` → pre-fill if exists
- Image upload: upload on file select → get URL → store in form state
- Submit: `POST /api/hackathon/gallery/submit` → show success state
- If already published: form is read-only with "Contact us to make changes" note

---

## Step 6 — Admin: gallery management

**File:** `app/api/admin/hackathon/gallery/route.ts` — list all submissions
**File:** `app/api/admin/hackathon/gallery/[productId]/route.ts` — PATCH to publish/unpublish

### Admin UI
Add to existing admin panel (wherever that lives):
- Table: product name, team name, submitted date, tags, status (draft/published)
- Toggle publish button per row
- Link to preview detail page

---

## Step 7 — Lib helpers

**File:** `lib/hackathon/gallery.ts` — add:

```ts
// Get team's own product (any publish state) — server-side with service role
getMyGalleryProduct(teamId: string): Promise<GalleryProduct | null>

// Upsert product
upsertGalleryProduct(teamId: string, data: GalleryProductInput): Promise<GalleryProduct>

// Admin: list all products (published + unpublished)
adminGetAllProducts(): Promise<GalleryProduct[]>

// Admin: set published state
adminSetPublished(productId: string, published: boolean): Promise<void>
```

---

## Step 8 — Email notification (optional, do last)

When a team submits, send email to admin notifying of new submission for review.
Use existing `lib/hackathon/email.ts` pattern.

---

## Build Order

| # | Task | Effort |
|---|---|---|
| 1 | Lib helpers (`getMyGalleryProduct`, `upsertGalleryProduct`) | Small |
| 2 | `GET /api/hackathon/gallery/my-product` | Small |
| 3 | `POST /api/hackathon/gallery/submit` | Small |
| 4 | Dashboard gallery section UI + form | Medium |
| 5 | Image upload API + B2 integration | Medium |
| 6 | Admin list + publish toggle API | Small |
| 7 | Admin UI | Small |
| 8 | Email notification | Small |

Total: ~1 day of focused work.

---

## Files to create

```
app/api/hackathon/gallery/my-product/route.ts
app/api/hackathon/gallery/submit/route.ts
app/api/hackathon/gallery/upload-image/route.ts
app/api/admin/hackathon/gallery/route.ts
app/api/admin/hackathon/gallery/[productId]/route.ts
supabase/migrations/YYYYMMDD_hackathon_gallery_submit_rls.sql
```

## Files to modify

```
lib/hackathon/gallery.ts          — add lib helpers
app/hackathon/dashboard/page.tsx  — add gallery submission section
```
