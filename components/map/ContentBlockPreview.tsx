"use client";

import type { ReactNode } from "react";
import { NodeContent } from "@/types/map";
import { Edit, GripVertical, Loader2, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { renderContent } from "./nodeViewHelpers";

// Document-style content block for the learning-material editor. By default a
// block renders through the same renderContent pipeline students see (read
// only: no fullscreen image viewer is wired, so clicks stay in the editor).
// Hover reveals a drag handle plus edit/delete controls; text blocks hand the
// body over to an inline editor slot supplied by the parent.

interface BlockActionProps {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

// Small icon button shown on hover over a block.
const BlockAction = ({
  label,
  danger,
  disabled,
  onClick,
  children,
}: BlockActionProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 disabled:pointer-events-none disabled:opacity-25 ${
      danger
        ? "text-stone-400 hover:bg-red-400/10 hover:text-red-300"
        : "text-stone-400 hover:bg-white/10 hover:text-stone-100"
    }`}
  >
    {children}
  </button>
);

// Quiet stand-in for blocks that have neither a URL nor a body yet.
const EmptyBlockNote = ({ text }: { text: string }) => (
  <p className="py-1 text-[11px] italic text-stone-500">{text}</p>
);

interface ContentBlockPreviewProps {
  item: NodeContent;
  /** Freeze drag and actions while another editing surface is open. */
  disabled?: boolean;
  /** Optimistic paste/drop placeholder still waiting on the upload. */
  uploading?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Text blocks: clicking the rendered preview flips it into edit mode. */
  onPreviewClick?: () => void;
  /** Inline editor slot; when present it replaces the preview. */
  editor?: ReactNode;
}

export function ContentBlockPreview({
  item,
  disabled = false,
  uploading = false,
  onEdit,
  onDelete,
  onPreviewClick,
  editor,
}: ContentBlockPreviewProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const hasContent = !!(item.content_url || item.content_body);
  const editing = !!editor;

  const preview = hasContent ? (
    renderContent(item, null)
  ) : (
    <EmptyBlockNote
      text={
        item.content_type === "text"
          ? "Empty text block, click to write."
          : "Nothing here yet, use the pencil to add content."
      }
    />
  );

  return (
    <div
      ref={setNodeRef}
      data-block-id={item.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group relative rounded-md py-1 pl-6 ${
        isDragging ? "z-10 opacity-70" : ""
      } ${onPreviewClick && !editing ? "hover:bg-white/[0.03]" : ""}`}
    >
      {/* Hover controls: drag handle in the left gutter, actions top right */}
      {!editing && (
        <>
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            aria-label="Drag to reorder"
            className="absolute left-0 top-1.5 cursor-grab touch-none rounded p-0.5 text-stone-600 opacity-0 transition-opacity duration-150 hover:text-stone-300 focus-visible:opacity-100 active:cursor-grabbing disabled:pointer-events-none group-hover:opacity-100"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div className="absolute right-0 top-0 flex items-center gap-0.5 rounded-md border border-white/10 bg-stone-900/90 p-0.5 opacity-0 shadow-md shadow-black/40 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
            <BlockAction label="Edit content" disabled={disabled} onClick={onEdit}>
              <Edit className="h-3 w-3" />
            </BlockAction>
            <BlockAction
              label="Delete content"
              danger
              disabled={disabled}
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </BlockAction>
          </div>
        </>
      )}

      {editing ? (
        editor
      ) : onPreviewClick ? (
        // The preview is the click target that flips the block into edit
        // mode; swallow the click first so links inside it never navigate.
        <div
          role="button"
          tabIndex={0}
          aria-label="Edit text block"
          onClick={(e) => {
            e.preventDefault();
            onPreviewClick();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onPreviewClick();
            }
          }}
          className="cursor-text rounded outline-none focus-visible:ring-1 focus-visible:ring-amber-200/50"
        >
          {preview}
        </div>
      ) : (
        preview
      )}

      {uploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 rounded-md bg-black/50 text-[11px] text-amber-200">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Uploading image…
        </div>
      )}
    </div>
  );
}
