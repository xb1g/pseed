import type { ReactNode } from "react";
import { LangProvider } from "@/lib/hackathon/gallery-lang";

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return <LangProvider>{children}</LangProvider>;
}
