"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FieldCardTile } from "./FieldCardTile";
import { FieldDetailPanel } from "./FieldDetailPanel";
import {
  FIELDS_HEADING,
  FIELDS_HINT,
  type FieldCard,
} from "@/lib/content/pathlab-page";

/** Matches the stage's height transition in globals.css. */
const HEIGHT_TRANSITION_MS = 620;

interface PathlabFieldsClientProps {
  fields: FieldCard[];
}

/**
 * "สายที่เปิดในตอนนี้" — the paths currently open.
 *
 * Opening a path collapses the grid and expands its detail in place rather
 * than over it, so the section itself grows and pushes the price section
 * down: scrolling on from the closing CTA lands straight on pricing.
 *
 * The stage owns an explicit height while animating so that growth is
 * visible; it is handed back to content once settled, letting the panel
 * reflow freely afterwards.
 */
export function PathlabFieldsClient({ fields }: PathlabFieldsClientProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  /** Height captured before the state change, i.e. the animation's start. */
  const fromHeightRef = useRef<number | null>(null);
  /** The card to restore focus to when a path closes. */
  const lastOpenedRef = useRef<number | null>(null);

  const isOpen = openIndex !== null;

  const open = useCallback((index: number) => {
    const stage = stageRef.current;
    if (stage) fromHeightRef.current = stage.getBoundingClientRect().height;
    lastOpenedRef.current = index;
    setOpenIndex(index);
  }, []);

  const close = useCallback(() => {
    const stage = stageRef.current;
    if (stage) fromHeightRef.current = stage.getBoundingClientRect().height;
    setOpenIndex(null);
  }, []);

  /**
   * Animate between the outgoing and incoming heights. Runs before paint so
   * the start height is committed in the same frame the content swaps,
   * otherwise the browser has nothing to animate from.
   */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const target = isOpen ? detailRef.current : gridRef.current;
    const from = fromHeightRef.current;
    if (!stage || !target) return;

    const to = target.getBoundingClientRect().height;

    // First render: adopt the natural height without animating into it.
    if (from === null) {
      stage.style.height = "";
      return;
    }

    stage.style.height = `${from}px`;
    // Force a reflow so the two heights land in separate style resolutions.
    void stage.offsetHeight;
    stage.style.height = `${to}px`;
    fromHeightRef.current = null;

    // Hand height back to content, so later reflows are not pinned to a
    // stale pixel value.
    const timer = window.setTimeout(() => {
      stage.style.height = "";
    }, HEIGHT_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  /** Move focus with the content: into the panel, then back to its card. */
  useEffect(() => {
    if (isOpen) {
      /* The tapped card sits low on the screen, so an opened panel grows
         upward out of view. Bring the section top (heading + panel start)
         into view; focus stays scroll-free so it cannot fight this. */
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      backRef.current?.focus({ preventScroll: true });
      return;
    }

    const index = lastOpenedRef.current;
    if (index === null) return;
    lastOpenedRef.current = null;

    const card = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-field-index="${index}"] .pathlab-fields__button`
    );
    card?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  const openField = openIndex === null ? null : fields[openIndex];

  return (
    <section
      ref={sectionRef}
      id="pathlab-fields"
      className={`pathlab-fields${isOpen ? " is-open" : ""}`}
      aria-labelledby="pathlab-fields-heading"
    >
      <h2 id="pathlab-fields-heading" className="pathlab-fields__heading">
        {FIELDS_HEADING}
      </h2>
      {/* Fades once a path is open: the instruction no longer applies, but
          its space stays reserved so the panel does not jump. */}
      <p className="pathlab-fields__hint">
        <span className="pathlab-note">{FIELDS_HINT}</span>
      </p>

      <div ref={stageRef} className="pathlab-fields__stage">
        <ul ref={gridRef} className="pathlab-fields__grid">
          {fields.map((field, index) => (
            <li
              key={field.label}
              data-field-index={index}
              className={`pathlab-fields__item${field.ask ? " is-ask" : ""}${
                isOpen && openIndex !== index ? " is-dismissed" : ""
              }`}
            >
              <FieldCardTile
                field={field}
                isOpen={openIndex === index}
                onOpen={field.detail ? () => open(index) : undefined}
              />
              {/* The ask tile authors its own line break, so it is rendered as
                  separate lines rather than relying on where the text wraps. */}
              <div className="pathlab-fields__caption">
                <p className="pathlab-fields__label">
                  {field.ask
                    ? field.label.split("\n").map((line) => (
                        <span key={line} className="pathlab-fields__label-line">
                          {line}
                        </span>
                      ))
                    : field.label}
                </p>
                {field.detail && (
                  <p className="pathlab-fields__project">
                    {field.detail.briefShort}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Not `hidden`: the panel must stay measurable for the height
            animation. CSS takes it out of sight and out of the tab order. */}
        <div ref={detailRef} className="pathlab-detail" aria-hidden={!isOpen}>
          {openField && (
            <FieldDetailPanel
              field={openField}
              onBack={close}
              backRef={backRef}
            />
          )}
        </div>
      </div>
    </section>
  );
}
