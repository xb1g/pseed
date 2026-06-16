"use client";

import { useEffect, useRef, useState } from "react";
import { X, CheckCircle, Loader2, ExternalLink, Mail } from "lucide-react";
import { submitGalleryInterest } from "@/lib/hackathon/gallery";

interface InterestDialogProps {
  productId: string;
  productName: string;
  testMode: "direct" | "contact";
  demoUrl: string | null;
  contactEmail: string | null;
  lineId: string | null;
  lineQrUrl: string | null;
  open: boolean;
  onClose: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function InterestDialog({
  productId, productName, testMode, demoUrl, contactEmail, lineId, lineQrUrl,
  open, onClose,
}: InterestDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
      setName(""); setEmail(""); setMessage("");
      setStatus("idle"); setErrorMsg("");
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose();
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
    if (result.error) { setStatus("error"); setErrorMsg("Something went wrong. Please try again."); }
    else setStatus("success");
  }

  const hasContact = lineId || lineQrUrl || contactEmail;

  // Contact panel shown after success (direct) or always (contact mode)
  const ContactPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Demo link — direct mode */}
      {testMode === "direct" && demoUrl && (
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.875rem 1.25rem",
            borderRadius: "12px",
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: "0.9375rem", fontWeight: 700,
            background: "linear-gradient(135deg, #3a6a9a 0%, #2a5a8a 100%)",
            border: "1px solid rgba(97,154,210,0.4)",
            color: "#fff",
            textDecoration: "none",
            boxShadow: "0 0 20px rgba(97,154,210,0.25)",
          }}
        >
          <ExternalLink size={15} aria-hidden="true" />
          Open product
        </a>
      )}

      {/* Contact methods */}
      {hasContact && (
        <div style={{
          padding: "1.125rem",
          borderRadius: "12px",
          border: "1px solid rgba(74,222,128,0.2)",
          background: "rgba(74,222,128,0.04)",
          display: "flex", flexDirection: "column", gap: "0.875rem",
        }}>
          <p style={{
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: "0.75rem", fontWeight: 700,
            color: "rgba(74,222,128,0.6)",
            letterSpacing: "0.06em", textTransform: "uppercase",
            margin: 0,
          }}>
            Contact the team
          </p>

          {/* Email */}
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.9rem", fontWeight: 600,
                color: "#4ade80", textDecoration: "none",
              }}
            >
              <Mail size={14} aria-hidden="true" />
              {contactEmail}
            </a>
          )}

          {/* LINE ID */}
          {lineId && (
            <a
              href={`https://line.me/ti/p/~${lineId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.9rem", fontWeight: 600,
                color: "#4ade80", textDecoration: "none",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.03 2 11c0 3.12 1.72 5.86 4.35 7.55L5.5 22l3.62-1.9C10.17 20.67 11.07 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z"/>
              </svg>
              Add on LINE: @{lineId}
            </a>
          )}

          {/* LINE QR */}
          {lineQrUrl && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <img
                src={lineQrUrl}
                alt="LINE QR code"
                style={{
                  width: "120px", height: "120px",
                  objectFit: "contain", borderRadius: "10px",
                  border: "1px solid rgba(74,222,128,0.2)",
                  background: "#fff", padding: "0.375rem", display: "block",
                }}
              />
              <span style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.75rem", color: "rgba(74,222,128,0.5)",
              }}>
                Scan to add on LINE
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      aria-labelledby="interest-dialog-title"
      style={{
        border: "none", padding: 0, borderRadius: "16px",
        background: "transparent",
        maxWidth: "min(480px, calc(100vw - 2rem))", width: "100%",
      }}
    >
      <style>{`
        dialog[open]::backdrop { background: rgba(0,0,0,0.72); backdrop-filter: blur(4px); }
        @media (prefers-reduced-motion: reduce) { dialog[open]::backdrop { backdrop-filter: none; } }
      `}</style>

      <div style={{
        background: "var(--bloom-bg-surface)",
        border: "1px solid var(--bloom-border-default)",
        borderRadius: "16px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.12)",
        padding: "2rem",
        position: "relative",
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: "var(--bloom-border-subtle)", border: "1px solid var(--bloom-border-default)",
            borderRadius: "8px", color: "var(--bloom-text-muted)",
            width: "2rem", height: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "background 160ms, color 160ms",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "var(--bloom-accent-subtle)"; el.style.color = "var(--bloom-accent)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "var(--bloom-border-subtle)"; el.style.color = "var(--bloom-text-muted)"; }}
        >
          <X size={14} />
        </button>

        {/* ── CONTACT MODE: show contact info directly, no form ── */}
        {testMode === "contact" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <h2 id="interest-dialog-title" style={titleStyle}>Contact the team</h2>
              <p style={subtitleStyle}>
                Reach out to the <strong style={{ color: "var(--bloom-text-primary)", fontWeight: 600 }}>{productName}</strong> team to get access and test their product.
              </p>
            </div>
            <ContactPanel />
            <button className="bloom-button bloom-button--ghost" onClick={onClose} style={{ width: "100%", fontSize: "0.875rem" }}>
              Close
            </button>
          </div>

        /* ── DIRECT MODE: form first, then show link + contact on success ── */
        ) : status === "success" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CheckCircle size={24} style={{ color: "var(--bloom-ping-color)", flexShrink: 0 }} aria-hidden="true" />
              <div>
                <h2 id="interest-dialog-title" style={{ ...titleStyle, margin: 0 }}>You&apos;re in!</h2>
                <p style={{ ...subtitleStyle, margin: 0 }}>Message sent to the team.</p>
              </div>
            </div>
            <ContactPanel />
            <button className="bloom-button" onClick={onClose} style={{ width: "100%", fontSize: "0.875rem" }}>
              <span className="bloom-button__grain" aria-hidden="true" />
              Done
            </button>
          </div>

        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 id="interest-dialog-title" style={titleStyle}>Try this product</h2>
            <p style={subtitleStyle}>
              Leave your details so the <strong style={{ color: "var(--bloom-text-primary)", fontWeight: 600 }}>{productName}</strong> team knows who&apos;s trying their product.
            </p>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span style={labelStyle}>Your name</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Name" style={inputStyle} onFocus={(e) => applyFocus(e.currentTarget)} onBlur={(e) => removeFocus(e.currentTarget)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span style={labelStyle}>Email address</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" style={inputStyle} onFocus={(e) => applyFocus(e.currentTarget)} onBlur={(e) => removeFocus(e.currentTarget)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span style={labelStyle}>How would you use it? <span style={{ color: "var(--bloom-text-muted)", fontWeight: 400 }}>(optional)</span></span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Describe your situation..." style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} onFocus={(e) => applyFocus(e.currentTarget)} onBlur={(e) => removeFocus(e.currentTarget)} />
              </label>
            </div>

            {status === "error" && (
              <p role="alert" style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.875rem", color: "#f87171", marginTop: "1rem", marginBottom: 0 }}>
                {errorMsg}
              </p>
            )}

            <button type="submit" className="bloom-button" disabled={status === "submitting"} style={{ marginTop: "1.5rem", width: "100%", opacity: status === "submitting" ? 0.7 : 1 }}>
              <span className="bloom-button__grain" aria-hidden="true" />
              {status === "submitting" ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Sending...</> : "Send & get access link"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-kodchasan), sans-serif",
  fontSize: "1.375rem", fontWeight: 700,
  color: "var(--bloom-text-primary)",
  margin: "0 0 0.375rem", paddingRight: "2.5rem",
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
  fontSize: "0.875rem", color: "var(--bloom-text-secondary)",
  margin: "0 0 1.5rem", lineHeight: 1.55,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
  fontSize: "0.8125rem", fontWeight: 600,
  color: "var(--bloom-text-secondary)", letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  background: "var(--bloom-bg-raised)",
  border: "1px solid var(--bloom-border-default)",
  borderRadius: "8px", padding: "0.625rem 0.875rem",
  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
  fontSize: "0.9375rem", color: "var(--bloom-text-primary)",
  outline: "none", width: "100%",
  transition: "border-color 160ms, box-shadow 160ms", lineHeight: 1.5,
};

function applyFocus(el: HTMLElement) {
  el.style.borderColor = "rgba(90,158,200,0.60)";
  el.style.boxShadow = "0 0 0 3px rgba(90,158,200,0.15)";
}
function removeFocus(el: HTMLElement) {
  el.style.borderColor = "var(--bloom-border-default)";
  el.style.boxShadow = "none";
}
