"use client";

import { useEffect } from "react";
import { trackGalleryView, trackProductView } from "@/lib/hackathon/gallery-track";

export function GalleryPageTracker() {
  useEffect(() => { trackGalleryView(); }, []);
  return null;
}

export function ProductPageTracker({ productId }: { productId: string }) {
  useEffect(() => { trackProductView(productId); }, [productId]);
  return null;
}
