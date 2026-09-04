"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CircleDot, FlaskConical, Pencil, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import {
  PMF_DECISION_RULE,
  PMF_SIGNALS,
  PRODUCT_LOOP,
  PRODUCT_WORK_ITEMS,
  workItemToProductBet,
  type ProductBetStatus,
} from "@/lib/work/product-development";
import type { WorkItem } from "@/lib/work/work-items";

import { WorkItemEditor } from "./WorkItemEditor";
import { WorkPersistenceNotice } from "./WorkPersistenceNotice";
import { useWorkItems } from "./useWorkItems";
import styles from "./work.module.css";

const statusLabel: Record<ProductBetStatus, string> = {
  decide: "Decision needed",
  validate: "Validating",
  build: "Building",
  learn: "Learning",
  done: "Done",
};
const statusClass: Record<ProductBetStatus, string> = {
  decide: "border-amber-300/25 bg-amber-300/[0.07] text-amber-200",
  validate: "border-violet-300/20 bg-violet-300/[0.06] text-violet-200",
  build: "border-sky-300/20 bg-sky-300/[0.06] text-sky-200",
  learn: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200",
  done: "border-white/10 bg-white/[0.04] text-stone-300",
};
const evidenceSources = [
  { source: "Instagram", signal: "Portfolio judgment creates stronger demand than abstract future-planning content.", implication: "Lead with a concrete portfolio consequence, then reveal the method." },
  { source: "DM conversations", signal: "The repeated pain is: อยากทำ แต่ไม่รู้จะเริ่มจากไหน", implication: "Give one useful first step before sending a product link." },
  { source: "Sales conversations", signal: "Students reach purchase intent but stall at the parent handoff.", implication: "The parent packet is part of the product experience, not only marketing collateral." },
  { source: "TechSeed alumni", signal: "Longer participation creates bonds, confidence, and self-directed follow-through.", implication: "Measure what students continue after the cohort, not just completion." },
] as const;

