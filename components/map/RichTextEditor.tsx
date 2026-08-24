"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, Editor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link2,
  Unlink,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Check,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { uploadImage } from "@/lib/utils/upload-image";

// WYSIWYG text editor (TipTap) that reads and writes markdown, so storage and
// the student view renderer stay exactly as they are. Notion-style: markdown
// shortcuts work while typing, selecting text floats a formatting toolbar,
// pasting an image uploads and embeds it.

export interface RichTextEditorHandle {
  insertImage: (url: string) => void;
  getMarkdown: () => string;
}

interface RichTextEditorProps {
  nodeId: string;
  content?: string;
  onChange?: (markdown: string) => void;
  onSave?: (markdown: string) => void;
  onCancel?: () => void;
  showActions?: boolean;
  saving?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  /**
   * Document-style editing: save the current markdown whenever the editor
   * loses focus, so clicking away returns the block to its rendered preview.
   * Blurs that land on the editor's own action row are ignored so Cancel
   * still cancels and Save still saves exactly once.
   */
  saveOnBlur?: boolean;
}

// Accept bare domains ("example.com/x") as link hrefs, not just full URLs.
const normalizeHref = (raw: string): string | null => {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    return ["http:", "https:"].includes(u.protocol) ? t : null;
  } catch {
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t)) return `https://${t}`;
    return null;
  }
};

const getMd = (editor: Editor | null): string =>
  (editor?.storage as any)?.markdown?.getMarkdown() ?? "";

const MenuButton = ({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault() /* keep the text selection */}
    onClick={onClick}
    className={`flex h-7 w-7 items-center justify-center rounded transition-colors duration-150 disabled:opacity-30 ${
      active
        ? "bg-amber-200/15 text-amber-200"
        : "text-stone-400 hover:bg-white/10 hover:text-stone-100"
    }`}
  >
    {children}
  </button>
);

