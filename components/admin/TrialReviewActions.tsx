"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface TrialReviewActionsProps {
  trialId: string;
}

export function TrialReviewActions({ trialId }: TrialReviewActionsProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (action: "approve" | "reject") => {
    setActing(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/trials/${trialId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: note.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Action failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error, please try again");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="w-56 shrink-0 space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Admin note (optional)"
        rows={2}
        className="text-xs"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => submit("approve")}
          disabled={acting !== null}
          className="flex-1 gap-1.5 bg-green-600 text-white hover:bg-green-500"
        >
          {acting === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => submit("reject")}
          disabled={acting !== null}
          className="flex-1 gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          {acting === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          Reject
        </Button>
      </div>
    </div>
  );
}
