function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("gallery-session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("gallery-session", id);
  }
  return id;
}

export function trackGalleryView() {
  fetch("/api/hackathon/gallery/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: "gallery", session_id: getSessionId() }),
  }).catch(() => {});
}

export function trackProductView(productId: string) {
  fetch("/api/hackathon/gallery/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: "product", product_id: productId, session_id: getSessionId() }),
  }).catch(() => {});
}
