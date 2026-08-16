"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NodeContent, ContentType } from "@/types/map";
import {
  Trash2,
  PlusCircle,
  Plus,
  Edit,
  Check,
  AlertCircle,
  ChevronRight,
  GripVertical,
  Loader2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "@/components/ui/file-upload";
import {
  createNodeContent,
  updateNodeContent,
  deleteNodeContent,
} from "@/lib/supabase/nodes";
import { useToast } from "@/components/ui/use-toast";
import { marked } from "marked";
import { sanitizeHtml } from "@/lib/security/sanitize-html";
import {
  RichTextEditor,
  RichTextEditorHandle,
} from "@/components/map/RichTextEditor";

// Content type configurations
const CONTENT_TYPE_CONFIG = {
  text: {
    label: "Text",
    icon: "📝",
    placeholder: "Write your text content here...",
    hint: "Select text to format · markdown shortcuts work · paste an image to embed it",
  },
  image: {
    label: "Image",
    icon: "🖼️",
    placeholder: "…or paste an image URL",
    hint: "",
  },
  video: {
    label: "Video",
    icon: "📹",
    placeholder: "https://youtube.com/watch?v=…",
    hint: "YouTube, Vimeo, SoundCloud, X, Reddit, GIPHY, Flickr",
  },
  pdf: {
    label: "PDF",
    icon: "📄",
    placeholder: "",
    hint: "",
  },
  canva_slide: {
    label: "Canva",
    icon: "🎨",
    placeholder: "https://www.canva.com/design/…",
    hint: "Copy Canva's Smart embed link",
  },
  resource_link: {
    label: "Link",
    icon: "🔗",
    placeholder: "https://example.com/resource",
    hint: "Docs, repos, books, datasets, tools",
  },
  order_code: {
    label: "Code",
    icon: "🧩",
    placeholder: "",
    hint: "",
  },
} as const;

interface ContentEditorProps {
  nodeId: string;
  content: NodeContent[];
  onContentChange: (newContent: NodeContent[]) => void;
}

interface ContentFormProps {
  nodeId: string;
  existingContent?: NodeContent;
  contentCount: number; // Number of existing content items
  onSave: (content: NodeContent) => void;
  onCancel: () => void;
}

// Validation utilities
const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ["http:", "https:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

const validateContentForm = (
  contentType: ContentType,
  contentUrl: string,
  contentBody: string,
): string[] => {
  const errors: string[] = [];

  if (!contentType) {
    errors.push("Content type is required");
  }

  if (
    contentType === "video" ||
    contentType === "canva_slide" ||
    contentType === "resource_link"
  ) {
    if (!contentUrl.trim()) {
      errors.push("URL is required for this content type");
    } else if (!validateUrl(contentUrl)) {
      errors.push("Please enter a valid URL starting with http:// or https://");
    } else if (
      contentType === "canva_slide" &&
      !contentUrl.includes("canva.com/design/")
    ) {
      errors.push(
        "Please enter a valid Canva design URL (should contain 'canva.com/design/')",
      );
    } else if (contentType === "video") {
      // Enhanced validation for video URLs - check for supported platforms
      const supportedPlatforms = [
        "youtube.com",
        "youtu.be",
        "vimeo.com",
        "soundcloud.com",
        "twitter.com",
        "reddit.com",
        "giphy.com",
        "flickr.com",
      ];
      const isSupported = supportedPlatforms.some((platform) =>
        contentUrl.toLowerCase().includes(platform),
      );

      if (!isSupported) {
        errors.push(
          "For best compatibility, use URLs from: YouTube, Vimeo, SoundCloud, Twitter, Reddit, GIPHY, or Flickr. Other URLs may still work but aren't guaranteed.",
        );
      }
    }
  }

  if (contentType === "text" && !contentBody.trim()) {
    errors.push("Content body is required for text content");
  }

  if (contentType === "image" && !contentUrl.trim()) {
    errors.push("Please upload an image file");
  }

  if (contentType === "pdf" && !contentUrl.trim()) {
    errors.push("Please upload a PDF file");
  }

  if (contentType === "resource_link" && !contentBody.trim()) {
    errors.push("Description is required for resource links");
  }

  if (contentType === "order_code") {
    let blocks: string[] = [];
    try {
      blocks = JSON.parse(contentBody || "[]");
    } catch {
      errors.push("Invalid code blocks data");
    }

    if (blocks.length < 2) {
      errors.push("Please add at least 2 code blocks");
    }

    if (blocks.some((b) => !b.trim())) {
      errors.push("Code blocks cannot be empty");
    }
  }

  return errors;
};

// Generate unique temporary ID
const generateTempId = (): string =>
  `temp_content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Display helpers
const getUrlHost = (url?: string | null): string => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const getFileName = (url?: string | null): string => {
  if (!url) return "";
  const raw = url.split("/").pop() || "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

// A short, human label for a content row: the title if set, otherwise the
// most recognizable thing we can derive from the content itself.
const getContentLabel = (item: NodeContent): string => {
  if (item.content_title?.trim()) return item.content_title.trim();

  switch (item.content_type) {
    case "text": {
      const plain = (item.content_body || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/[#*>`_\[\]()!-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return plain
        ? plain.length > 60
          ? `${plain.slice(0, 60)}…`
          : plain
        : "Untitled text";
    }
    case "image":
      return getFileName(item.content_url) || "Image";
    case "pdf":
      return getFileName(item.content_url) || "PDF document";
    case "video": {
      const host = getUrlHost(item.content_url);
      return host ? `Video · ${host}` : "Video";
    }
    case "canva_slide":
      return "Canva deck";
    case "resource_link":
      return getUrlHost(item.content_url) || "Resource link";
    case "order_code": {
      try {
        const blocks = JSON.parse(item.content_body || "[]");
        return `${blocks.length} code blocks`;
      } catch {
        return "Order code";
      }
    }
    default:
      return item.content_type;
  }
};

