---
target: "http://localhost:3001/hackathon/qualifier"
total_score: 25
p0_count: 0
p1_count: 2
timestamp: 2026-06-01T17-07-13Z
slug: localhost-hackathon-qualifier
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Dot indicators show current slide; nav buttons go visually disabled at ends. No loading state for images. |
| 2 | Match System / Real World | 4 | Language is clear and celebratory. "Greeting to" is awkward but acceptable in bilingual context. |
| 3 | User Control and Freedom | 2 | No keyboard navigation. No swipe gesture on touch devices. Buttons only. |
| 4 | Consistency and Standards | 2 | "HIGHSCHOOL qualifiers" mixes ALL-CAPS noun with lowercase "qualifiers" — looks like a bug. Slide 0 is fully caps. |
| 5 | Error Prevention | 3 | Prev/next correctly disabled at boundaries. Dot buttons allow direct jump. |
| 6 | Recognition Rather Than Recall | 3 | Dot indicators and arrows make navigation self-evident. Teams are numbered. |
| 7 | Flexibility and Efficiency | 1 | No keyboard support. No swipe. No URL deep-linking to specific slides. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, well-controlled. Frosted glass card works. Clione at right:-35% is mostly invisible. |
| 9 | Error Recovery | 2 | No error states for failed image/SVG loads. HackLogo.png failure leaves empty glow box. |
| 10 | Help and Documentation | 2 | Arrows discoverable. No swipe hint on mobile, no keyboard shortcut indicator. |
| **Total** | | **25/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: Not AI-generated slop. Committed bioluminescent space aesthetic, real Thai event content, jellyfish illustrations. Avoids cream bg, gradient text, side-stripe cards, tracked eyebrows on every section. The glassmorphism card is used purposefully (one instance per slide). The "Greeting to / [CATEGORY] qualifiers" kicker-above-heading on slides 1-2 edges formulaic, but specific copy saves it.

**Deterministic scan**: detect.mjs returned exit 0, empty array. No findings.

**Visual overlays**: Browser visualization not attempted (no browser automation available).

## Overall Impression

Strong, distinctive identity — dark bioluminescent space, real Thai content, committed mood. The fundamentals are right. What it lacks is craft in details: mouse-only navigation, inconsistent heading case, and mobile users are stranded. For projection, works well. For teams checking their phones on result day, it's a frustrating experience.

## What's Working

1. **Atmosphere is cohesive and earned.** #03050a, ice-blue #91C4E3, twinkling stars, jellyfish illustrations — a unified bioluminescent universe. The logoGlow and text-shadow are calibrated well.
2. **Poster-with-flanking-buttons layout is smart.** External prev/next keeps the composition clean. Dot indicators inside provide redundant navigation.
3. **TeamGrid's two-column split handles density well.** 20 teams in numbered two-column layout with subtle dividers is readable and avoids a wall of text.

## Priority Issues

### [P1] No keyboard or swipe navigation
**Why it matters**: Swiping is the dominant mobile gesture for slideshows. Keyboard arrow keys are a natural reflex on desktop. Neither works.
**Fix**: Add window keydown listener for ArrowLeft/ArrowRight. Add touchstart/touchend swipe detection (delta >= 50px triggers slide change).
**Suggested command**: /impeccable harden

### [P1] Mixed case heading "HIGHSCHOOL qualifiers" looks like a bug
**Why it matters**: ALL-CAPS noun + lowercase "qualifiers" breaks the visual rhythm established by slide 0's fully-capitalized headings. Looks unintentional.
**Fix**: Use "HIGHSCHOOL QUALIFIERS" / "UNIVERSITY QUALIFIERS" to match slide 0 energy, or title-case throughout.
**Suggested command**: /impeccable clarify

### [P2] Clione creature is 35% off-screen right
**Why it matters**: right:-35% makes the Clione almost entirely invisible. Asset loads for zero visual impact. Bottom-right quadrant is empty, unbalancing the composition.
**Fix**: Move to right:-5% or right:0 so at least half is visible.
**Suggested command**: /impeccable layout

### [P2] Thai subtitle opacity too low for its importance
**Why it matters**: rgba(255,255,255,0.65) at clamp(0.75rem...) minimum makes the emotional message ("ยินดีกับทุกทีมที่ผ่านเข้ารอบ") feel like a caption despite being the core content of slide 0.
**Fix**: Increase to rgba(255,255,255,0.82) and minimum size 0.85rem.
**Suggested command**: /impeccable typeset

### [P2] "Greeting to" is awkward English
**Why it matters**: Reads like a translation artifact. Should be "Congratulations to" or "Welcome,".
**Fix**: Change to "Congratulations to" on slides 1 and 2.
**Suggested command**: /impeccable clarify

## Persona Red Flags

**Jordan (First-Timer)**: Opens link on phone, sees congratulations slide, doesn't realize there are two more slides with the actual team lists. Three tiny dots at the bottom of the poster are the only hint. No "tap to see team lists" prompt. High abandonment risk before finding their team name.

**Casey (Distracted Mobile User)**: Inactive dot indicators are 6x6px — far below 44x44px minimum touch target. Active dot is 20x6px, also below minimum height. A fat-finger tap on the wrong dot is near-certain. Touch swipe doesn't work.

**Sam (Accessibility-Dependent User)**: Dot indicator buttons have no aria-label (announced as "button" x3). Prev/next buttons have no aria-label or aria-current. 100 JS-injected star divs lack aria-hidden, polluting the DOM tree. No reduced-motion override for twinkle or logoGlow animations.

## Minor Observations

- useStars dep array should be [] not [ref] — ref is stable, current dep causes potential re-run issues
- No @media (prefers-reduced-motion) override for twinkle or logoGlow animations
- Dot buttons: key={i} is fine but the touch targets need aria-label="Go to slide N"
- No <title> or <meta description> visible in component — link previews will be empty when shared in messaging apps
- Clione loaded but invisible wastes a network request
