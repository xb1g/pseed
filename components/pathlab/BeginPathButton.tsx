"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BeginPathButtonProps {
  seedId: string;
  existingEnrollmentId?: string;
}

export function BeginPathButton({
  seedId,
  existingEnrollmentId,
}: BeginPathButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [whyJoined, setWhyJoined] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBegin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pathlab/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedId,
          whyJoined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to begin path");
      }

      const enrollmentId = payload?.enrollment?.id;
      if (!enrollmentId) {
        throw new Error("Enrollment was created without id");
      }

      setOpen(false);
      router.push(`/seeds/pathlab/${enrollmentId}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to begin path");
    } finally {
      setLoading(false);
    }
  };

  if (existingEnrollmentId) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/seeds/pathlab/${existingEnrollmentId}`)}
        className="ei-button-dusk min-h-12 w-full justify-center text-base"
      >
        <span>Continue Path</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ei-button-dusk min-h-12 w-full justify-center text-base"
      >
        <span>Begin Path</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] border-white/10 bg-[#141416] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Before you begin</DialogTitle>
            <DialogDescription className="text-neutral-400">
              What made you curious about this?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={whyJoined}
            onChange={(event) => setWhyJoined(event.target.value)}
            className="ei-input min-h-24 text-white placeholder:text-neutral-500"
            placeholder="Write a sentence or two..."
          />
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="min-h-11 text-neutral-300 hover:text-white"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleBegin}
              disabled={loading}
              className="ei-button-dusk min-h-11 justify-center"
            >
              <span>{loading ? "Starting..." : "Start"}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