// Get embed URL for video platforms
const getEmbedUrl = (url: string): string | null => {
  try {
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      )?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  } catch {
    return null;
  }
};

const renderMarkdown = (text: string): string => {
  try {
    return sanitizeHtml(marked(text) as string);
  } catch {
    return sanitizeHtml(`<p>${text.replace(/\n/g, "</p><p>")}</p>`);
  }
};

// ---------------------------------------------------------------------------
// Quick capture: paste or type, we figure out the block type
// ---------------------------------------------------------------------------

const VIDEO_HOSTS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "soundcloud.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "giphy.com",
  "flickr.com",
];

// Accept bare domains too ("youtube.com/watch?v=..."), not just full URLs.
const normalizeUrl = (raw: string): string | null => {
  const t = raw.trim();
  if (validateUrl(t)) return t;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t)) {
    const withProto = `https://${t}`;
    if (validateUrl(withProto)) return withProto;
  }
  return null;
};

interface QuickDraft {
  type: ContentType;
  url: string | null;
  body: string | null;
}

const detectContent = (raw: string): QuickDraft => {
  const t = raw.trim();
  const url = normalizeUrl(t);

  if (url) {
    const lower = url.toLowerCase();
    if (lower.includes("canva.com/design/")) {
      return { type: "canva_slide", url, body: null };
    }
    if (VIDEO_HOSTS.some((host) => lower.includes(host))) {
      return { type: "video", url, body: null };
    }
    if (/\.(png|jpe?g|gif|webp|heic|heif)([?#].*)?$/.test(lower)) {
      return { type: "image", url, body: null };
    }
    if (/\.pdf([?#].*)?$/.test(lower)) {
      return { type: "pdf", url, body: null };
    }
    return { type: "resource_link", url, body: null };
  }

  return { type: "text", url: null, body: t };
};

// The one-line capture box. Paste creates a block immediately (image files
// upload first); typing needs Enter. Escape backs out.
const QuickAddInput = ({
  autoFocus,
  uploading,
  placeholder,
  onSubmit,
  onPasteImage,
  onCancel,
}: {
  autoFocus?: boolean;
  uploading?: boolean;
  placeholder?: string;
  onSubmit: (text: string) => void;
  onPasteImage: (file: File) => void;
  onCancel?: () => void;
}) => {
  const [value, setValue] = useState("");

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setValue("");
    onSubmit(t);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500">
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
      </span>
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        disabled={uploading}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit(value);
          }
          if (e.key === "Escape") {
            setValue("");
            onCancel?.();
          }
        }}
        onPaste={(e) => {
          const items = e.clipboardData?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) {
                  e.preventDefault();
                  setValue("");
                  onPasteImage(file);
                  return;
                }
              }
            }
          }
          const text = e.clipboardData?.getData("text/plain");
          if (text?.trim()) {
            e.preventDefault();
            submit(text);
          }
        }}
        onBlur={() => {
          if (!uploading) onCancel?.();
        }}
        placeholder={placeholder ?? "Paste a link or image, or type text…"}
        className="h-9 w-full rounded-lg border border-dashed border-white/15 bg-transparent pl-8 pr-2 text-sm text-stone-200 transition-colors placeholder:text-stone-500 hover:border-amber-200/40 focus:border-amber-200/50 focus:outline-none disabled:opacity-60"
      />
    </div>
  );
};

// Quick capture row: the input plus a door to the full editor for the things
// quick capture cannot express (file uploads, code blocks, headings).
const QuickAddRow = ({
  autoFocus,
  uploading,
  showMore,
  onSubmit,
  onPasteImage,
  onOpenFull,
  onCancel,
}: {
  autoFocus?: boolean;
  uploading?: boolean;
  showMore?: boolean;
  onSubmit: (text: string) => void;
  onPasteImage: (file: File) => void;
  onOpenFull?: () => void;
  onCancel?: () => void;
}) => (
  <div className="flex items-center gap-1.5">
    <QuickAddInput
      autoFocus={autoFocus}
      uploading={uploading}
      onSubmit={onSubmit}
      onPasteImage={onPasteImage}
      onCancel={onCancel}
    />
    {showMore && (
      <button
        type="button"
        onClick={onOpenFull}
        title="Full editor: uploads, code blocks, headings"
        className="h-9 shrink-0 rounded-lg border border-white/10 px-2.5 text-xs text-muted-foreground transition-colors hover:border-white/25 hover:text-stone-200"
      >
        More
      </button>
    )}
  </div>
);

// Hover seam between two rows. Clicking it turns the seam into a quick
// capture input that inserts at exactly that position.
const InsertSeam = ({ onClick }: { onClick: () => void }) => (
  <div
    role="button"
    aria-label="Insert content here"
    onClick={onClick}
    className="group/seam relative h-2 cursor-pointer"
  >
    <div className="absolute inset-x-1 top-1/2 flex -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover/seam:opacity-100">
      <span className="h-px flex-1 bg-amber-200/40" />
      <Plus className="h-3 w-3 text-amber-200/80" />
      <span className="h-px flex-1 bg-amber-200/40" />
    </div>
  </div>
);

