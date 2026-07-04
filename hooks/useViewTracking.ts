"use client";

import { useCallback, useEffect, useRef } from "react";
import { ViewType, TestEventType, TestEventPayload } from "@/types/career";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("career_view_session_id");
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("career_view_session_id", sid);
  }
  return sid;
}

export function useViewTracking(viewType: ViewType) {
  const sessionId = getSessionId();
  const startTime = useRef(Date.now());
  const maxScroll = useRef(0);

  const track = useCallback(
    async (eventType: TestEventType, payload?: TestEventPayload) => {
      try {
        await fetch("/api/careers/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            view_type: viewType,
            event_type: eventType,
            payload: payload || {},
          }),
        });
      } catch {
        // Silently fail tracking
      }
    },
    [sessionId, viewType]
  );

  // Track page load
  useEffect(() => {
    track("view_loaded", { url: window.location.href, timestamp: Date.now() });
    startTime.current = Date.now();

    // Track time on page
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime.current) / 1000);
      if (seconds % 10 === 0) {
        track("time_on_page", { seconds });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [track]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      if (depth > maxScroll.current) {
        maxScroll.current = depth;
        if (depth % 25 === 0) {
          track("scroll_depth", { depth });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [track]);

  return { track, sessionId };
}
