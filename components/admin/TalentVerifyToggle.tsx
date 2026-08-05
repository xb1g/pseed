"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setTalentVerified } from "@/app/admin/talent/actions";

interface TalentVerifyToggleProps {
  id: string;
  verified: boolean;
}

/** Publishes or hides a signup on the public /talent page. */
export function TalentVerifyToggle({ id, verified }: TalentVerifyToggleProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={verified ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void setTalentVerified(id, !verified);
        })
      }
    >
      {pending ? "Saving…" : verified ? "Unpublish" : "Publish"}
    </Button>
  );
}
