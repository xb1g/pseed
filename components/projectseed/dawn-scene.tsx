/**
 * The Dawn atmospheric background, all five documented layers.
 *
 * docs/ui-design-system.md:367 specifies: base gradient, three cloud blobs,
 * pale-gold horizon glow, rising light particles, star dot-grid. Pages were
 * inlining only the first three, which is why Dawn surfaces read as flat blue
 * rather than as a sky. Styles live in globals.css under `.dawn-scene`.
 *
 * Purely decorative — `aria-hidden`, no pointer events, and every animation is
 * disabled under `prefers-reduced-motion`.
 */
export function DawnScene() {
  return (
    <div className="dawn-scene" aria-hidden="true">
      <div className="dawn-scene__base" />
      <div className="dawn-scene__cloud dawn-scene__cloud--a" />
      <div className="dawn-scene__cloud dawn-scene__cloud--b" />
      <div className="dawn-scene__cloud dawn-scene__cloud--c" />
      <div className="dawn-scene__horizon" />
      <div className="dawn-scene__motes" />
      <div className="dawn-scene__stars" />
    </div>
  );
}
