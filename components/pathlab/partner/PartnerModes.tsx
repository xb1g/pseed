"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { NOTES } from "@/lib/content/pathlab-page";
import {
  PARTNER_MODES,
  partnerInterviewHref,
} from "@/lib/content/pathlab-partner";
import type { ContributionMode } from "@/types/expert-interview";

/**
 * "คุณมีอะไรอยากแบ่งปัน?" — the contribution-mode selector. This is an
 * interaction, not a card grid: picking a mode swaps one focused panel that
 * answers the five things an expert needs to know (what to bring, effort,
 * what we build, what they get back, the next action), and the panel CTA
 * deep-links into the interview with that mode attached.
 */
export function PartnerModes() {
  const [selected, setSelected] = useState<ContributionMode>(
    PARTNER_MODES.modes[0].id
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = PARTNER_MODES.modes.findIndex((m) => m.id === selected);
  const active = PARTNER_MODES.modes[activeIndex] ?? PARTNER_MODES.modes[0];

  const select = (mode: ContributionMode) => setSelected(mode);

  /** WAI-ARIA tabs: arrows move focus and selection together. */
  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const count = PARTNER_MODES.modes.length;
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % count;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (index - 1 + count) % count;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = count - 1;
    }
    if (next >= 0) {
      event.preventDefault();
      setSelected(PARTNER_MODES.modes[next].id);
      tabRefs.current[next]?.focus();
    }
  };

  const rows = [
    { label: PARTNER_MODES.rows.bring, body: active.bring },
    { label: PARTNER_MODES.rows.effort, body: active.effort },
    { label: PARTNER_MODES.rows.create, body: active.create },
    { label: PARTNER_MODES.rows.receive, body: active.receive },
  ];

  return (
    <section
      id="partner-modes"
      className="pathlab-partner__section"
      aria-labelledby="partner-modes-heading"
    >
      <p className="pathlab-partner__kicker">{PARTNER_MODES.kicker}</p>
      <h2 id="partner-modes-heading" className="pathlab-partner__heading">
        {PARTNER_MODES.heading}
      </h2>

      <div
        className="pathlab-partner__mode-tabs"
        role="tablist"
        aria-label={PARTNER_MODES.tablistLabel}
      >
        {PARTNER_MODES.modes.map((mode, index) => (
          <button
            key={mode.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`partner-mode-tab-${mode.id}`}
            aria-selected={mode.id === selected}
            aria-controls={`partner-mode-panel-${mode.id}`}
            tabIndex={mode.id === selected ? 0 : -1}
            className="pathlab-partner__mode-tab"
            onClick={() => select(mode.id)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div
        key={active.id}
        role="tabpanel"
        id={`partner-mode-panel-${active.id}`}
        aria-labelledby={`partner-mode-tab-${active.id}`}
        className="pathlab-partner__mode-panel"
      >
        <dl className="pathlab-partner__mode-rows">
          {rows.map((row) => (
            <div key={row.label} className="pathlab-partner__mode-row">
              <dt className="pathlab-partner__mode-row-label">{row.label}</dt>
              <dd className="pathlab-partner__mode-row-body">{row.body}</dd>
            </div>
          ))}
        </dl>

        <div className="pathlab-partner__mode-cta">
          <a
            className="pathlab-hero__cta pathlab-hero__cta--primary"
            href={partnerInterviewHref(active.id)}
          >
            <span>{active.ctaLabel}</span>
            <ArrowRight
              className="pathlab-partner__cta-icon"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>

      <p className="pathlab-note-row">
        <span className="pathlab-note pathlab-note--tilt-l-sm">
          {NOTES.partnerModes}
        </span>
      </p>
    </section>
  );
}
