"use client";

import { useEffect } from "react";

export function TouchSurfaceObserver() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none)");
    if (!mediaQuery.matches) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
        });
      },
      { threshold: 0.18 },
    );

    const surfaces = document.querySelectorAll(
      ".profile-dashboard-surface .ei-card, .profile-dashboard-surface .ei-button-dawn",
    );
    surfaces.forEach((surface) => observer.observe(surface));

    return () => observer.disconnect();
  }, []);

  return null;
}
