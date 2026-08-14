"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BUCKET_META,
  BUCKET_ORDER,
  type DmLeadBucket,
} from "@/lib/dm-leads/playbook";

const PILL_BASE =
  "rounded-full border px-2.5 py-0.5 text-xs transition-all cursor-pointer select-none active:scale-95";

interface BucketPillsProps {
  activeBucket: DmLeadBucket | undefined;
  bucketCounts: Record<DmLeadBucket, number>;
  total: number;
}

export function BucketPills({
  activeBucket,
  bucketCounts,
  total,
}: BucketPillsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticBucket, setOptimisticBucket] = useOptimistic(
    activeBucket,
    (_current, newBucket: DmLeadBucket | undefined) => newBucket
  );

  const selectBucket = (bucket: DmLeadBucket | undefined) => {
    const params = new URLSearchParams(window.location.search);
    if (bucket) {
      params.set("bucket", bucket);
    } else {
      params.delete("bucket");
    }
    const qs = params.toString();
    const url = qs ? `/admin/dm-leads?${qs}` : "/admin/dm-leads";

    startTransition(() => {
      setOptimisticBucket(bucket);
      router.replace(url, { scroll: false });
    });
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {isPending && (
        <div className="absolute -top-1.5 left-0 right-0 h-0.5 animate-pulse bg-primary/60 rounded-full" />
      )}
      <button
        type="button"
        onClick={() => selectBucket(undefined)}
        className={cn(
          PILL_BASE,
          !optimisticBucket
            ? "border-foreground bg-foreground text-background font-medium shadow-sm"
            : "text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        )}
      >
        All
        <span className={cn("ml-1.5 text-xs", !optimisticBucket ? "opacity-90" : "opacity-60")}>
          {total}
        </span>
      </button>
      {BUCKET_ORDER.map((bucket) => {
        const meta = BUCKET_META[bucket];
        const isActive = optimisticBucket === bucket;
        return (
          <button
            key={bucket}
            type="button"
            onClick={() => selectBucket(isActive ? undefined : bucket)}
            title={meta.why}
            className={cn(
              PILL_BASE,
              isActive ? cn(meta.activeClass, "font-medium shadow-sm") : meta.idleClass
            )}
          >
            {meta.label}
            <span className={cn("ml-1.5 text-xs", isActive ? "opacity-90" : "opacity-60")}>
              {bucketCounts[bucket]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