// Compact segmented type picker: one wrapping row of icon chips instead of a
// grid of large cards.
const TypeStrip = ({
  value,
  onChange,
}: {
  value: ContentType;
  onChange: (type: ContentType) => void;
}) => (
  <div
    className="flex flex-wrap gap-1"
    role="radiogroup"
    aria-label="Content type"
  >
    {(
      Object.entries(CONTENT_TYPE_CONFIG) as Array<
        [ContentType, (typeof CONTENT_TYPE_CONFIG)[ContentType]]
      >
    ).map(([type, cfg]) => {
      const selected = value === type;
      return (
        <button
          key={type}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(type)}
          className={`flex min-w-[48px] flex-col items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-1.5 transition-colors duration-150 ${
            selected
              ? "border-amber-300/60 bg-amber-200/15 text-amber-100"
              : "border-white/10 bg-white/[0.03] text-stone-400 hover:border-white/25 hover:text-stone-200"
          }`}
        >
          <span className="text-sm leading-none" aria-hidden>
            {cfg.icon}
          </span>
          <span className="text-[10px] font-medium leading-none">
            {cfg.label}
          </span>
        </button>
      );
    })}
  </div>
);

// Content form component
const ContentForm = ({
  nodeId,
  existingContent,
  contentCount,
  onSave,
  onCancel,
}: ContentFormProps) => {
  const { toast } = useToast();
  const [contentType, setContentType] = useState<ContentType>(
    existingContent?.content_type || "text",
  );
  const [contentTitle, setContentTitle] = useState(
    existingContent?.content_title || "",
  );
  const [contentUrl, setContentUrl] = useState(
    existingContent?.content_url || "",
  );
  const [contentBody, setContentBody] = useState(
    existingContent?.content_body || "",
  );
  // State for order code blocks
  const [codeBlocks, setCodeBlocks] = useState<string[]>(() => {
    if (
      existingContent?.content_type === "order_code" &&
      existingContent.content_body
    ) {
      try {
        return JSON.parse(existingContent.content_body);
      } catch {
        return [""];
      }
    }
    return [""];
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textEditorRef = useRef<RichTextEditorHandle>(null);

  const config = CONTENT_TYPE_CONFIG[contentType];

  const clearErrors = useCallback(() => setErrors([]), []);

  // Universal clipboard paste listener for images
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      // The rich text editor handles its own image pastes.
      if ((e.target as HTMLElement).closest?.(".ProseMirror")) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;

          e.preventDefault();
          setIsUploading(true);
          toast({
            title: "Uploading pasted image...",
            description: "Attaching image to content.",
          });

          try {
            const formData = new FormData();
            const ext = file.type.split("/")[1] || "png";
            const fileName = `pasted-image-${Date.now()}.${ext}`;
            formData.append("file", file, fileName);
            formData.append("nodeId", nodeId);

            const res = await fetch("/api/upload/images", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(
                errData.error || `Upload failed with status ${res.status}`,
              );
            }

            const data = await res.json();
            if (data.fileUrl) {
              if (contentType === "text") {
                // In text mode, drop the image into the rich text editor
                textEditorRef.current?.insertImage(data.fileUrl);
                toast({
                  title: "Image inserted into text!",
                });
              } else {
                // Set image URL and switch to image type
                setContentType("image");
                setContentUrl(data.fileUrl);
                setUploadedFileName(data.fileName || fileName);
                clearErrors();
                toast({
                  title: "Image uploaded successfully!",
                  description: "Image attached and ready to save.",
                });
              }
            }
          } catch (err: any) {
            console.error("Paste upload failed:", err);
            toast({
              title: "Image paste failed",
              description: err.message || "Could not upload pasted image.",
              variant: "destructive",
            });
          } finally {
            setIsUploading(false);
          }
          break;
        }
      }
    },
    [contentType, nodeId, clearErrors, toast],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateContentForm(
        contentType,
        contentUrl,
        contentBody,
      );

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      const payload: NodeContent = {
        id: existingContent?.id || generateTempId(),
        node_id: nodeId,
        content_type: contentType,
        content_title: contentTitle.trim() || null,
        content_url: [
          "video",
          "canva_slide",
          "resource_link",
          "image",
          "pdf",
        ].includes(contentType)
          ? contentUrl.trim()
          : null,
        content_body:
          contentType === "text" || contentType === "resource_link"
            ? contentBody.trim()
            : contentType === "order_code"
              ? JSON.stringify(codeBlocks.filter((b) => b.trim()))
              : null,
        display_order: existingContent?.display_order ?? contentCount,
        created_at: existingContent?.created_at || new Date().toISOString(),
      };

      setIsSaving(true);

      // Wrap in Promise to handle both sync and async onSave
      Promise.resolve(onSave(payload)).finally(() => {
        setIsSaving(false);
      });
    },
    [
      contentType,
      contentTitle,
      contentUrl,
      contentBody,
      codeBlocks,
      existingContent,
      nodeId,
      onSave,
      contentCount,
    ],
  );

  const handleFileUploadComplete = useCallback(
    (fileUrl: string, fileName: string) => {
      setContentUrl(fileUrl);
      setUploadedFileName(fileName);
      clearErrors();
    },
    [clearErrors],
  );

  const handleFileUploadError = useCallback((error: string) => {
    setErrors([error]);
  }, []);

  const handleUploadStateChange = useCallback((uploading: boolean) => {
    setIsUploading(uploading);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      onPaste={handlePaste}
      className="space-y-3 rounded-lg border border-amber-200/25 bg-amber-200/[0.04] p-3"
    >
      {errors.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4 text-xs">
              {errors.map((error, index) => (
                <li key={index} className="break-words">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <TypeStrip
        value={contentType}
        onChange={(type) => {
          setContentType(type);
          clearErrors();
        }}
      />

      {/* Optional heading, kept slim: one quiet input, no label chrome */}
      <Input
        id="content_title"
        autoFocus
        value={contentTitle}
        onChange={(e) => {
          setContentTitle(e.target.value);
          clearErrors();
        }}
        placeholder="Heading (optional)"
        className="h-8 border-white/10 bg-white/5 text-sm placeholder:text-stone-500 focus-visible:ring-1"
      />

      {/* URL-based types: one input, one hint line */}
      {(contentType === "video" ||
        contentType === "canva_slide" ||
        contentType === "resource_link") && (
        <div className="space-y-1.5">
          <Input
            id="content_url"
            value={contentUrl}
            onChange={(e) => {
              setContentUrl(e.target.value);
              clearErrors();
            }}
            placeholder={config.placeholder}
            className={`h-9 border-white/10 bg-white/5 text-sm focus-visible:ring-1 ${
              errors.some((e) => e.includes("URL")) ? "border-red-400/70" : ""
            }`}
          />
          {config.hint && (
            <p className="truncate text-[11px] text-muted-foreground">
              {config.hint}
            </p>
          )}
        </div>
      )}

      {/* Image: one unified zone (drop / paste / browse) + optional URL */}
      {contentType === "image" && (
        <div className="space-y-2">
          <FileUpload
            compact
            nodeId={nodeId}
            onUploadComplete={handleFileUploadComplete}
            onValidationError={handleFileUploadError}
            onUploadStateChange={handleUploadStateChange}
            accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
            maxSize={10}
            allowMultiple={false}
            uploadEndpoint="images"
          />
          {!contentUrl && (
            <Input
              id="image_url_direct"
              value={contentUrl}
              onChange={(e) => {
                setContentUrl(e.target.value);
                clearErrors();
              }}
              placeholder={config.placeholder}
              className="h-8 border-white/10 bg-white/5 text-xs focus-visible:ring-1"
            />
          )}
          {contentUrl && (
            <div className="overflow-hidden rounded-md border border-white/10 bg-black/20">
              <img
                src={contentUrl}
                alt="Attached preview"
                className="max-h-44 w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-1">
                <span className="truncate text-[11px] text-emerald-300">
                  ✓ {uploadedFileName || getFileName(contentUrl) || "attached"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setContentUrl("");
                    setUploadedFileName("");
                  }}
                  className="shrink-0 text-[11px] text-stone-400 hover:text-stone-200"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF: same unified zone, documents endpoint */}
      {contentType === "pdf" && (
        <div className="space-y-2">
          <FileUpload
            compact
            nodeId={nodeId}
            onUploadComplete={handleFileUploadComplete}
            onValidationError={handleFileUploadError}
            onUploadStateChange={handleUploadStateChange}
            accept=".pdf"
            maxSize={40}
            allowMultiple={false}
            uploadEndpoint="documents"
          />
          {(uploadedFileName || contentUrl) && (
            <p className="truncate text-[11px] text-emerald-300">
              ✓ {uploadedFileName || getFileName(contentUrl) || "PDF attached"}
            </p>
          )}
        </div>
      )}

      {/* Text body: Notion-style WYSIWYG, stored as markdown */}
      {contentType === "text" && (
        <div className="space-y-1.5">
          <RichTextEditor
            ref={textEditorRef}
            nodeId={nodeId}
            content={contentBody}
            onChange={(md) => {
              setContentBody(md);
              clearErrors();
            }}
            placeholder={config.placeholder}
          />
          <p className="truncate text-[11px] text-muted-foreground">
            {config.hint}
          </p>
        </div>
      )}

      {/* Resource link description stays plain and short */}
      {contentType === "resource_link" && (
        <div className="space-y-1.5">
          <Textarea
            id="content_body"
            value={contentBody}
            onChange={(e) => {
              setContentBody(e.target.value);
              clearErrors();
            }}
            className={`min-h-[110px] resize-y border-white/10 bg-white/5 text-sm focus-visible:ring-1 ${
              errors.some((e) => e.includes("Description"))
                ? "border-red-400/70"
                : ""
            }`}
            placeholder="What is this resource, and why should students open it?"
          />
          <p className="truncate text-[11px] text-muted-foreground">
            A clear description beats a bare URL.
          </p>
        </div>
      )}

      {/* Order Code Editor */}
      {contentType === "order_code" && (
        <div className="space-y-2">
          <div className="space-y-1.5">
            {codeBlocks.map((block, index) => (
              <div key={index} className="flex gap-1.5">
                <span className="mt-2 w-4 shrink-0 text-right font-mono text-[10px] text-stone-500">
                  {index + 1}
                </span>
                <Textarea
                  value={block}
                  onChange={(e) => {
                    const newBlocks = [...codeBlocks];
                    newBlocks[index] = e.target.value;
                    setCodeBlocks(newBlocks);
                    setContentBody(JSON.stringify(newBlocks));
                    clearErrors();

                    // Auto-resize
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  // Initialize height on mount
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  placeholder={`Code block ${index + 1}`}
                  className="min-h-[44px] flex-1 resize-none overflow-hidden border-white/10 bg-[#171310] font-mono text-xs text-stone-200 focus-visible:ring-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 self-start text-red-400 hover:bg-red-400/10 hover:text-red-300"
                  onClick={() => {
                    const newBlocks = codeBlocks.filter((_, i) => i !== index);
                    setCodeBlocks(newBlocks);
                    setContentBody(JSON.stringify(newBlocks));
                  }}
                  disabled={codeBlocks.length <= 1}
                  aria-label={`Remove code block ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCodeBlocks([...codeBlocks, ""])}
            className="h-8 w-full border-dashed text-xs"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Add block
          </Button>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Blocks save in this exact order. Students drag to reorder them or
            nest them inside containers.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-1.5 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving || isUploading}
          className="h-8 px-2.5 text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={
            isSaving ||
            isUploading ||
            ((contentType === "image" || contentType === "pdf") && !contentUrl)
          }
          className="h-8 px-3 text-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {existingContent ? "Update" : "Add"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Empty preview placeholder
const MissingPreview = () => (
  <p className="py-1 text-[11px] italic text-red-300/80">
    Nothing to preview yet. Edit to add content.
  </p>
);

// Expanded, on-demand preview. Heavy embeds (video, Canva) only mount while
// the row is expanded, so a long list stays fast. Previews are unboxed: the
// thread line on the left provides the structure, not another nested card.
const ContentPreview = ({ item }: { item: NodeContent }) => {
  const url = item.content_url;

  switch (item.content_type) {
    case "image":
      if (!url) return <MissingPreview />;
      return (
        <img
          src={url}
          alt={item.content_title || "Image content"}
          className="max-h-56 max-w-full rounded-md object-contain"
          loading="lazy"
        />
      );

    case "video": {
      if (!url) return <MissingPreview />;
      const embedUrl = getEmbedUrl(url);
      if (!embedUrl) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-amber-300 hover:underline"
          >
            📹 Open video: {url}
          </a>
        );
      }
      return (
        <iframe
          src={embedUrl}
          allowFullScreen
          className="aspect-video w-full rounded-md bg-black/30"
          title={item.content_title || "Video preview"}
          loading="lazy"
        />
      );
    }

    case "canva_slide":
      if (!url) return <MissingPreview />;
      return (
        <iframe
          src={url}
          allowFullScreen
          className="aspect-video w-full rounded-md bg-black/30"
          title={item.content_title || "Canva preview"}
          loading="lazy"
        />
      );

    case "text":
      if (!item.content_body) return <MissingPreview />;
      return (
        <div className="max-h-72 overflow-y-auto pr-1">
          <style jsx global>{`
            .ce-md {
              font-size: 13px;
              line-height: 1.7;
              color: rgb(214 211 209);
            }
            .ce-md h1,
            .ce-md h2,
            .ce-md h3,
            .ce-md h4 {
              color: rgb(245 245 244);
              font-weight: 600;
              line-height: 1.3;
              margin: 0.75rem 0 0.375rem;
            }
            .ce-md h1:first-child,
            .ce-md h2:first-child,
            .ce-md h3:first-child,
            .ce-md h4:first-child {
              margin-top: 0;
            }
            .ce-md h1 {
              font-size: 1.25rem;
            }
            .ce-md h2 {
              font-size: 1.125rem;
            }
            .ce-md h3,
            .ce-md h4 {
              font-size: 1rem;
            }
            .ce-md p {
              margin-bottom: 0.625rem;
            }
            .ce-md p:last-child {
              margin-bottom: 0;
            }
            .ce-md strong {
              color: rgb(231 229 228);
              font-weight: 600;
            }
            .ce-md a {
              color: rgb(252 211 77);
            }
            .ce-md ul,
            .ce-md ol {
              margin: 0.5rem 0;
              padding-left: 1.25rem;
            }
            .ce-md ul {
              list-style: disc;
            }
            .ce-md ol {
              list-style: decimal;
            }
            .ce-md li {
              margin-bottom: 0.25rem;
            }
            .ce-md code {
              background: rgb(28 25 23);
              border: 1px solid rgb(68 64 60);
              border-radius: 0.25rem;
              padding: 0.1rem 0.35rem;
              font-size: 11px;
            }
            .ce-md pre {
              background: rgb(12 10 9);
              border: 1px solid rgb(68 64 60);
              border-radius: 0.375rem;
              padding: 0.625rem;
              overflow-x: auto;
              margin: 0.5rem 0;
            }
            .ce-md pre code {
              background: transparent;
              border: none;
              padding: 0;
            }
            .ce-md blockquote {
              border-left: 3px solid rgb(252 211 77 / 0.4);
              padding-left: 0.75rem;
              margin: 0.5rem 0;
              font-style: italic;
              color: rgb(168 162 158);
            }
            .ce-md img {
              border-radius: 0.375rem;
              margin: 0.5rem 0;
              max-height: 240px;
            }
            .ce-md hr {
              border-color: rgb(68 64 60);
              margin: 0.75rem 0;
            }
          `}</style>
          <div
            className="ce-md"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(item.content_body),
            }}
          />
        </div>
      );

    case "pdf": {
      if (!url) return <MissingPreview />;
      return (
        <div className="flex items-center gap-2.5 rounded-md bg-white/[0.04] p-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-red-500/15 text-base"
            aria-hidden
          >
            📄
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-stone-200">
              {getFileName(url)}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              PDF document
            </span>
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs text-amber-300 hover:underline"
          >
            Open
          </a>
        </div>
      );
    }

    case "resource_link":
      if (!url && !item.content_body) return <MissingPreview />;
      return (
        <div className="space-y-1.5 py-0.5">
          {item.content_body && (
            <p className="text-[13px] leading-relaxed text-stone-300">
              {item.content_body}
            </p>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-xs text-amber-300 hover:underline"
            >
              🔗 {url}
            </a>
          )}
        </div>
      );

    case "order_code": {
      let blocks: string[] = [];
      try {
        blocks = JSON.parse(item.content_body || "[]");
      } catch {
        blocks = [];
      }
      if (!blocks.length) return <MissingPreview />;
      return (
        <div className="space-y-1">
          {blocks.map((block, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded bg-[#171310] px-2 py-1"
            >
              <span className="mt-0.5 font-mono text-[10px] text-stone-500">
                {i + 1}
              </span>
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-stone-300">
                {block.split("\n")[0] || "(empty block)"}
              </code>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
};

// One flat row per content item: drag handle, thumbnail/icon, single-line
// label, actions. Expanding shows the preview beside a Reddit-style thread
// line; clicking the line collapses. Text rows edit inline, in place.
const SortableContentRow = ({
  item,
  nodeId,
  disabled,
  expanded,
  inlineEditing,
  onToggleExpand,
  onEdit,
  onDelete,
  onInlineSave,
  onInlineCancel,
}: {
  item: NodeContent;
  nodeId: string;
  disabled: boolean;
  expanded: boolean;
  inlineEditing: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInlineSave: (item: NodeContent, draft: string) => void;
  onInlineCancel: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const cfg = CONTENT_TYPE_CONFIG[item.content_type];
  const missing = !item.content_url && !item.content_body;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "relative z-10 opacity-70" : undefined}
    >
      {/* Header row */}
      <div className="flex items-center gap-0.5 py-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label="Drag to reorder"
          className="shrink-0 cursor-grab touch-none rounded p-1 text-stone-600 hover:text-stone-300 active:cursor-grabbing disabled:pointer-events-none disabled:opacity-25"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {inlineEditing ? (
          <div className="min-w-0 flex-1 px-1 py-0.5">
            <RichTextEditor
              nodeId={nodeId}
              content={item.content_body || ""}
              onSave={(md) => onInlineSave(item, md)}
              onCancel={onInlineCancel}
              showActions
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md px-1 py-0.5 text-left transition-colors hover:bg-white/5"
          >
            {item.content_type === "image" && item.content_url ? (
              <img
                src={item.content_url}
                alt=""
                loading="lazy"
                className="h-8 w-8 shrink-0 rounded border border-white/10 object-cover"
              />
            ) : (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-sm"
                aria-hidden
              >
                {cfg.icon}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate whitespace-nowrap text-[13px] font-medium text-stone-200">
                {getContentLabel(item)}
              </span>
              <span className="block truncate whitespace-nowrap text-[11px] text-muted-foreground">
                {cfg.label}
                {missing && (
                  <span className="text-red-300"> · missing content</span>
                )}
              </span>
            </span>
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 text-stone-500 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </button>
        )}

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            aria-label="Edit content"
            title={
              item.content_type === "text" ? "Edit inline" : "Edit content"
            }
            className="rounded p-1.5 text-stone-400 hover:bg-white/10 hover:text-stone-100 disabled:pointer-events-none disabled:opacity-25"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            aria-label="Delete content"
            className="rounded p-1.5 text-stone-400 hover:bg-red-400/10 hover:text-red-300 disabled:pointer-events-none disabled:opacity-25"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded preview with a Reddit-style thread line collapse rail */}
      {expanded && !inlineEditing && (
        <div className="flex">
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label="Collapse preview"
            title="Collapse"
            className="group/thread w-6 shrink-0 self-stretch"
          >
            <span className="mx-auto block h-full w-px bg-white/15 transition-colors duration-150 group-hover/thread:bg-amber-200/70" />
          </button>
          <div className="min-w-0 flex-1 pb-2.5 pr-1">
            <ContentPreview item={item} />
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
export function ContentEditor({
  nodeId,
  content,
  onContentChange,
}: ContentEditorProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [quickUploading, setQuickUploading] = useState(false);

  const isFormActive = isAdding || editingId;
  // While any editing surface is open, freeze the list's drag/actions so a
  // stray click cannot yank state away mid-edit.
  const listBusy =
    !!isFormActive || inlineEditId !== null || insertAt !== null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Sort content by display_order for rendering
  const sortedContent = useMemo(() => {
    return [...content].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
    );
  }, [content]);

  const sortedIds = useMemo(
    () => sortedContent.map((item) => item.id),
    [sortedContent],
  );

  const signalSaveStart = () => {
    if (typeof (window as any).__startContentAutoSave === "function") {
      (window as any).__startContentAutoSave();
    }
  };

  const signalSaveFinish = () => {
    if (typeof (window as any).__finishContentAutoSave === "function") {
      (window as any).__finishContentAutoSave();
    }
  };

  const handleSave = useCallback(
    async (savedContent: NodeContent) => {
      if (
        !savedContent.id ||
        !savedContent.node_id ||
        !savedContent.content_type
      ) {
        console.error("Invalid content data:", savedContent);
        toast({
          title: "Invalid content data",
          description: "Content is missing required fields",
          variant: "destructive",
        });
        return;
      }

      const existingIndex = content.findIndex((c) => c.id === savedContent.id);

      signalSaveStart();

      try {
        let finalContent: NodeContent;

        if (existingIndex >= 0 && !savedContent.id.startsWith("temp_")) {
          // Update existing content in database
          finalContent = await updateNodeContent(savedContent.id, {
            content_type: savedContent.content_type,
            content_title: savedContent.content_title,
            content_url: savedContent.content_url,
            content_body: savedContent.content_body,
            display_order: savedContent.display_order,
          });

          // Update local state
          const updatedContent = [...content];
          updatedContent[existingIndex] = finalContent;
          onContentChange(updatedContent);

          toast({ title: "Content updated successfully!" });

          signalSaveFinish();
        } else {
          // Create new content in database
          finalContent = await createNodeContent({
            node_id: nodeId,
            content_type: savedContent.content_type,
            content_title: savedContent.content_title,
            content_url: savedContent.content_url,
            content_body: savedContent.content_body,
            display_order: savedContent.display_order ?? 0,
          });

          // Add to local state
          onContentChange([...content, finalContent]);

          toast({ title: "Content added successfully!" });

          signalSaveFinish();

          // Reveal the new item so the author sees what students will see
          setExpandedId(finalContent.id);
        }

        // Reset form state
        setIsAdding(false);
        setEditingId(null);
      } catch (error) {
        console.error("❌ Failed to save content:", error);
        toast({
          title: "Failed to save content",
          description: (error as Error).message || "Unknown error",
          variant: "destructive",
        });
      }
    },
    [content, onContentChange, nodeId, toast],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      signalSaveStart();

      try {
        // Delete from database if it's not a temp ID
        if (!id.startsWith("temp_")) {
          await deleteNodeContent(id);
        }

        // Update local state
        onContentChange(content.filter((c) => c.id !== id));
        if (expandedId === id) setExpandedId(null);
        toast({ title: "Content deleted successfully!" });

        signalSaveFinish();
      } catch (error) {
        console.error("❌ Failed to delete content:", error);
        toast({
          title: "Failed to delete content",
          description: (error as Error).message || "Unknown error",
          variant: "destructive",
        });
      }
    },
    [content, onContentChange, toast, expandedId],
  );

  const handleEdit = useCallback((id: string) => {
    setExpandedId(null);
    setEditingId(id);
  }, []);

  const handleCancelForm = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
  }, []);

  const confirmDelete = useCallback(
    (id: string) => {
      if (window.confirm("Are you sure you want to delete this content?")) {
        handleDelete(id);
      }
    },
    [handleDelete],
  );

  // Drag-to-sort: reorder locally, then persist the display_order of every
  // item whose position actually changed.
  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;

      const oldIndex = sortedContent.findIndex((c) => c.id === active.id);
      const newIndex = sortedContent.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedContent, oldIndex, newIndex).map(
        (item, idx) => ({ ...item, display_order: idx }),
      );

      // Update local state immediately for UI responsiveness
      onContentChange(reordered);

      // Persist only the items whose order changed
      const changed = reordered.filter((item) => {
        const before = sortedContent.find((c) => c.id === item.id);
        return before?.display_order !== item.display_order;
      });

      try {
        await Promise.all(
          changed
            .filter((item) => !item.id.startsWith("temp_"))
            .map((item) =>
              updateNodeContent(item.id, { display_order: item.display_order }),
            ),
        );
      } catch (error) {
        console.error("Failed to save content order:", error);
        toast({
          title: "Order update failed",
          description: "The new order was not saved to the database",
          variant: "destructive",
        });
      }
    },
    [sortedContent, onContentChange, toast],
  );

  // Quick capture: detect the block type from the pasted/typed text, create
  // it immediately, optionally at a seam position.
  const handleQuickCreate = useCallback(
    async (draft: QuickDraft, atIndex?: number) => {
      signalSaveStart();

      try {
        const created = await createNodeContent({
          node_id: nodeId,
          content_type: draft.type,
          content_title: null,
          content_url: draft.url,
          content_body: draft.body,
          display_order: atIndex ?? sortedContent.length,
        });

        let next: NodeContent[];
        if (atIndex !== undefined) {
          const withInserted = [...sortedContent];
          withInserted.splice(atIndex, 0, created);
          next = withInserted.map((item, idx) => ({
            ...item,
            display_order: idx,
          }));

          // Persist the order shift of everything below the insertion point
          const shifted = next.filter((item) => {
            if (item.id === created.id || item.id.startsWith("temp_")) {
              return false;
            }
            const before = sortedContent.find((c) => c.id === item.id);
            return before?.display_order !== item.display_order;
          });
          Promise.all(
            shifted.map((item) =>
              updateNodeContent(item.id, { display_order: item.display_order }),
            ),
          ).catch((e) =>
            console.error("Failed to persist shifted order:", e),
          );
        } else {
          next = [...content, created];
        }

        onContentChange(next);
        setInsertAt(null);
        setExpandedId(created.id);
        toast({ title: `${CONTENT_TYPE_CONFIG[draft.type].label} added` });

        signalSaveFinish();
      } catch (error) {
        console.error("Quick add failed:", error);
        toast({
          title: "Couldn't add content",
          description: (error as Error).message || "Unknown error",
          variant: "destructive",
        });
      }
    },
    [content, sortedContent, nodeId, onContentChange, toast],
  );

  const handleQuickSubmit = useCallback(
    (text: string, atIndex?: number) => {
      handleQuickCreate(detectContent(text), atIndex);
    },
    [handleQuickCreate],
  );

  // Pasted an image file into quick capture: upload first, then create the
  // image block.
  const handlePasteImageCreate = useCallback(
    async (file: File, atIndex?: number) => {
      setQuickUploading(true);
      toast({ title: "Uploading image…" });

      try {
        const formData = new FormData();
        const ext = file.type.split("/")[1] || "png";
        formData.append("file", file, `pasted-image-${Date.now()}.${ext}`);
        formData.append("nodeId", nodeId);

        const res = await fetch("/api/upload/images", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed (${res.status})`);
        }

        const data = await res.json();
        if (data.fileUrl) {
          await handleQuickCreate(
            { type: "image", url: data.fileUrl, body: null },
            atIndex,
          );
        }
      } catch (error) {
        console.error("Image paste failed:", error);
        toast({
          title: "Image upload failed",
          description: (error as Error).message || "Unknown error",
          variant: "destructive",
        });
      } finally {
        setQuickUploading(false);
      }
    },
    [nodeId, handleQuickCreate, toast],
  );

  // Inline text edit commits through the same save path as the full form.
  const handleInlineSave = useCallback(
    async (item: NodeContent, draft: string) => {
      setInlineEditId(null);
      const next = draft.trim();
      const prev = (item.content_body || "").trim();
      if (next === prev) return;
      if (!next) {
        toast({
          title: "Text can't be empty",
          description: "Reverted to the previous content.",
        });
        return;
      }
      await handleSave({ ...item, content_body: next });
    },
    [handleSave, toast],
  );

  return (
    <div className="w-full">
      {/* Seam above the first row */}
      {content.length > 0 && !listBusy && insertAt !== 0 && (
        <InsertSeam onClick={() => setInsertAt(0)} />
      )}
      {insertAt === 0 && (
        <div className="pb-1.5">
          <QuickAddRow
            autoFocus
            uploading={quickUploading}
            onSubmit={(t) => handleQuickSubmit(t, 0)}
            onPasteImage={(f) => handlePasteImageCreate(f, 0)}
            onCancel={() => setInsertAt(null)}
          />
        </div>
      )}

      {/* Content list: flat rows separated by hairlines, drag to reorder */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="divide-y divide-white/[0.06]">
            {sortedContent.map((item, index) => (
              <div key={item.id}>
                {/* Insert seam between rows */}
                {index > 0 && !listBusy && insertAt !== index && (
                  <InsertSeam onClick={() => setInsertAt(index)} />
                )}
                {insertAt === index && (
                  <div className="py-1.5">
                    <QuickAddRow
                      autoFocus
                      uploading={quickUploading}
                      onSubmit={(t) => handleQuickSubmit(t, index)}
                      onPasteImage={(f) => handlePasteImageCreate(f, index)}
                      onCancel={() => setInsertAt(null)}
                    />
                  </div>
                )}

                {editingId === item.id ? (
                  <div className="py-1.5">
                    <ContentForm
                      nodeId={nodeId}
                      existingContent={item}
                      contentCount={content.length}
                      onSave={handleSave}
                      onCancel={handleCancelForm}
                    />
                  </div>
                ) : (
                  <SortableContentRow
                    item={item}
                    nodeId={nodeId}
                    disabled={listBusy}
                    expanded={expandedId === item.id}
                    inlineEditing={inlineEditId === item.id}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    onEdit={() => {
                      if (item.content_type === "text") {
                        setExpandedId(null);
                        setInlineEditId(item.id);
                      } else {
                        handleEdit(item.id);
                      }
                    }}
                    onDelete={() => confirmDelete(item.id)}
                    onInlineSave={handleInlineSave}
                    onInlineCancel={() => setInlineEditId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty state: quick capture is the first thing you see */}
      {content.length === 0 && !isAdding && (
        <div className="py-1.5">
          <p className="mb-2 text-center text-[11px] text-muted-foreground">
            No materials yet
          </p>
          <QuickAddRow
            uploading={quickUploading}
            showMore
            onSubmit={(t) => handleQuickSubmit(t)}
            onPasteImage={(f) => handlePasteImageCreate(f)}
            onOpenFull={() => setIsAdding(true)}
          />
        </div>
      )}

      {/* Bottom quick capture, always available */}
      {!listBusy && content.length > 0 && (
        <div className="mt-1.5">
          <QuickAddRow
            uploading={quickUploading}
            showMore
            onSubmit={(t) => handleQuickSubmit(t)}
            onPasteImage={(f) => handlePasteImageCreate(f)}
            onOpenFull={() => setIsAdding(true)}
          />
        </div>
      )}

      {/* Full editor form */}
      {isAdding && (
        <div className="pt-1.5">
          <ContentForm
            nodeId={nodeId}
            contentCount={content.length}
            onSave={handleSave}
            onCancel={handleCancelForm}
          />
        </div>
      )}
    </div>
  );
}
