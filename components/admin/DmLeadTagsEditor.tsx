"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLeadMetaUpdater } from "@/components/admin/DmLeadManageBar";
import type { LeadMetaPatch } from "@/app/admin/dm-leads/actions";
import type { DmConversation } from "@/types/dm-leads";

const PRESET_TAGS = ["VIP", "ผู้ปกครอง", "โรงเรียน", "ครู/อาจารย์", "สปอนเซอร์"];

interface DmLeadTagsEditorProps {
  conversation: DmConversation;
  onChange?: (patch: LeadMetaPatch) => void;
}

/** Preset tag chips + freeform tags for a lead. Lives inside the
 *  expandable details section so the reading pane stays compact. */
export function DmLeadTagsEditor({ conversation, onChange }: DmLeadTagsEditorProps) {
  const [newTag, setNewTag] = useState("");
  const { apply, isPending } = useLeadMetaUpdater(conversation.id, onChange);

  const toggleTag = (tag: string) => {
    const has = conversation.admin_tags.includes(tag);
    apply({
      admin_tags: has
        ? conversation.admin_tags.filter((t) => t !== tag)
        : [...conversation.admin_tags, tag],
    });
  };

  const addCustomTag = () => {
    const tag = newTag.trim();
    setNewTag("");
    if (!tag || conversation.admin_tags.includes(tag)) return;
    apply({ admin_tags: [...conversation.admin_tags, tag] });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1", isPending && "opacity-70")}>
      <span className="text-[11px] text-muted-foreground">แท็ก:</span>
      {PRESET_TAGS.map((tag) => {
        const active = conversation.admin_tags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            )}
          >
            {tag}
          </button>
        );
      })}
      {conversation.admin_tags
        .filter((t) => !PRESET_TAGS.includes(t))
        .map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer text-[11px]"
            title="Click to remove"
            onClick={() => toggleTag(tag)}
          >
            {tag} ×
          </Badge>
        ))}
      <Input
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addCustomTag();
          }
        }}
        placeholder="+ tag"
        className="h-6 w-20 px-2 text-[11px]"
      />
    </div>
  );
}