export function ProductWorkspace() {
  const workspace = useWorkItems("product", PRODUCT_WORK_ITEMS);
  const bets = useMemo(() => workspace.items.map(workItemToProductBet), [workspace.items]);
  const [selectedId, setSelectedId] = useState(PRODUCT_WORK_ITEMS[0].id);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const selected = bets.find((bet) => bet.id === selectedId) ?? bets[0];
  const selectedItem = workspace.items.find((item) => item.id === selected?.id) ?? null;
  const selectedEditorItem = selectedItem && selected
    ? {
        ...selectedItem,
        details: {
          ...selectedItem.details,
          segment: selected.segment,
          hypothesis: selected.hypothesis,
          passBar: selected.passBar,
          result: selected.result,
          nextMove: selected.nextMove,
          decision: selected.decision,
        },
      }
    : null;
  const canEdit = workspace.state === "connected";

  function openEditor(item: WorkItem | null) {
    setActionError(null);
    setEditingItem(item);
    setEditorOpen(true);
  }

  async function changeStatus(id: string, status: ProductBetStatus) {
    setActionError(null);
    try {
      await workspace.update({ id, status });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not update the status.");
    }
  }

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.eyebrow}>Work / Validation and PMF</p>
        <div className="mt-3 grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h1 className="font-kodchasan text-3xl font-semibold tracking-tight text-white sm:text-4xl">Evidence → test → decision</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-400 sm:text-base">Disprove the riskiest belief cheaply, then track whether paid demand and delivered value repeat.</p>
          </div>
          <button type="button" onClick={() => openEditor(null)} disabled={!canEdit} className={styles.primaryButton} title={!canEdit ? workspace.message : undefined}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Add product bet</button>
        </div>
        <div className={styles.rule} />
      </header>

      <div className="mt-5"><WorkPersistenceNotice state={workspace.state} message={workspace.message} onRetry={workspace.reload} /></div>
      {actionError && <p className={styles.editorError} role="alert">{actionError} Your previous value was restored.</p>}

      <section className="mt-8">
        <p className={styles.eyebrow}>Product loop</p>
        <ol className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-5">
          {PRODUCT_LOOP.map((step, index) => (
            <li key={step.label} className="relative bg-[#0d0a10]/95 p-4">
              <div className="flex items-center justify-between"><span className="font-space-mono text-[10px] text-orange-300/55">0{index + 1}</span>{index < PRODUCT_LOOP.length - 1 && <ArrowRight className="hidden h-3.5 w-3.5 translate-x-[1.15rem] text-white/20 sm:block" aria-hidden="true" />}</div>
              <h2 className="mt-5 text-sm font-semibold text-white">{step.label}</h2><p className="mt-2 text-[11px] leading-5 text-stone-500">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.section} mt-12`}>
        <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
          <div>
            <div className="flex items-end justify-between gap-4"><div><p className={styles.eyebrow}>Active bets</p><h2 className="mt-2 font-kodchasan text-xl font-semibold text-white">Choose the decision, not the feature</h2></div><p className="text-xs text-stone-500">{bets.length} active</p></div>
            <div className="mt-5 divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {bets.map((bet) => {
                const active = selected?.id === bet.id;
                return (
                  <button key={bet.id} type="button" aria-pressed={active} onClick={() => setSelectedId(bet.id)} className={`${styles.contentRow} grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-4 px-2 py-4 text-left ${active ? "bg-white/[0.025]" : ""}`}>
                    <div className="min-w-0"><p className="break-words text-sm font-semibold leading-6 text-white">{bet.title}</p><p className="mt-1 text-[10px] text-stone-500">{bet.owner}{bet.dueOn ? ` · due ${bet.dueOn}` : " · no due date"}</p></div>
                    <span className={`rounded-full border px-2 py-1 font-space-mono text-[9px] uppercase tracking-wider ${statusClass[bet.status]}`}>{statusLabel[bet.status]}</span>
                  </button>
                );
              })}
              {bets.length === 0 && <div className="py-10 text-center text-sm text-stone-400">No active bets. Add one when evidence needs a decision.</div>}
            </div>
          </div>

          {selected && (
            <AnimatePresence mode="wait">
              <motion.article key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className={`${styles.decisionSurface} p-5 sm:p-7`}>
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3"><p className={styles.eyebrow}>Selected bet</p><button type="button" onClick={() => openEditor(selectedEditorItem)} disabled={!canEdit || !selectedEditorItem} className={styles.editButton}><Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Edit bet</button></div>
                  <h3 className="mt-5 break-words font-kodchasan text-2xl font-semibold leading-snug text-white">{selected.title}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <p className="text-xs text-stone-500">Owner: {selected.owner}{selected.dueOn ? ` · due ${selected.dueOn}` : " · due date not set"}</p>
                    <select aria-label={`Status for ${selected.title}`} value={selected.status} disabled={!canEdit || workspace.savingId === selected.id} onChange={(event) => void changeStatus(selected.id, event.target.value as ProductBetStatus)} className={`${styles.statusSelect} ${statusClass[selected.status]}`}>
                      {(["decide", "validate", "build", "learn", "done"] as const).map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
                    </select>
                  </div>
                  <dl className="mt-7 divide-y divide-white/[0.07] border-y border-white/[0.07]">
                    <Detail label="Segment">{selected.segment}</Detail>
                    <Detail label="Evidence">{selected.evidence}</Detail>
                    <Detail label="Hypothesis">{selected.hypothesis}</Detail>
                    <Detail label="Pass bar">{selected.passBar}</Detail>
                    <Detail label="Next test">{selected.nextMove}</Detail>
                    <Detail label="Result">{selected.result}</Detail>
                    <Detail label="Unlocks">{selected.decision}</Detail>
                  </dl>
                </div>
              </motion.article>
            </AnimatePresence>
          )}
        </div>
      </section>

      <section id="pmf" className={`${styles.section} mt-12 scroll-mt-24`}>
        <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className={styles.eyebrow}>PMF proof</p>
            <h2 className="mt-2 font-kodchasan text-xl font-semibold text-white">Three signals, three cohorts</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-stone-400">{PMF_DECISION_RULE}</p>
          </div>
          <ol className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {PMF_SIGNALS.map((signal, index) => (
              <li key={signal.label} className="grid gap-3 py-5 sm:grid-cols-[2rem_9rem_1fr] sm:items-start">
                <span className="font-space-mono text-[10px] text-orange-300/55">0{index + 1}</span>
                <h3 className="text-sm font-semibold text-white">{signal.label}</h3>
                <div>
                  <p className="text-sm leading-6 text-stone-300">{signal.question}</p>
                  <p className="mt-1.5 text-xs leading-5 text-stone-500">Measure: {signal.measure}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.section} mt-12`}>
        <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
          <div><p className={styles.eyebrow}>Evidence inbox</p><h2 className="mt-2 font-kodchasan text-xl font-semibold text-white">What the field is saying now</h2><p className="mt-3 max-w-md text-sm leading-6 text-stone-400">Marketing signals, student behavior, and program delivery feed the same product truth.</p></div>
          <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">{evidenceSources.map((item) => <article key={item.source} className="grid gap-3 py-4 sm:grid-cols-[8rem_1fr]"><p className="font-space-mono text-[10px] uppercase tracking-[0.13em] text-orange-300/55">{item.source}</p><div><p className="text-sm leading-6 text-stone-200">{item.signal}</p><p className="mt-1.5 text-xs leading-5 text-stone-500">So: {item.implication}</p></div></article>)}</div>
        </div>
      </section>

      <section className={`${styles.section} mt-12`}>
        <div className="grid gap-8 lg:grid-cols-2">
          <Checklist icon={AlertTriangle} eyebrow="Release gates" title="Before BOFU traffic" color="text-amber-200" items={["Confirm TechSeed and SHIFT prices and their place in the ladder.", "Replace private 1:1 Discord language with visible-channel personal feedback.", "Make dates, workload, seats, and deliverables identical across every surface.", "Route the Instagram bio to the current offer chooser."]} />
          <Checklist icon={ShieldCheck} eyebrow="Definition of done" title="A release is done when learning closes" color="text-emerald-200" items={["A named student segment reaches the release.", "The expected behavior and metric were written before launch.", "Safety and data boundaries are explicit.", "Evidence is reviewed and the next decision is recorded."]} />
        </div>
      </section>

      <footer className="mt-12 border-t border-white/[0.07] pt-6 text-xs leading-5 text-stone-600"><div className="flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />No item enters Build without a segment, hypothesis, pass bar, and decision.</div></footer>
      <WorkItemEditor area="product" item={editingItem} open={editorOpen} disabled={!canEdit} saving={workspace.savingId !== null} onOpenChange={setEditorOpen} onCreate={workspace.create} onUpdate={workspace.update} />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2 py-4 sm:grid-cols-[7rem_1fr]"><dt className="font-space-mono text-[9px] uppercase tracking-[0.14em] text-white/30">{label}</dt><dd className="break-words text-sm leading-6 text-stone-300">{children}</dd></div>;
}

function Checklist({ icon: Icon, eyebrow, title, color, items }: { icon: typeof AlertTriangle; eyebrow: string; title: string; color: string; items: string[] }) {
  return <div><div className={`flex items-center gap-2 ${color}`}><Icon className="h-4 w-4" aria-hidden="true" /><p className={styles.eyebrow}>{eyebrow}</p></div><h2 className="mt-3 font-kodchasan text-xl font-semibold text-white">{title}</h2><ul className="mt-5 space-y-3 text-sm leading-6 text-stone-300">{items.map((item) => <li key={item} className="flex gap-3"><CircleDot className="mt-1.5 h-3.5 w-3.5 shrink-0 text-orange-300/65" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>;
}
