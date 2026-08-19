import { cn } from "@/lib/utils";

/**
 * One tile in the talent dashboard stat row. The Dawn modifier on `.ei-card`
 * already gives glass material + gold border on hover; `--lit` adds a
 * persistent warm glow for the tile that earns attention (pending review).
 *
 * Server component — no interactivity needed.
 */
interface StatTileProps {
  label: string;
  value: number | string;
  emphasis?: boolean;
}

export function StatTile({ label, value, emphasis = false }: StatTileProps) {
  return (
    <div
      className={cn(
        "ei-card relative px-5 py-6",
        emphasis && "ei-card--lit",
      )}
    >
      <p className="dawn-eyebrow">{label}</p>
      <p className="mt-3 font-kodchasan text-4xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
