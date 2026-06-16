"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "th";

const STORAGE_KEY = "gallery-lang";

function detectDefault(): Lang {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language || "";
  return lang.startsWith("th") ? "th" : "en";
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    setLangState(stored ?? detectDefault());
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Pick localised string, falling back to English if Thai is missing */
export function t(en: string, th: string | null | undefined, lang: Lang): string {
  return lang === "th" && th ? th : en;
}
