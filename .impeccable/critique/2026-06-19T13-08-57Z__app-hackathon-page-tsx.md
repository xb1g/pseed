---
target: /hackathon page
total_score: 20
p0_count: 1
p1_count: 2
timestamp: 2026-06-19T13-08-57Z
slug: app-hackathon-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Registration Closed communicated, but stale April 4 copy creates active confusion about current state. No indication event has concluded. |
| 2 | Match System / Real World | 2 | Thai-dominant copy aligns with audience. But "INNOVATOR" / "SPECIAL INVITE" / "FUTURIST" vocabulary reads as American tech conference, not Thai student hackathon. |
| 3 | User Control and Freedom | 2 | No back/home navigation. Animation scroll-lock cannot be skipped on direct URL visits. No way to collapse all tracks at once. |
| 4 | Consistency and Standards | 2 | h2 gradient treatment applied inconsistently (Tracks heading is plain white, all others gradient). Track color coding implies pattern then breaks it (blue/purple/blue). |
| 5 | Error Prevention | 3 | No actionable errors possible since registration closed. Login flow exists. |
| 6 | Recognition Rather Than Recall | 3 | Tracks accordion is clear. All interactive elements visually distinct. |
| 7 | Flexibility and Efficiency | 1 | No skip-animation control. No anchor links. No keyboard navigation for accordion (onClick only). Returning users re-experience full intro on direct URL. |
| 8 | Aesthetic and Minimalist Design | 1 | 12+ ambient glow blobs, 5+ floating creatures, gradient text on 5/7 headings. Decoration density inverts its purpose -- creates noise, not atmosphere. |
| 9 | Error Recovery | N/A | No error states in landing page scope. Scored as 3 for total. |
| 10 | Help and Documentation | 2 | "Read full brief" links exist. But problem briefs (most important content) rendered in text-xs text-gray-500 -- least readable content on the page. |
| **Total** | | **20/40** | **Acceptable -- significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: This page would be identified as AI-generated within seconds by a trained eye. Five of seven section headings use identical `bg-gradient-to-r from-[#91C4E3] to-[#A594BA] bg-clip-text text-transparent`. "Beyond the Hackathon" and "Organizations & Partners" sections are identical card grids (icon/heading/description, centered, same padding, same hover). Tracks section uses 01/02/03 numbered eyebrow markers. 12+ ambient blur blobs at 5% opacity contribute nothing visible. The Futurist Fest ticket card reads as verbatim conference-tech-startup UI.

**Deterministic scan**: 6 findings in `components/hackathon/LandingPage.tsx`:
- 5x gradient-text violations (lines 469, 506, 908, 1056, 1126) -- all `bg-clip-text + bg-gradient` on section headings
- 1x bounce-easing violation (line 451) -- `animate-bounce` on scroll indicator

Zero false positives. All findings confirmed by manual review.

## Overall Impression

The intro animation sequence (title glow, handwriting reveal, jellyfish emergence) is genuinely atmospheric and the one moment that feels hand-crafted. Everything after that reads as a dark-mode SaaS template with an ocean skin. The strongest content (problem briefs) is the hardest to read. The page describes an event that is over using copy written when it was still open, creating a trust failure that undermines everything else.

## What's Working

1. **The intro animation is the real product.** Dark intro, title glow-up, handwriting subtitle, jellyfish reveal -- this is specific, atmospheric, and doesn't feel AI-made. Someone made a design decision here.
2. **Problem brief titles are the best writing on the page.** "The Stigma Wall", "Connected But Alone", "PM2.5 vs. Our Children" -- specific, human, emotionally legible to a Thai student.
3. **The "Anyone Can Make an Impact" feature cards escape the template.** Horizontal illustration-plus-text layout with alternating accents. The closest thing to a real layout decision.

## Priority Issues

### [P0] Stale registration copy is live and misleading
Both hero and bottom CTA show "วันที่ 4 เมษายนนี้" (April 4) for re-registration. Today is June 19. This is an active trust failure -- visitors conclude the page is abandoned or organizers don't care.
**Fix**: Remove or replace stale registration copy. If the event is over, show a post-event state (gallery link, results, recap). If next year is planned, say so.
**Suggested command**: `/impeccable clarify`