// Floating toolbar shown over the current text selection.
const FormattingBubble = ({ editor }: { editor: Editor }) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const chain = () => editor.chain().focus();

  const openLinkEditor = () => {
    setLinkValue((editor.getAttributes("link").href as string) || "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = normalizeHref(linkValue);
    if (href) {
      chain().extendMarkRange("link").setLink({ href }).run();
    } else if (editor.isActive("link")) {
      chain().extendMarkRange("link").unsetLink().run();
    }
    setLinkOpen(false);
  };

  if (linkOpen) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          autoFocus
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyLink();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setLinkOpen(false);
            }
          }}
          placeholder="Paste or type a URL…"
          className="h-7 w-48 rounded border border-white/15 bg-black/30 px-2 text-xs text-stone-200 placeholder:text-stone-500 focus:border-amber-200/50 focus:outline-none"
        />
        <MenuButton label="Apply link" onClick={applyLink}>
          <Check className="h-3.5 w-3.5" />
        </MenuButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <MenuButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => chain().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => chain().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => chain().toggleStrike().run()}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton
        label="Inline code"
        active={editor.isActive("code")}
        onClick={() => chain().toggleCode().run()}
      >
        <Code className="h-3.5 w-3.5" />
      </MenuButton>

      <span className="mx-0.5 h-4 w-px bg-white/15" />

      <MenuButton
        label={editor.isActive("link") ? "Edit link" : "Add link"}
        active={editor.isActive("link")}
        onClick={openLinkEditor}
      >
        <Link2 className="h-3.5 w-3.5" />
      </MenuButton>
      {editor.isActive("link") && (
        <MenuButton
          label="Remove link"
          onClick={() => chain().unsetLink().run()}
        >
          <Unlink className="h-3.5 w-3.5" />
        </MenuButton>
      )}

      <span className="mx-0.5 h-4 w-px bg-white/15" />

      <MenuButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </MenuButton>
      <MenuButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => chain().toggleBlockquote().run()}
      >
        <Quote className="h-3.5 w-3.5" />
      </MenuButton>
    </div>
  );
};

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  {
    nodeId,
    content = "",
    onChange,
    onSave,
    onCancel,
    showActions = false,
    saving = false,
    autoFocus = false,
    placeholder = "Write… select text to format, paste an image to embed",
    saveOnBlur = false,
  },
  ref,
) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      const editor = editorRef.current;
      if (!editor) return;
      setUploading(true);
      try {
        const { fileUrl } = await uploadImage(file, nodeId);
        editor.chain().focus().setImage({ src: fileUrl }).run();
      } catch (err: any) {
        console.error("Image paste failed:", err);
        toast({
          title: "Image upload failed",
          description: err.message || "Could not upload pasted image.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [nodeId, toast],
  );

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    autofocus: autoFocus ? "end" : false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        // Parse HTML in stored content into real rich text instead of showing
        // the tags. Legacy text blocks are stored as raw HTML (the student
        // view supports both), and saving normalizes them to clean markdown.
        html: true,
        breaks: true,
        transformPastedText: true,
      }),
    ],
    content,
    editorProps: {
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              event.preventDefault();
              void uploadAndInsertImage(file);
              return true;
            }
          }
        }
        return false;
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape" && onCancel) {
          event.preventDefault();
          onCancel();
          return true;
        }
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          if (onSave) {
            event.preventDefault();
            onSave(getMd(editorRef.current));
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(getMd(e));
    },
    onBlur: ({ event }) => {
      if (!saveOnBlur || !onSave) return;
      // Clicks on the editor's own Save/Cancel row should not double as a
      // blur-save; those buttons run their own handler.
      const next = event.relatedTarget as HTMLElement | null;
      if (next?.closest?.("[data-rte-actions]")) return;
      onSave(getMd(editorRef.current));
    },
  });

  editorRef.current = editor;

  useImperativeHandle(
    ref,
    () => ({
      insertImage: (url: string) => {
        editorRef.current?.chain().focus().setImage({ src: url }).run();
      },
      getMarkdown: () => getMd(editorRef.current),
    }),
    [],
  );

  return (
    <div className="ce-rte min-w-0 flex-1">
      <style jsx global>{`
        /* Mirrors .learning-content-text in app/globals.css so editing a text
           block looks exactly like the student reading view. */
        .ce-rte .ProseMirror {
          outline: none;
          font-size: 1.0625rem;
          line-height: 1.8;
          letter-spacing: 0.003em;
          color: rgb(231 229 228);
          max-width: 65ch;
          min-height: 64px;
          max-height: 320px;
          overflow-y: auto;
          padding: 6px 8px;
        }
        .ce-rte .ProseMirror p {
          margin-bottom: 1.125rem;
          line-height: 1.8;
        }
        .ce-rte .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .ce-rte .ProseMirror h2,
        .ce-rte .ProseMirror h3 {
          color: rgb(250 250 249);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        .ce-rte .ProseMirror h2 {
          font-size: 1.5rem;
          margin: 0 0 0.75rem;
        }
        .ce-rte .ProseMirror h2:not(:first-child) {
          margin-top: 1.5rem;
        }
        .ce-rte .ProseMirror h3 {
          font-size: 1.25rem;
          margin: 0 0 0.5rem;
        }
        .ce-rte .ProseMirror h3:not(:first-child) {
          margin-top: 1.25rem;
        }
        .ce-rte .ProseMirror strong {
          color: rgb(245 245 244);
          font-weight: 600;
        }
        .ce-rte .ProseMirror a {
          color: rgb(252 211 77);
          text-decoration: underline;
          text-decoration-color: rgb(252 211 77 / 0.35);
          text-underline-offset: 3px;
          font-weight: 500;
        }
        .ce-rte .ProseMirror ul,
        .ce-rte .ProseMirror ol {
          margin: 1.25rem 0;
          padding-left: 1.5rem;
        }
        .ce-rte .ProseMirror ul:first-child,
        .ce-rte .ProseMirror ol:first-child {
          margin-top: 0;
        }
        .ce-rte .ProseMirror ul {
          list-style: disc;
        }
        .ce-rte .ProseMirror ol {
          list-style: decimal;
        }
        .ce-rte .ProseMirror li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .ce-rte .ProseMirror li::marker {
          color: rgb(252 211 77 / 0.55);
        }
        .ce-rte .ProseMirror li:last-child {
          margin-bottom: 0;
        }
        .ce-rte .ProseMirror code {
          background-color: rgb(28 25 23);
          color: rgb(253 230 138);
          border: 1px solid rgb(68 64 60);
          border-radius: 0.25rem;
          padding: 0.15rem 0.4rem;
          font-size: 0.85em;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        .ce-rte .ProseMirror pre {
          background-color: rgb(12 10 9);
          border: 1px solid rgb(41 37 36);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1.25rem 0;
          overflow-x: auto;
        }
        .ce-rte .ProseMirror pre code {
          background: transparent;
          border: none;
          padding: 0;
          color: rgb(231 229 228);
        }
        .ce-rte .ProseMirror blockquote {
          border-left: 3px solid rgb(252 211 77 / 0.35);
          padding-left: 1rem;
          margin: 1.25rem 0;
          font-style: italic;
          color: rgb(214 211 209);
        }
        .ce-rte .ProseMirror img {
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          margin: 1.25rem 0;
        }
        .ce-rte .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid rgb(252 211 77 / 0.6);
        }
        .ce-rte .ProseMirror hr {
          border-color: rgb(68 64 60);
          margin: 2rem 0;
        }
        .ce-rte .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgb(120 113 108);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 120, maxWidth: "none" }}
          shouldShow={({ editor: e, state }) => {
            const { from, to } = state.selection;
            return e.isEditable && from !== to && !e.isActive("image");
          }}
          className="rounded-lg border border-white/15 bg-[#1c1917] p-1 shadow-xl shadow-black/50"
        >
          <FormattingBubble editor={editor} />
        </BubbleMenu>
      )}

      <div
        className={`rounded-md border bg-white/5 transition-colors focus-within:border-amber-200/50 ${
          uploading ? "border-amber-200/40" : "border-white/15"
        }`}
      >
        <EditorContent editor={editor} />
        {uploading && (
          <p className="flex items-center gap-1.5 px-2 pb-1.5 text-[10px] text-amber-200/80">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading image…
          </p>
        )}
      </div>

      {showActions && (
        <div className="mt-1 flex items-center justify-between" data-rte-actions>
          <p className="text-[10px] text-muted-foreground">
            Cmd+Enter saves · Esc cancels
          </p>
          <div className="flex items-center gap-1">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={saving || uploading}
                className="h-7 rounded-md px-2 text-[11px] text-stone-400 transition-colors hover:bg-white/10 hover:text-stone-200 disabled:opacity-40"
              >
                Cancel
              </button>
            )}
            {onSave && (
              <button
                type="button"
                onClick={() => onSave(getMd(editorRef.current))}
                disabled={saving || uploading}
                className="flex h-7 items-center gap-1 rounded-md bg-amber-200/15 px-2 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-200/25 disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
