"use client";

import { AlertCircle, CheckCircle2, Database, LoaderCircle, RefreshCw } from "lucide-react";

import type { WorkPersistenceState } from "@/lib/work/work-items";

import styles from "./work.module.css";

export function WorkPersistenceNotice({
  state,
  message,
  onRetry,
}: {
  state: WorkPersistenceState;
  message: string;
  onRetry: () => void;
}) {
  const Icon = state === "connected"
    ? CheckCircle2
    : state === "loading"
      ? LoaderCircle
      : state === "setup-required"
        ? Database
        : AlertCircle;
  const needsSignIn = message.startsWith("Your session expired");

  return (
    <div className={`${styles.persistenceNotice} ${styles[`persistence_${state.replace("-", "_")}`]}`} role="status">
      <Icon className={`h-4 w-4 shrink-0 ${state === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{message}</span>
      {needsSignIn ? (
        <a href="/login" className={styles.retryButton}>Sign in</a>
      ) : (state === "error" || state === "setup-required") && (
        <button type="button" onClick={onRetry} className={styles.retryButton}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
