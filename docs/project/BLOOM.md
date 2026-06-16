# Bloom — Hackathon Gallery & Participant Portal

## Register

Split: brand (public gallery) + product (participant portal)

## Users

**Primary: Public visitors / potential adopters**
- General community — curious individuals, not necessarily with a specific problem to solve
- Browsing on any device, discovery-first mindset
- Job to be done: "I want to find a student-built product that could actually solve my problem"

**Secondary: Hackathon participants**
- Students who built products in the hackathon
- Context: checking their portal after submitting, curious whether anyone noticed their work
- Job to be done: "I want to know my work had impact beyond the contest"

## Product Purpose

The Bloom gallery shows hackathon participants that their work has real-world value beyond the competition. It also serves as a discovery surface for the community to find and adopt student-built products.

Two surfaces:
1. **Public gallery** — browse, discover, and express interest in products
2. **Participant portal** — submit products to the gallery, see interest signals (views, inquiries)

Success looks like: a participant who thinks their hackathon project was just a class exercise discovers that three businesses are interested in adopting it.

## Brand Personality

**Playful, bold, alive**

- **Playful**: The work on display was made by students having fun solving real problems. The gallery should feel like an exhibition opening, not a procurement portal.
- **Bold**: The work deserves a strong stage. Big imagery, confident typography, no apologetic minimalism.
- **Alive**: Real people are browsing this right now. Interest signals, view counts, and activity indicators make it feel like a live marketplace, not a static archive.

## Visual Identity — Bloom Theme

Third atmospheric theme alongside Dawn and Dusk. Same structural DNA, distinct sky.

- **Scene**: A sunlit exhibition hall, midday warmth, work on every wall, visitors stopping with genuine curiosity
- **Anchor**: Warm coral/terracotta `#e8623a`
- **Grain**: Bold SVG noise on cards and buttons — tactile, printed, material
- **Background**: Deep warm dark (`#160a06`) with light shaft and floor glow atmospherics

See `docs/ui-design-system.md` for full Bloom theme specification and component reference.

## Anti-references

- **Procurement portals**: RFP-style grids, enterprise navy, dense tables. This is not a vendor marketplace.
- **Behance/Dribbble as-is**: Too polished and portfolio-focused. Work here is raw and ambitious, not curated for aesthetic perfection.
- **Generic ed-tech showcase**: "Student projects" section bolted onto a school LMS. Bloom is a standalone space that treats participant work as products, not assignments.

## Design Principles

1. **Work is the hero**: Product thumbnails and names dominate. The chrome (nav, filters, UI) serves and recedes.
2. **Interest is visible**: View counts, inquiry signals, and activity badges are front-and-center — not buried in an analytics tab. Make participants feel the impact in real time.
3. **Same heartbeat, new sky**: Bloom shares Dawn/Dusk's atmospheric character (noise, glow, atmospheric particles) but is unmistakably its own space. Coral where they have blue and purple.
4. **Gallery confidence**: The presentation should make even a rough prototype look like it belongs on a wall. Bold cards, generous spacing, strong typography.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum
- Noise/grain applied only via `mix-blend-mode: overlay` at controlled opacity — never obscures text or interactive elements
- Interest signals use text + icon, never color alone
- All atmospheric animations respect `prefers-reduced-motion`
- Mobile-first: primary browsing is on phones; touch targets 48x48px minimum
- Thai language support: same Bai Jamjuree / Kodchasan font stack as Dawn and Dusk
