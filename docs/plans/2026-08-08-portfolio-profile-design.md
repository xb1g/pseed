# Portfolio Profile (`/u/[handle]`) — Design

Date: 2026-08-08
Status: Approved

## Summary

A GitHub-style portfolio profile page. One page, two modes: the owner sees
inline edit controls; everyone else sees the rendered public profile. Shows
identity + talent fields + a unified "Projects" portfolio merging PathLab
journeys and ProjectSeed builds + badges.

## Decisions (from brainstorm)

- **Audience**: both private (owner) and public visitors, one page two modes.
- **Route**: new `/u/[handle]`. Existing `/profile` stays (account settings)
  and links to it.
- **Talent data**: extend the existing `public_profiles` table (already
  PII-free-by-construction, has `handle`, `is_public`, RLS, and the
  `set_profile_visibility` RPC). Do NOT add public-safe fields to `profiles`.
- **Presentation**: unified project cards (PathLab + ProjectSeed in one grid),
  not split sections, not per-project pages (YAGNI for v1).
- **Privacy**: default private (`is_public = false` already the default).
  Owner publishes explicitly. Audience includes minors.

## Schema (one migration)

`ALTER TABLE public_profiles ADD`:

| Column | Type | Notes |
|---|---|---|
| `headline` | text | one-line bio, GitHub-style |
| `track` | text | CHECK in ('dev','video','strategy','design','other'), nullable |
| `tools` | text[] | default '{}' |
| `portfolio_links` | text[] | default '{}', URLs |
| `seeking` | text | CHECK in ('internship','freelance','collaboration','not-looking'), nullable |

Existing `owner_all` RLS policy already lets the owner write these columns;
existing `public_read` policy already exposes them only when `is_public`.

New security-definer RPC `get_public_portfolio(p_handle text) RETURNS jsonb`:

1. Looks up `public_profiles` by handle (falls back to `profiles.username`).
2. Returns NULL unless `is_public = true`.
3. Returns curated JSON: identity (from `profiles`: full_name, username,
   avatar_url — public-safe subset only), talent fields, PathLab journeys
   (seed title, current_day/total_days, status, report share_token if any),
   ProjectSeed picks (cohort name, project title, tags, status, submitted_at).

Owner reads use direct queries with the owner's session (no RPC).

## Aggregator — `lib/profile/portfolio.ts`

- `getOwnerPortfolio(userId)` — full data via session client.
- `getPublicPortfolio(handle)` — via RPC.
- `buildProjectCards(input)` — pure function, merges both sources into:

```ts
type ProjectCard = {
  id: string
  source: 'pathlab' | 'projectseed'
  title: string
  subtitle: string        // cohort name / seed category
  status: string          // active | explored | submitted | draft ...
  tags: string[]
  metric: string          // "Day 3 of 5" / "Submitted"
  evidenceHref: string | null  // /report/[shareToken] for pathlab
}
```

## Page & components

- `app/u/[handle]/page.tsx` — server component, `force-dynamic`.
  - Owner (session user id === profile user id) → owner mode.
  - Not found → 404. Found but private and not owner → "private profile" state.
- `components/profile/portfolio/`:
  - `PortfolioHero.tsx` — avatar, name, @handle, headline, track + seeking
    chips, member-since; owner: publish toggle + edit toggle.
  - `TalentStrip.tsx` — tools chips, portfolio links, seeking.
  - `ProjectGrid.tsx` / `ProjectCard.tsx` — unified cards with source badge,
    status, metric, tags, evidence link.
  - `PortfolioEditor.tsx` — client component, GitHub-style inline editing of
    headline/track/tools/links/seeking + handle, saves via browser supabase
    client (owner RLS) — same pattern as existing `/profile` page.
  - `PublishToggle.tsx` — calls `set_profile_visibility` RPC (preserves
    existing published_sections semantics; adds 'portfolio' to allowed
    sections).
- Reuses `BadgeGallery` (public-safe? v1: owner mode only).
- Dawn theme, `ei-card` surfaces, existing profile page visual patterns,
  mobile `IntersectionObserver` + `@media (hover: none)` rule per
  docs/ui-design-system.md.

`/profile` quick actions gains a "View portfolio" link to `/u/[handle]`.

## Migration of `set_profile_visibility`

Extend allowed sections to include `'portfolio'`. The portfolio page respects
`is_public` only (sections stay for the my-path feature).

## Testing

- Jest: `buildProjectCards` pure logic (merge, sort, metric formatting).
- Component test: owner vs public render of `/u/[handle]` page sections.
- SQL: extend `supabase/tests/public_profiles_rls.test.sql` coverage style —
  RPC returns NULL for private profiles.

## Out of scope (v1)

- Pinning projects, per-project detail pages, public BadgeGallery, recorded
  hours on public cards, bridging to `talent_profiles` marketplace table.
