// app/components/NodeViewPanel/nodeViewHelpers.ts
import { memo, useMemo } from "react";
import { NodeContent } from "@/types/map";
import { ImageIcon, PlayCircle, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import Embed, { defaultProviders } from "react-tiny-oembed";
import { CanvaEmbed } from "./CanvaEmbed";
import { marked } from "marked";
import { OrderCodeActivity } from "./OrderCodeActivity";
import { WebtoonReader } from "./WebtoonReader";
import { parseWebtoonBody } from "@/lib/utils/webtoon-slice";
import { sanitizeHtml } from "@/lib/security/sanitize-html";

// Configure marked options for security and consistency
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br> tags
});
// Utility function to detect if content contains markdown syntax
const containsMarkdownSyntax = (content: string): boolean => {
  const markdownPatterns = [
    /^#{1,6}\s+/m, // Headers (# ## ### etc)
    /\*\*.*?\*\*/g, // Bold **text**
    /\*.*?\*/g, // Italic *text*
    /^[-*+]\s+/m, // Unordered lists
    /^\d+\.\s+/m, // Ordered lists
    /\[.*?\]\(.*?\)/g, // Links [text](url)
    /!\[.*?\]\(.*?\)/g, // Images ![alt](url)
    /`.*?`/g, // Inline code
    /^```/m, // Code blocks
    /^>/m, // Blockquotes
    /^---$/m, // Horizontal rules
    /~~.*?~~/g, // Strikethrough
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
};

// Utility function to process text content (markdown or HTML)
const processTextContent = (content: string): string => {
  if (!content) return "";

  // If content contains markdown syntax, parse as markdown
  if (containsMarkdownSyntax(content)) {
    try {
      return sanitizeHtml(marked.parse(content) as string);
    } catch (error) {
      console.error("Error parsing markdown:", error);
      // Fallback to raw content if markdown parsing fails
      return sanitizeHtml(content);
    }
  }

  // Otherwise, treat as HTML (existing behavior)
  return sanitizeHtml(content);
};

// Custom fallback components for better UX - memoized to prevent unnecessary re-renders
const LoadingFallback = memo(({ url }: { url: string }) => (
  <div className="aspect-video bg-gradient-to-br from-stone-800/80 to-stone-900/80 rounded-lg flex flex-col items-center justify-center text-center p-6 animate-pulse">
    <PlayCircle className="h-12 w-12 text-stone-500 mb-4" />
    <h3 className="font-semibold text-stone-300 mb-2">Loading content...</h3>
    <p className="text-sm text-stone-500">Preparing your media for viewing</p>
  </div>
));
LoadingFallback.displayName = "LoadingFallback";

const ErrorFallback = memo(({ url }: { url: string }) => (
  <div className="aspect-video bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center text-center p-6">
    <ExternalLink className="h-12 w-12 text-red-400 mb-4" />
    <h3 className="font-semibold text-red-700 mb-2">Content unavailable</h3>
    <p className="text-sm text-red-600 mb-4">
      Unable to embed this content directly
    </p>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center"
    >
      <Button
        variant="outline"
        size="sm"
        className="border-red-300 hover:bg-red-50"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Open in new tab
      </Button>
    </a>
  </div>
));
ErrorFallback.displayName = "ErrorFallback";

// Custom image component for better styling - memoized
const CustomImageComponent = memo(({ responce }: { responce?: any }) => {
  if (!responce?.url) return null;

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg bg-white">
      <img
        src={responce.url}
        alt={responce.title || responce.author_name || "Embedded content"}
        className="w-full h-auto object-cover"
        style={{ maxHeight: "400px" }}
      />
      {responce.provider_name && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white text-sm font-medium">
            From {responce.provider_name}
          </p>
          {responce.title && (
            <p className="text-white/90 text-xs mt-1">{responce.title}</p>
          )}
        </div>
      )}
    </div>
  );
});
CustomImageComponent.displayName = "CustomImageComponent";

// Video Embed Component - memoized to prevent re-renders
// Handles both embedded videos (YouTube, Vimeo) and direct video files (uploaded to Supabase)
const VideoEmbed = memo(({ contentUrl }: { contentUrl: string }) => {
  console.log("🎥 VideoEmbed rendering for URL:", contentUrl);

  // Check if this is a direct video file (uploaded to storage) vs embedded video
  const isDirectVideo = useMemo(() => {
    return contentUrl.includes('supabase.co/storage') ||
           contentUrl.endsWith('.mp4') ||
           contentUrl.endsWith('.webm') ||
           contentUrl.endsWith('.mov') ||
           contentUrl.endsWith('.avi') ||
           contentUrl.endsWith('.mpeg');
  }, [contentUrl]);

  const embedOptions = useMemo(() => ({
    maxwidth: 800,
    maxheight: 450,
    align: "center" as const,
  }), []);

  const embedStyle = useMemo(() => ({
    width: "100%",
    maxWidth: "100%",
    borderRadius: "8px",
    overflow: "hidden",
  }), []);

  const embedKey = useMemo(() => {
    return `video-${contentUrl.split('/').pop()?.split('?')[0] || 'embed'}`;
  }, [contentUrl]);

  // For direct video files, use HTML5 video player
  if (isDirectVideo) {
    return (
      <div className="w-full" key={embedKey}>
        <video
          controls
          className="w-full rounded-lg shadow-lg"
          style={{ maxWidth: "100%", backgroundColor: "#000" }}
          preload="metadata"
        >
          <source src={contentUrl} type="video/mp4" />
          <source src={contentUrl} type="video/webm" />
          <source src={contentUrl} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // For embedded videos (YouTube, Vimeo, etc.), use react-tiny-oembed
  return (
    <div className="w-full" key={embedKey}>
      <Embed
        url={contentUrl}
        options={embedOptions}
        style={embedStyle}
        LoadingFallbackElement={<LoadingFallback url={contentUrl} />}
        FallbackElement={<ErrorFallback url={contentUrl} />}
        ImgComponent={CustomImageComponent}
      />
    </div>
  );
});
VideoEmbed.displayName = "VideoEmbed";

// Image Component - memoized
const ImageContent = memo(({ contentUrl }: { contentUrl: string }) => {
  console.log("🖼️ ImageContent rendering for URL:", contentUrl);

  return (
    <div className="w-full">
      <div className="relative rounded-lg shadow-lg bg-white overflow-hidden">
        <img
          src={contentUrl}
          alt="Uploaded image content"
          className="w-full h-auto object-contain"
          style={{ maxWidth: "100%" }}
        />
      </div>
    </div>
  );
});
ImageContent.displayName = "ImageContent";

// Text Content Component - memoized with markdown support
const TextContent = memo(({ contentBody }: { contentBody: string }) => {
  console.log("📝 TextContent rendering, content length:", contentBody?.length || 0);

  const processedContent = useMemo(() => {
    return processTextContent(contentBody || "");
  }, [contentBody]);

  return (
    <div className="px-2 py-1">
      <div
        className="learning-content-text"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
});
TextContent.displayName = "TextContent";

// Move renderContent here and optimize it
export const renderContent = (
  content: NodeContent,
  nodeTitle?: string | null,
  onOpenImage?: (img: { src: string; alt: string; caption?: string }) => void,
) => {
  const contentUrl = content.content_url;
  const contentType = content.content_type;
  const contentTitle = content.content_title;

  // Create a stable key based on content ID to prevent unnecessary remounts
  const contentKey = `content-${content.id}-${contentType}`;

  // Render title if present — but never repeat the node title verbatim
  // (generators often copy the node title onto the first content item,
  // which reads as a duplicated heading under the panel header).
  const trimmedTitle = contentTitle?.trim();
  const isDuplicateOfNodeTitle =
    !!trimmedTitle &&
    !!nodeTitle?.trim() &&
    trimmedTitle.localeCompare(nodeTitle.trim(), undefined, {
      sensitivity: "accent",
    }) === 0;
  const TitleSection = trimmedTitle && !isDuplicateOfNodeTitle ? (
    <div className="mb-4 pb-3 border-b border-stone-200 dark:border-stone-700">
      <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
        {contentTitle}
      </h3>
    </div>
  ) : null;

  // Handle backward compatibility for old content type
  if (contentType === "text_with_images" as any) {
    return (
      <div key={contentKey}>
        {TitleSection}
        <TextContent contentBody={content.content_body || ""} />
      </div>
    );
  }

  switch (contentType) {
    case "video":
    case "short_video":
      if (!contentUrl) {
        return <ErrorFallback url="#" key={contentKey} />;
      }
      return (
        <div key={contentKey}>
          {TitleSection}
          <VideoEmbed contentUrl={contentUrl} />
        </div>
      );

    case "text":
      return (
        <div key={contentKey}>
          {TitleSection}
          <TextContent contentBody={content.content_body || ""} />
        </div>
      );

    case "image":
      if (!contentUrl) {
        return <ErrorFallback url="#" key={contentKey} />;
      }
      return (
        <div key={contentKey}>
          {TitleSection}
          <ImageContent
            contentUrl={contentUrl}
            contentTitle={contentTitle}
            onOpenImage={onOpenImage}
          />
        </div>
      );

    case "pdf":
      if (!contentUrl) {
        return <ErrorFallback url="#" />;
      }

      const fileName = contentUrl.split('/').pop() || 'document.pdf';

      return (
        <div className="w-full space-y-4" key={contentKey}>
          {TitleSection}
          {/* PDF Viewer with better options */}
          <div className="relative w-full bg-white rounded-lg shadow-lg border border-stone-200">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-4 bg-stone-50 border-b border-stone-200 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">PDF</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-stone-900 block">
                    {isDuplicateOfNodeTitle
                      ? fileName
                      : contentTitle?.trim() || fileName}
                  </span>
                  <span className="text-xs text-stone-500">
                    PDF Document
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-700 hover:text-amber-800 border-amber-300 hover:bg-amber-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Full Screen
                  </Button>
                </a>
              </div>
            </div>

            {/* Multiple PDF viewing options for better compatibility */}
            <div className="relative w-full">
              {/* Primary PDF viewer using Google Docs viewer */}
              <div className="bg-stone-100 p-2 rounded">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(contentUrl)}&embedded=true`}
                  className="w-full border-0 rounded"
                  style={{ height: "70vh", minHeight: "500px" }}
                  title={`PDF Viewer - ${fileName}`}
                  allow="fullscreen"
                />
              </div>

              {/* Alternative viewing options */}
              <div className="mt-4 p-4 bg-stone-50 rounded-lg border-t border-stone-200">
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-stone-600 text-center">
                    Choose your preferred viewing method:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Direct browser viewer */}
                    <a
                      href={contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-amber-700 hover:text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Browser Viewer
                      </Button>
                    </a>

                    {/* Direct PDF link with viewer params */}
                    <a
                      href={`${contentUrl}#view=FitH&toolbar=1&navpanes=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-amber-700 hover:text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Full Screen
                      </Button>
                    </a>

                    {/* Download option */}
                    <a
                      href={contentUrl}
                      download
                      className="inline-flex items-center justify-center"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-amber-700 hover:text-amber-800 border-amber-300 hover:bg-amber-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "canva_slide":
      if (!contentUrl) {
        return <ErrorFallback url="#" key={contentKey} />;
      }
      return (
        <div key={contentKey}>
          {TitleSection}
          <CanvaEmbed contentUrl={contentUrl} />
        </div>
      );

    case "resource_link":
      if (!contentUrl) {
        return <ErrorFallback url="#" />;
      }

      return (
        <div key={contentKey}>
          {TitleSection}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-200/15 rounded-lg flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-amber-200" />
              </div>
              <div className="flex-1 min-w-0">
                {!contentTitle?.trim() && (
                  <h3 className="font-semibold text-stone-100 mb-2 flex items-center gap-2">
                    📚 Resource Link
                  </h3>
                )}
                {content.content_body && (
                  <p className="text-sm text-stone-300 mb-4 leading-relaxed">
                    {content.content_body}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center"
                  >
                    <Button className="bg-amber-200 text-amber-950 hover:bg-amber-100 shadow-sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Resource
                    </Button>
                  </a>
                  <div className="text-xs text-amber-200/80 font-mono bg-black/30 px-3 py-2 rounded border border-white/10 truncate">
                    {contentUrl}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "webtoon": {
      const { panels } = parseWebtoonBody(content.content_body);
      return (
        <div key={contentKey}>
          {TitleSection}
          <WebtoonReader panels={panels} title={contentTitle} />
        </div>
      );
    }

    case "order_code":
      try {
        const initialBlocks = JSON.parse(content.content_body || "[]");
        return (
          <div key={contentKey}>
            {TitleSection}
            <OrderCodeActivity
              initialBlocks={initialBlocks}
              title={contentTitle}
            />
          </div>
        );
      } catch (e) {
        return (
          <div key={contentKey} className="p-4 border border-red-200 rounded bg-red-50 text-red-600">
            Error loading order code activity: Invalid data format.
          </div>
        );
      }

    default:
      return (
        <div className="aspect-video bg-gradient-to-br from-stone-800/80 to-stone-900/80 rounded-lg flex flex-col items-center justify-center text-center p-6">
          <ImageIcon className="h-12 w-12 text-stone-500 mb-4" />
          <p className="text-stone-300 font-medium">Unsupported content type</p>
          <p className="text-sm text-stone-500 mt-2">
            Content type: {content.content_type}
          </p>
        </div>
      );
  }
};

// renderQuizQuestion could also be moved here if preferred, or kept in AssessmentSection
