"use client";

import { useEffect, useRef, useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { submitGalleryInterest } from "@/lib/hackathon/gallery";

interface InterestDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onClose: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function InterestDialog({ productId, productName, open, onClose }: InterestDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync open state with native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
      // Reset form on open
      setName("");
      setEmail("");
      setMessage("");
      setStatus("idle");
      setErrorMsg("");
    } else {
      dialog.close();
    }
  }, [open]);

  // Close on backdrop click
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const outside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      if (outside) onClose();
    };
    dialog.addEventListener("click", handleClick);
    return () => dialog.removeEventListener("click", handleClick);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");

    const result = await submitGalleryInterest({ productId, name, email, message });
    if (result.error) {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    } else {
      setStatus("success");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      aria-labelledby="interest-dialog-title"
      style={{
        // Reset default dialog styles
        border: "none",
        padding: 0,
        borderRadius: "16px",
        background: "transparent",
        maxWidth: "min(480px, calc(100vw - 2rem))",
        width: "100%",
        // Backdrop
        ["--dialog-bg" as string]: "rgba(0,0,0,0.75)",
      }}
    >
      {/* Backdrop — injected via ::backdrop */}
      <style>{`
        dialog[open]::backdrop {
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(4px);
        }
        @media (prefers-reduced-motion: reduce) {
          dialog[open]::backdrop { backdrop-filter: none; }
        }
      `}</style>

      <div
        style={{
          background: "var(--bloom-bg-surface)",
          border: "1px solid var(--bloom-border-default)",
          borderRadius: "16px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.12)",
          padding: "2rem",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "var(--bloom-border-subtle)",
            border: "1px solid var(--bloom-border-default)",
            borderRadius: "8px",
            color: "var(--bloom-text-muted)",
            width: "2rem",
            height: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 160ms, color 160ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bloom-accent-subtle)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--bloom-accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bloom-border-subtle)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--bloom-text-muted)";
          }}
        >
          <X size={14} />
        </button>

        {status === "success" ? (
          /* Success state */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <CheckCircle size={40} style={{ color: "var(--bloom-ping-color)" }} aria-hidden="true" />
            <div>
              <h2
                id="interest-dialog-title"
                style={{
                  fontFamily: "var(--font-kodchasan), sans-serif",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--bloom-text-primary)",
                  margin: "0 0 0.5rem",
                }}
              >
                Message sent
              </h2>
              <p style={{
                fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                fontSize: "0.9375rem",
                color: "var(--bloom-text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}>
                The team behind <strong style={{ color: "var(--bloom-text-primary)", fontWeight: 600 }}>{productName}</strong> will receive your message. They&apos;ll be in touch.
              </p>
            </div>
            <button className="bloom-button" onClick={onClose} style={{ marginTop: "0.5rem" }}>
              <span className="bloom-button__grain" aria-hidden="true" />
              Close
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} noValidate>
            <h2
              id="interest-dialog-title"
              style={{
                fontFamily: "var(--font-kodchasan), sans-serif",
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--bloom-text-primary)",
                margin: "0 0 0.375rem",
                paddingRight: "2.5rem",
                textWrap: "balance",
              } as React.CSSProperties}
            >
              I want to use this product
            </h2>
            <p style={{
              fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
              fontSize: "0.875rem",
              color: "var(--bloom-text-secondary)",
              margin: "0 0 1.75rem",
              lineHeight: 1.55,
            }}>
              Tell the <strong style={{ color: "var(--bloom-text-primary)", fontWeight: 600 }}>{productName}</strong> team how you&apos;d like to use their product.
            </p>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span style={labelStyle}>Your name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Name"
                  style={inputStyle}
                  onFocus={(e) => applyFocus(e.currentTarget)}
                  onBlur={(e) => removeFocus(e.currentTarget)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={labelStyle}>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={(e) => applyFocus(e.currentTarget)}
                  onBlur={(e) => removeFocus(e.currentTarget)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={labelStyle}>
                  How would you use it?{" "}
                  <span style={{ color: "var(--bloom-text-muted)", fontWeight: 400 }}>(optional)</span>
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Describe your situation or how this product could help you..."
                  style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                  onFocus={(e) => applyFocus(e.currentTarget)}
                  onBlur={(e) => removeFocus(e.currentTarget)}
                />
              </label>
            </div>

            {status === "error" && (
              <p role="alert" style={{
                fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                fontSize: "0.875rem",
                color: "#f87171",
                marginTop: "1rem",
                marginBottom: 0,
              }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="bloom-button"
              disabled={status === "submitting"}
              style={{ marginTop: "1.5rem", width: "100%", opacity: status === "submitting" ? 0.7 : 1 }}
            >
              <span className="bloom-button__grain" aria-hidden="true" />
              {status === "submitting" ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                "Send message to team"
              )}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "var(--bloom-text-secondary)",
  letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  background: "var(--bloom-bg-raised)",
  border: "1px solid var(--bloom-border-default)",
  borderRadius: "8px",
  padding: "0.625rem 0.875rem",
  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
  fontSize: "0.9375rem",
  color: "var(--bloom-text-primary)",
  outline: "none",
  width: "100%",
  transition: "border-color 160ms, box-shadow 160ms",
  lineHeight: 1.5,
};

function applyFocus(el: HTMLElement) {
  el.style.borderColor = "rgba(90, 158, 200, 0.60)";
  el.style.boxShadow = "0 0 0 3px rgba(90, 158, 200, 0.15)";
}

function removeFocus(el: HTMLElement) {
  el.style.borderColor = "var(--bloom-border-default)";
  el.style.boxShadow = "none";
}
