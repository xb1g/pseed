"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NodeContent, ContentType } from "@/types/map";
import {
  Trash2,
  PlusCircle,
  Plus,
  Check,
  AlertCircle,
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "@/components/ui/file-upload";
import {
  createNodeContent,
  updateNodeContent,
  deleteNodeContent,
} from "@/lib/supabase/nodes";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadImage } from "@/lib/utils/upload-image";
import {
  RichTextEditor,
  RichTextEditorHandle,
} from "@/components/map/RichTextEditor";
import { ContentBlockPreview } from "@/components/map/ContentBlockPreview";
import {
  sliceAndUploadWebtoon,
  parseWebtoonBody,
  serializeWebtoonBody,
  WebtoonSliceError,
  type SliceProgress,
} from "@/lib/utils/webtoon-slice";
import type { WebtoonPanel } from "@/types/map";

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
  webtoon: {
    label: "Webtoon",
    icon: "📜",
    placeholder: "",
    hint: "Upload one long vertical image, students scroll it like a webtoon",
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

  if (contentType === "webtoon") {
    if (parseWebtoonBody(contentBody).panels.length === 0) {
      errors.push("Please upload a webtoon image");
    }
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
const getFileName = (url?: string | null): string => {
  if (!url) return "";
  const raw = url.split("/").pop() || "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
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

// Hover seam between two blocks. Hovering it marks the insertion point for
// pasted/dropped images; clicking it turns the seam into a quick capture
// input that inserts at exactly that position.
const InsertSeam = ({
  onClick,
  onHover,
}: {
  onClick: () => void;
  onHover?: () => void;
}) => (
  <div
    role="button"
    aria-label="Insert content here"
    onClick={onClick}
    onMouseEnter={onHover}
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
  // Webtoon panels, hydrated from the saved JSON body when editing.
  const [webtoonPanels, setWebtoonPanels] = useState<WebtoonPanel[]>(() =>
    existingContent?.content_type === "webtoon"
      ? parseWebtoonBody(existingContent.content_body).panels
      : [],
  );
  const [sliceProgress, setSliceProgress] = useState<SliceProgress | null>(null);
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
        contentType === "webtoon"
          ? serializeWebtoonBody(webtoonPanels)
          : contentBody,
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
          : // Keep the first panel in content_url so existing preview and
            // thumbnail code that only reads content_url still has an image.
            contentType === "webtoon"
            ? (webtoonPanels[0]?.url ?? null)
            : null,
        content_body:
          contentType === "text" || contentType === "resource_link"
            ? contentBody.trim()
            : contentType === "order_code"
              ? JSON.stringify(codeBlocks.filter((b) => b.trim()))
              : contentType === "webtoon"
                ? serializeWebtoonBody(webtoonPanels)
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
      webtoonPanels,
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

  // One long image in, many ordered panels out. Appends rather than replaces so
  // an author can build a chapter from several strips.
  const handleWebtoonFile = useCallback(
    async (file: File) => {
      clearErrors();
      setIsUploading(true);
      setSliceProgress(null);

      try {
        const panels = await sliceAndUploadWebtoon({
          file,
          nodeId,
          onProgress: setSliceProgress,
        });
        setWebtoonPanels((prev) => [...prev, ...panels]);
        toast({
          title: `Webtoon ready`,
          description: `${panels.length} panel${panels.length === 1 ? "" : "s"} uploaded.`,
        });
      } catch (error) {
        setErrors([
          error instanceof WebtoonSliceError
            ? error.message
            : "Could not process that webtoon image. Please try again.",
        ]);
      } finally {
        setIsUploading(false);
        setSliceProgress(null);
      }
    },
    [nodeId, clearErrors, toast],
  );

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

      {/* Webtoon: drop one long strip, we slice and upload it as panels */}
      {contentType === "webtoon" && (
        <div className="space-y-2">
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/15 bg-white/[0.03] px-3 py-4 text-center transition-colors hover:border-white/30 ${
              isUploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Reset so picking the same file twice still fires onChange.
                e.target.value = "";
                if (file) void handleWebtoonFile(file);
              }}
            />
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                <span className="text-[11px] text-stone-300">
                  {sliceProgress
                    ? `${sliceProgress.stage === "slicing" ? "Slicing" : "Uploading"} panel ${sliceProgress.current} of ${sliceProgress.total}`
                    : "Reading image…"}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg leading-none" aria-hidden>
                  📜
                </span>
                <span className="text-xs font-medium text-stone-200">
                  {webtoonPanels.length ? "Add another strip" : "Choose your webtoon image"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {config.hint}
                </span>
              </>
            )}
          </label>

          {webtoonPanels.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-white/10 bg-black/20 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-300">
                  ✓ {webtoonPanels.length} panel
                  {webtoonPanels.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setWebtoonPanels([]);
                    clearErrors();
                  }}
                  className="text-[11px] text-stone-400 hover:text-stone-200"
                >
                  Clear all
                </button>
              </div>
              {/* Horizontal filmstrip: a compact way to confirm order and
                  spot a panel that landed out of place. */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {webtoonPanels.map((panel, index) => (
                  <div
                    key={`${panel.url}-${index}`}
                    className="relative h-16 w-10 shrink-0 overflow-hidden rounded border border-white/10"
                  >
                    <img
                      src={panel.url}
                      alt={`Panel ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-black/70 px-1 text-[9px] text-stone-300">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Panels display top to bottom in this order, with no gaps.
              </p>
            </div>
          )}
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

// Main component
export function ContentEditor({
  nodeId,
  content,
  onContentChange,
}: ContentEditorProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [quickUploading, setQuickUploading] = useState(false);
  // Where a pasted/dropped image lands: the last seam the author hovered,
  // else the end of the document. A ref so hover does not re-render.
  const insertPointRef = useRef<number | null>(null);
  // Latest content for async upload completions (props are stale by then).
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

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
    [content, onContentChange, toast],
  );

  const handleEdit = useCallback((id: string) => {
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
        const { fileUrl } = await uploadImage(file, nodeId);
        await handleQuickCreate(
          { type: "image", url: fileUrl, body: null },
          atIndex,
        );
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

  // Document-level image paste/drop: each file becomes an image block at the
  // current insertion point, shown immediately as an optimistic placeholder
  // (blob URL) while the real upload runs in the background.
  const handleImageFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      const before = [...contentRef.current].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
      );
      const at = Math.min(
        Math.max(insertPointRef.current ?? before.length, 0),
        before.length,
      );

      const placeholders: NodeContent[] = files.map((file, i) => ({
        id: generateTempId(),
        node_id: nodeId,
        content_type: "image",
        content_title: null,
        content_url: URL.createObjectURL(file),
        content_body: null,
        display_order: at + i,
        created_at: new Date().toISOString(),
      }));

      const withPlaceholders = [...before];
      withPlaceholders.splice(at, 0, ...placeholders);
      const renumbered = withPlaceholders.map((item, idx) => ({
        ...item,
        display_order: idx,
      }));
      onContentChange(renumbered);

      // Persist the order shift of everything below the insertion point.
      const shifted = renumbered.filter((item) => {
        if (item.id.startsWith("temp_")) return false;
        const prev = before.find((b) => b.id === item.id);
        return !!prev && prev.display_order !== item.display_order;
      });
      Promise.all(
        shifted.map((item) =>
          updateNodeContent(item.id, { display_order: item.display_order }),
        ),
      ).catch((e) => console.error("Failed to persist shifted order:", e));

      await Promise.all(
        placeholders.map(async (placeholder, i) => {
          const blobUrl = placeholder.content_url;
          try {
            const { fileUrl } = await uploadImage(files[i], nodeId);
            const created = await createNodeContent({
              node_id: nodeId,
              content_type: "image",
              content_title: null,
              content_url: fileUrl,
              content_body: null,
              display_order: placeholder.display_order,
            });

            const current = contentRef.current;
            if (!current.some((c) => c.id === placeholder.id)) {
              // Placeholder was deleted while uploading; don't leave an
              // orphan row behind.
              deleteNodeContent(created.id).catch(() => {});
              return;
            }
            onContentChange(
              current.map((c) => (c.id === placeholder.id ? created : c)),
            );
          } catch (error) {
            console.error("Image upload failed:", error);
            onContentChange(
              contentRef.current.filter((c) => c.id !== placeholder.id),
            );
            toast({
              title: "Image upload failed",
              description: `${(error as Error).message || "Unknown error"}. Paste or drop the image again to retry.`,
              variant: "destructive",
            });
          } finally {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
          }
        }),
      );
    },
    [nodeId, onContentChange, toast],
  );

  // Pasting anywhere in the document (outside inputs, forms, and the rich
  // text editor, which handle their own paste) turns clipboard images into
  // image blocks.
  const handleDocumentPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest?.(
          'input, textarea, form, [contenteditable="true"], .ProseMirror',
        )
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (!files.length) return;

      e.preventDefault();
      void handleImageFiles(files);
    },
    [handleImageFiles],
  );

  const handleDocumentDrop = useCallback(
    (e: React.DragEvent) => {
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!files.length) return;
      e.preventDefault();
      void handleImageFiles(files);
    },
    [handleImageFiles],
  );

  const handleDocumentDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
  }, []);

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

  // The non-text block currently open in the edit dialog.
  const editingItem = editingId
    ? (sortedContent.find((c) => c.id === editingId) ?? null)
    : null;

  return (
    <div
      className="w-full"
      onPaste={handleDocumentPaste}
      onDrop={handleDocumentDrop}
      onDragOver={handleDocumentDragOver}
    >
      {/* Seam above the first block */}
      {content.length > 0 && !listBusy && insertAt !== 0 && (
        <InsertSeam
          onClick={() => {
            insertPointRef.current = 0;
            setInsertAt(0);
          }}
          onHover={() => {
            insertPointRef.current = 0;
          }}
        />
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

      {/* Document body: each block renders exactly like students see it,
          with hover controls for drag, edit, and delete */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedIds}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {sortedContent.map((item, index) => (
              <div key={item.id}>
                {/* Insert seam between blocks */}
                {index > 0 && !listBusy && insertAt !== index && (
                  <InsertSeam
                    onClick={() => {
                      insertPointRef.current = index;
                      setInsertAt(index);
                    }}
                    onHover={() => {
                      insertPointRef.current = index;
                    }}
                  />
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

                <ContentBlockPreview
                  item={item}
                  disabled={listBusy}
                  uploading={
                    item.id.startsWith("temp_") &&
                    !!item.content_url?.startsWith("blob:")
                  }
                  onEdit={() => {
                    if (item.content_type === "text") {
                      setInlineEditId(item.id);
                    } else {
                      handleEdit(item.id);
                    }
                  }}
                  onDelete={() => confirmDelete(item.id)}
                  onPreviewClick={
                    item.content_type === "text" && !listBusy
                      ? () => setInlineEditId(item.id)
                      : undefined
                  }
                  editor={
                    inlineEditId === item.id ? (
                      <RichTextEditor
                        nodeId={nodeId}
                        content={item.content_body || ""}
                        onSave={(md) => handleInlineSave(item, md)}
                        onCancel={() => setInlineEditId(null)}
                        saveOnBlur
                        showActions
                        autoFocus
                      />
                    ) : undefined
                  }
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty state: quick capture is the first thing you see */}
      {content.length === 0 && !isAdding && (
        <div className="py-1.5">
          <p className="mb-2 text-center text-[11px] text-muted-foreground">
            No materials yet. Paste an image or link to start.
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

      {/* Non-text blocks edit through the existing form, in a dialog so the
          document keeps its shape behind it */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="max-w-xl border-white/10 bg-stone-950 text-stone-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-stone-200">
              Edit content
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ContentForm
              nodeId={nodeId}
              existingContent={editingItem}
              contentCount={content.length}
              onSave={handleSave}
              onCancel={handleCancelForm}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