### [P1] Page ends on its lowest emotional moment
The bottom CTA repeats the stale hero registration state. The last thing a visitor reads is an expired deadline. Peak-end rule: this ending disproportionately shapes memory of the whole experience.
**Fix**: Replace post-event CTA with gallery showcase, participant highlights, or "next year" tease. Let the page end on aspiration, not a closed door.
**Suggested command**: `/impeccable shape`

### [P1] Gradient text on five section headings
Lines 469, 506, 908, 1056, 1126. The same `bg-gradient-to-r from-[#91C4E3] to-[#A594BA] bg-clip-text text-transparent` on nearly every h2. This is the single most recognizable AI-generated UI pattern.
**Fix**: Use solid colors for headings. Reserve gradient treatment for at most one focal heading. The handwriting subtitle in the hero is the correct model -- one earned moment.
**Suggested command**: `/impeccable quieter`

### [P2] Body copy and problem briefs fail WCAG AA contrast
`text-gray-500` (~3.8:1) and `text-white/50` (~3.5:1) against near-black background. Problem brief descriptions use `text-xs text-gray-500` -- the most substantive content has the worst contrast.
**Fix**: Bump body text to at least `text-gray-300` (4.5:1+). Problem briefs should be `text-sm text-gray-300` minimum.
**Suggested command**: `/impeccable audit`

### [P2] Broken color coding in tracks
Track 1 = blue, Track 2 = purple, Track 3 = blue again. The system implies a color-meaning pattern then contradicts it. Same two colors used arbitrarily in "Who Can Join" / "Team Format" cards above.
**Fix**: Either give each track a distinct color with semantic meaning, or collapse to one accent and differentiate tracks by content/icon alone.
**Suggested command**: `/impeccable colorize`

## Persona Red Flags

**Jordan (First-Timer, English-dominant)**: Headings are English but body copy is almost entirely Thai. Jordan reads "Watch the Story" then sees Thai below. "Anyone Can Make an Impact" then Thai below. The only English content past the hero is inside the track problem briefs. The English headings are bait that Thai body copy doesn't follow up on. Jordan understands the track section and nothing else.

**Casey (Mobile)**: Instagram embed is hardcoded 340x605px -- nearly full viewport on iPhone. Instagram embeds fail silently with third-party cookie blocking (iOS Safari ITP). The 3+ second scroll-lock animation blocks impatient mobile users. Floating creature decorations use pixel offsets that overflow the viewport on small screens.

**Nong (Thai high school student, first hackathon)**: Arrives excited. Intro animation is perfect for her. Then immediately: "Registration Closed" + stale April 4 copy. She doesn't know April 4 was two months ago. She scrolls hoping for clarity. The "Anyone Can Make an Impact" section re-excites her. She expands a track. Problem descriptions are text-xs text-gray-500 -- she can barely read them. She scrolls to the bottom and sees the same April 4 copy. She leaves confused about whether any action is available. Exit rate: near 100%.

## Minor Observations

- Both hero jellyfish use the same SVG (`Jellyfish 1.svg`), one `scaleX(-1)` flipped. Creates mechanical symmetry.
- Track eyebrow numbers use `font-mono` but category label uses `font-mitr` on the same line. Small visual clash.
- "Tracks" is the only h2 without gradient treatment. If intentional restraint, it works. If inconsistency, it makes "Tracks" look lower-priority than "Organizations & Partners."
- `UsersRound` icon used for both "Who Can Join" and "Team Format" cards. Two concepts, identical icon.
- Five different muted text shades used interchangeably: `text-gray-300`, `text-gray-400`, `text-gray-500`, `text-white/50`, `text-white/60`.
- "Beyond the Hackathon" 3 cards duplicate the same info as badges below Futurist Fest card (Showcase, Networking, Incubation).

## Questions to Consider

1. The intro animation is the most designed thing on the page -- and it only plays once. After that, the page is a generic dark-mode SaaS site. If the brand is atmospheric ocean exploration, why does the content section feel like a Notion export?
2. The page describes a hackathon that is over, using copy written when it was still open. What is this page actually for now?
3. The problem briefs are the most compelling content, hidden behind two clicks in text-xs text-gray-500. If the problems are the hook, why aren't they the hero?
