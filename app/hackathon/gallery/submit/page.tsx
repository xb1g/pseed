"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, Loader2, Check, ExternalLink, QrCode, Eye } from "lucide-react";
import { ALLOWED_TAGS } from "@/lib/hackathon/gallery";
import { WHO_TAGS, WHAT_TAGS } from "@/lib/hackathon/gallery-match";
import ProductDetail from "@/components/hackathon/gallery/ProductDetail";

type FormState = {
  product_name: string;
  product_name_th: string;
  problem_statement: string;
  problem_statement_th: string;
  solution_description: string;
  solution_description_th: string;
  tags: string[];
  test_mode: "direct" | "contact";
  demo_url: string;
  contact_email: string;
  cover_image_url: string;
  additional_images: string[];
  line_qr_url: string;
  line_id: string;
  target_personas: { who: string[]; what: string[] };
};

const EMPTY_FORM: FormState = {
  product_name: "",
  product_name_th: "",
  problem_statement: "",
  problem_statement_th: "",
  solution_description: "",
  solution_description_th: "",
  tags: [],
  test_mode: "contact",
  demo_url: "",
  contact_email: "",
  cover_image_url: "",
  additional_images: [],
  line_qr_url: "",
  line_id: "",
  target_personas: { who: [], what: [] },
};

export default function GallerySubmitPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existingProduct, setExistingProduct] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [additionalUploading, setAdditionalUploading] = useState(false);
  const [lineQrUploading, setLineQrUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Auth + prefill
  useEffect(() => {
    fetch("/api/hackathon/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.participant) { router.replace("/hackathon/login"); return; }
        setAuthChecked(true);
      })
      .catch(() => router.replace("/hackathon/login"));
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetch("/api/hackathon/gallery/my-product")
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          setExistingProduct(data.product);
          setForm({
            product_name: data.product.product_name ?? "",
            product_name_th: data.product.product_name_th ?? "",
            problem_statement: data.product.problem_statement ?? "",
            problem_statement_th: data.product.problem_statement_th ?? "",
            solution_description: data.product.solution_description ?? "",
            solution_description_th: data.product.solution_description_th ?? "",
            tags: data.product.tags ?? [],
            test_mode: data.product.test_mode ?? "contact",
            demo_url: data.product.demo_url ?? "",
            contact_email: data.product.contact_email ?? "",
            cover_image_url: data.product.cover_image_url ?? "",
            additional_images: data.product.additional_images ?? [],
            line_qr_url: data.product.line_qr_url ?? "",
            line_id: data.product.line_id ?? "",
            target_personas: data.product.target_personas ?? { who: [], what: [] },
          });
        }
      })
      .catch(() => {});
  }, [authChecked]);

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? [] : [tag],
    }));
  };

  const uploadImage = async (file: File, type: "cover" | "additional" | "line_qr") => {
    if (type === "cover") setCoverUploading(true);
    else if (type === "additional") setAdditionalUploading(true);
    else setLineQrUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/hackathon/gallery/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (type === "cover") setForm((p) => ({ ...p, cover_image_url: data.url }));
      else if (type === "additional") setForm((p) => ({ ...p, additional_images: [...p.additional_images, data.url].slice(0, 4) }));
      else setForm((p) => ({ ...p, line_qr_url: data.url }));
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      if (type === "cover") setCoverUploading(false);
      else if (type === "additional") setAdditionalUploading(false);
      else setLineQrUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/hackathon/gallery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          product_name_th: form.product_name_th || null,
          problem_statement_th: form.problem_statement_th || null,
          solution_description_th: form.solution_description_th || null,
          demo_url: form.test_mode === "direct" ? (form.demo_url || null) : null,
          contact_email: form.contact_email || null,
          cover_image_url: form.cover_image_url || null,
          line_qr_url: form.line_qr_url || null,
          line_id: form.line_id || null,
          target_personas: (form.target_personas.who.length > 0 || form.target_personas.what.length > 0)
            ? form.target_personas
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setExistingProduct(data.product);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bloom-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 28, height: 28, color: "#619AD2", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bloom-bg)" }}>

      {/* Hero band */}
      <div ref={heroRef} className="bloom-hero" style={{ paddingBottom: "clamp(2.5rem, 5vw, 3.5rem)" }}>
        <div className="bloom-hero__grain" aria-hidden="true" />

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(1.25rem, 5vw, 3rem)", height: "64px" }}>
          <Link
            href="/hackathon/gallery"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.9375rem",
              fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", transition: "color 160ms",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)")}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to gallery
          </Link>

          {existingProduct?.is_published && (
            <Link
              href={`/hackathon/gallery/${existingProduct.team_id}`}
              target="_blank"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.875rem",
                fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none",
              }}
            >
              <ExternalLink size={13} />
              View live
            </Link>
          )}
        </nav>

        {/* Header */}
        <header style={{ padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1.25rem, 5vw, 3rem) 0", maxWidth: "860px", margin: "0 auto" }}>
          <h1 style={{
            fontFamily: "var(--font-kodchasan), sans-serif",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700,
            lineHeight: 1.1, letterSpacing: "-0.025em", color: "#ffffff",
            margin: "0 0 0.875rem", textWrap: "balance",
            textShadow: "0 2px 16px rgba(20,40,80,0.40)",
          } as React.CSSProperties}>
            {existingProduct ? "Update your product" : "Submit your product"}
          </h1>
          <p style={{
            fontFamily: "var(--font-bai-jamjuree), sans-serif",
            fontSize: "clamp(0.9375rem, 1.8vw, 1.0625rem)",
            color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0,
          } as React.CSSProperties}>
            Share what your team built. Our team will review and publish it to the gallery.
          </p>
        </header>
      </div>

      {/* Main */}
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(2rem, 4vw, 3.5rem) clamp(1.25rem, 5vw, 3rem) 6rem" }}>

        {/* Success state */}
        {success && (
          <div style={{
            marginBottom: "2rem", padding: "1.25rem 1.5rem",
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "16px", display: "flex", alignItems: "flex-start", gap: "0.875rem",
          }}>
            <div style={{ background: "rgba(16,185,129,0.2)", borderRadius: "50%", padding: "0.375rem", flexShrink: 0 }}>
              <Check size={16} style={{ color: "#34d399" }} />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", fontWeight: 700, color: "#34d399", margin: "0 0 0.25rem", fontSize: "0.9375rem" }}>
                {existingProduct?.is_published ? "Published" : "Submitted for review"}
              </p>
              <p style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", color: "rgba(52,211,153,0.75)", fontSize: "0.875rem", margin: 0 }}>
                {existingProduct?.is_published
                  ? "Your product is live on the gallery."
                  : "Our team will notify you once it's approved and live."}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: "2rem", padding: "1rem 1.25rem",
            background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.22)",
            borderRadius: "12px", color: "#FF8888",
            fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.875rem",
          }}>
            {error}
          </div>
        )}

        {/* Match count */}
        {existingProduct?.match_count > 0 && (
          <div style={{
            marginBottom: "2rem", padding: "1rem 1.25rem",
            background: "rgba(97,154,210,0.06)", border: "1px solid rgba(97,154,210,0.18)",
            borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <span style={{ fontSize: "1.5rem" }}>🐋</span>
            <p style={{
              fontFamily: "var(--font-bai-jamjuree), sans-serif",
              fontSize: "0.9375rem", color: "rgba(145,196,227,0.8)", margin: 0,
            }}>
              <strong style={{ color: "#91C4E3" }}>{existingProduct.match_count}</strong>{" "}
              {existingProduct.match_count === 1 ? "person has" : "people have"} been matched to your product by the whale!
            </p>
          </div>
        )}

        {/* Published read-only notice */}
        {existingProduct?.is_published && (
          <div style={{
            marginBottom: "2rem", padding: "1rem 1.25rem",
            background: "rgba(97,154,210,0.07)", border: "1px solid rgba(97,154,210,0.22)",
            borderRadius: "12px", color: "rgba(145,196,227,0.8)",
            fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.875rem",
          }}>
            Your product is published. Updates will go through review again. Contact us if you need major changes.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Product name */}
            <FormField label="Product name" required hint={`${form.product_name.length}/80`}>
              <input
                value={form.product_name}
                onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))}
                maxLength={80}
                required
                placeholder="What did your team build?"
                style={inputStyle}
              />
            </FormField>

            <FormField label="ชื่อผลิตภัณฑ์ (ภาษาไทย)" hint={`${form.product_name_th.length}/80 · optional`}>
              <input
                value={form.product_name_th}
                onChange={(e) => setForm((p) => ({ ...p, product_name_th: e.target.value }))}
                maxLength={80}
                placeholder="ชื่อผลิตภัณฑ์เป็นภาษาไทย"
                style={inputStyle}
              />
            </FormField>

            {/* Problem */}
            <FormField label="Problem statement" required hint={`${form.problem_statement.length}/300`}>
              <textarea
                value={form.problem_statement}
                onChange={(e) => setForm((p) => ({ ...p, problem_statement: e.target.value }))}
                maxLength={300}
                required
                rows={3}
                placeholder="What problem does this solve? (1–2 sentences)"
                style={{ ...inputStyle, resize: "none" }}
              />
            </FormField>

            <FormField label="คำอธิบายปัญหา (ภาษาไทย)" hint={`${form.problem_statement_th.length}/300 · optional`}>
              <textarea
                value={form.problem_statement_th}
                onChange={(e) => setForm((p) => ({ ...p, problem_statement_th: e.target.value }))}
                maxLength={300}
                rows={3}
                placeholder="ปัญหานี้คืออะไร? (1–2 ประโยค)"
                style={{ ...inputStyle, resize: "none" }}
              />
            </FormField>

            {/* Solution */}
            <FormField label="Solution description" required hint={`${form.solution_description.length}/1000`}>
              <textarea
                value={form.solution_description}
                onChange={(e) => setForm((p) => ({ ...p, solution_description: e.target.value }))}
                maxLength={1000}
                required
                rows={6}
                placeholder="How does it work? What makes it effective?"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </FormField>

            <FormField label="รายละเอียดแนวทางแก้ไข (ภาษาไทย)" hint={`${form.solution_description_th.length}/1000 · optional`}>
              <textarea
                value={form.solution_description_th}
                onChange={(e) => setForm((p) => ({ ...p, solution_description_th: e.target.value }))}
                maxLength={1000}
                rows={6}
                placeholder="ทำงานอย่างไร? มีประสิทธิภาพอย่างไร?"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </FormField>

            {/* Tags */}
            <FormField label="Track" required hint="Choose 1">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                {ALLOWED_TAGS.map((tag) => {
                  const active = form.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "9999px",
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-bai-jamjuree), sans-serif",
                        fontWeight: 600,
                        border: `1px solid ${active ? "rgba(97,154,210,0.6)" : "rgba(74,107,130,0.3)"}`,
                        background: active ? "rgba(97,154,210,0.15)" : "transparent",
                        color: active ? "#91C4E3" : "rgba(145,196,227,0.45)",
                        cursor: "pointer",
                        transition: "all 180ms",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* How to test */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                <label style={{
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontSize: "0.8125rem", fontWeight: 700,
                  color: "rgba(145,196,227,0.7)",
                  letterSpacing: "0.03em", textTransform: "uppercase" as const,
                }}>
                  How can people test your product? <span style={{ color: "rgba(97,154,210,0.6)" }}>*</span>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {(["direct", "contact"] as const).map((mode) => {
                  const active = form.test_mode === mode;
                  const label = mode === "direct" ? "Direct access" : "Contact to test";
                  const desc = mode === "direct" ? "Provide a link — anyone can try it immediately" : "Interested people reach out to you first";
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, test_mode: mode }))}
                      style={{
                        padding: "0.875rem 1rem",
                        borderRadius: "12px",
                        border: `1px solid ${active ? "rgba(97,154,210,0.6)" : "rgba(74,107,130,0.3)"}`,
                        background: active ? "rgba(97,154,210,0.12)" : "transparent",
                        cursor: "pointer",
                        textAlign: "left" as const,
                        transition: "all 180ms",
                      }}
                    >
                      <div style={{
                        fontFamily: "var(--font-bai-jamjuree), sans-serif",
                        fontSize: "0.875rem", fontWeight: 700,
                        color: active ? "#91C4E3" : "rgba(145,196,227,0.5)",
                        marginBottom: "0.25rem",
                      }}>{label}</div>
                      <div style={{
                        fontFamily: "var(--font-bai-jamjuree), sans-serif",
                        fontSize: "0.75rem",
                        color: active ? "rgba(145,196,227,0.6)" : "rgba(145,196,227,0.3)",
                        lineHeight: 1.4,
                      }}>{desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Direct: demo URL */}
              {form.test_mode === "direct" && (
                <div style={{ marginTop: "1rem" }}>
                  <FormField label="Demo / App URL" required hint="Where people can try your product">
                    <input
                      value={form.demo_url}
                      onChange={(e) => setForm((p) => ({ ...p, demo_url: e.target.value }))}
                      type="url"
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </FormField>
                </div>
              )}
            </div>

            {/* Cover image */}
            <FormField label="Cover image" hint="Optional — 16:9 recommended">
              {form.cover_image_url ? (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(97,154,210,0.2)" }}>
                  <img src={form.cover_image_url} alt="Cover preview" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, cover_image_url: "" }))}
                    style={removeButtonStyle}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <UploadZone uploading={coverUploading} label="Upload cover image" onFile={(f) => uploadImage(f, "cover")} />
              )}
            </FormField>

            {/* Additional images */}
            {(form.additional_images.length > 0 || true) && (
              <FormField label="Additional screenshots" hint="Optional — up to 4">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
                  {form.additional_images.map((url, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(97,154,210,0.2)" }}>
                      <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, additional_images: p.additional_images.filter((_, j) => j !== i) }))}
                        style={removeButtonStyle}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {form.additional_images.length < 4 && (
                    <UploadZone
                      uploading={additionalUploading}
                      label="Add screenshot"
                      small
                      onFile={(f) => uploadImage(f, "additional")}
                    />
                  )}
                </div>
              </FormField>
            )}

            {/* LINE QR section */}
            <div style={{
              padding: "1.5rem",
              borderRadius: "16px",
              border: "1px solid rgba(0,185,100,0.25)",
              background: "rgba(0,185,100,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                <QrCode size={18} style={{ color: "#4ade80", flexShrink: 0 }} />
                <span style={{
                  fontFamily: "var(--font-bai-jamjuree), sans-serif", fontWeight: 700,
                  fontSize: "0.9375rem", color: "#4ade80",
                }}>
                  LINE QR code
                </span>
                <span style={{
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontSize: "0.75rem", color: "rgba(74,222,128,0.6)",
                  marginLeft: "0.25rem",
                }}>
                  optional
                </span>
              </div>
              <p style={{
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.875rem", color: "rgba(145,196,227,0.6)",
                margin: "0 0 1.25rem", lineHeight: 1.6,
              }}>
                Add contact info so interested visitors can reach your team. At least one contact method is recommended.
              </p>

              {/* Contact email */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontSize: "0.75rem", fontWeight: 700,
                  color: "rgba(74,222,128,0.6)",
                  letterSpacing: "0.05em", textTransform: "uppercase" as const,
                  marginBottom: "0.375rem",
                }}>
                  Email
                </label>
                <input
                  value={form.contact_email}
                  onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                  type="email"
                  placeholder="team@example.com"
                  style={{
                    ...inputStyle,
                    border: "1px solid rgba(74,222,128,0.25)",
                    background: "rgba(0,185,100,0.04)",
                  }}
                />
              </div>

              {/* LINE ID */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontSize: "0.75rem", fontWeight: 700,
                  color: "rgba(74,222,128,0.6)",
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  marginBottom: "0.375rem",
                }}>
                  LINE ID
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{
                    position: "absolute", left: "0.875rem",
                    fontFamily: "var(--font-bai-jamjuree), sans-serif",
                    fontSize: "0.9375rem", color: "rgba(74,222,128,0.5)",
                    pointerEvents: "none", userSelect: "none",
                  }}>@</span>
                  <input
                    value={form.line_id}
                    onChange={(e) => setForm((p) => ({ ...p, line_id: e.target.value.replace(/^@/, "") }))}
                    placeholder="yourlineid"
                    style={{
                      ...inputStyle,
                      paddingLeft: "2rem",
                      border: "1px solid rgba(74,222,128,0.25)",
                      background: "rgba(0,185,100,0.04)",
                    }}
                  />
                </div>
                {form.line_id && (
                  <a
                    href={`https://line.me/ti/p/~${form.line_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      marginTop: "0.375rem",
                      fontFamily: "var(--font-bai-jamjuree), sans-serif",
                      fontSize: "0.75rem", color: "rgba(74,222,128,0.6)",
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={11} /> line.me/ti/p/~{form.line_id}
                  </a>
                )}
              </div>

              {form.line_qr_url ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                      src={form.line_qr_url}
                      alt="LINE QR code"
                      style={{ width: "160px", height: "160px", objectFit: "contain", borderRadius: "12px", border: "1px solid rgba(74,222,128,0.25)", background: "#fff", display: "block", padding: "0.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, line_qr_url: "" }))}
                      style={{ ...removeButtonStyle, background: "rgba(0,0,0,0.75)" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.8125rem", color: "#4ade80", margin: "0 0 0.375rem", fontWeight: 600 }}>
                      QR code uploaded
                    </p>
                    <p style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.8125rem", color: "rgba(145,196,227,0.5)", margin: 0, lineHeight: 1.5 }}>
                      Visitors will see this on your product page to connect with your team on LINE.
                    </p>
                  </div>
                </div>
              ) : (
                <UploadZone
                  uploading={lineQrUploading}
                  label="Upload LINE QR code"
                  hint="Scan from LINE app → Share QR code → Screenshot"
                  onFile={(f) => uploadImage(f, "line_qr")}
                  accent="green"
                />
              )}
            </div>

            {/* Target audience — WHO */}
            <FormField label="Who is your product for?" hint="Pick 1–3">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                {WHO_TAGS.map((tag) => {
                  const active = form.target_personas.who.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => {
                        setForm((p) => {
                          const who = active
                            ? p.target_personas.who.filter((v) => v !== tag.value)
                            : p.target_personas.who.length < 3
                              ? [...p.target_personas.who, tag.value]
                              : p.target_personas.who;
                          return { ...p, target_personas: { ...p.target_personas, who } };
                        });
                      }}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "9999px",
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-bai-jamjuree), sans-serif",
                        fontWeight: 600,
                        border: `1px solid ${active ? "rgba(97,154,210,0.6)" : "rgba(74,107,130,0.3)"}`,
                        background: active ? "rgba(97,154,210,0.15)" : "transparent",
                        color: active ? "#91C4E3" : "rgba(145,196,227,0.45)",
                        cursor: "pointer",
                        transition: "all 180ms",
                      }}
                    >
                      {tag.en}
                      <span style={{ display: "block", fontSize: "0.6875rem", opacity: 0.7 }}>{tag.th}</span>
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Target problem — WHAT */}
            <FormField label="What problem does it solve?" hint="Pick 1–3">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                {WHAT_TAGS.map((tag) => {
                  const active = form.target_personas.what.includes(tag.value);
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => {
                        setForm((p) => {
                          const what = active
                            ? p.target_personas.what.filter((v) => v !== tag.value)
                            : p.target_personas.what.length < 3
                              ? [...p.target_personas.what, tag.value]
                              : p.target_personas.what;
                          return { ...p, target_personas: { ...p.target_personas, what } };
                        });
                      }}
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "9999px",
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-bai-jamjuree), sans-serif",
                        fontWeight: 600,
                        border: `1px solid ${active ? "rgba(97,154,210,0.6)" : "rgba(74,107,130,0.3)"}`,
                        background: active ? "rgba(97,154,210,0.15)" : "transparent",
                        color: active ? "#91C4E3" : "rgba(145,196,227,0.45)",
                        cursor: "pointer",
                        transition: "all 180ms",
                      }}
                    >
                      {tag.en}
                      <span style={{ display: "block", fontSize: "0.6875rem", opacity: 0.7 }}>{tag.th}</span>
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setPreviewing(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.875rem 1.75rem",
                  borderRadius: "12px",
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontWeight: 700, fontSize: "1rem",
                  background: "transparent",
                  border: "1px solid rgba(97,154,210,0.35)",
                  color: "rgba(145,196,227,0.7)",
                  cursor: "pointer",
                  transition: "all 200ms",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "rgba(97,154,210,0.08)";
                  el.style.color = "#91C4E3";
                  el.style.borderColor = "rgba(97,154,210,0.5)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "transparent";
                  el.style.color = "rgba(145,196,227,0.7)";
                  el.style.borderColor = "rgba(97,154,210,0.35)";
                }}
              >
                <Eye size={16} /> Preview
              </button>
              <button
                type="submit"
                disabled={submitting || form.tags.length === 0}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.625rem",
                  padding: "0.875rem 2.25rem",
                  borderRadius: "12px",
                  fontFamily: "var(--font-bai-jamjuree), sans-serif",
                  fontWeight: 700, fontSize: "1rem",
                  background: submitting || form.tags.length === 0
                    ? "rgba(97,154,210,0.2)"
                    : "linear-gradient(135deg, #3a6a9a 0%, #2a5a8a 100%)",
                  border: "1px solid rgba(97,154,210,0.4)",
                  color: submitting || form.tags.length === 0 ? "rgba(145,196,227,0.4)" : "#fff",
                  cursor: submitting || form.tags.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: submitting || form.tags.length === 0 ? "none" : "0 0 24px rgba(97,154,210,0.3), 0 4px 16px rgba(0,0,0,0.3)",
                  transition: "all 200ms",
                }}
              >
                {submitting ? (
                  <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Saving...</>
                ) : existingProduct ? "Update product" : "Submit for review"}
              </button>
            </div>

          </div>
        </form>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(90,122,148,0.6); }
        input:focus, textarea:focus { border-color: rgba(97,154,210,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(97,154,210,0.08); }
      `}</style>

      {/* Preview modal */}
      {previewing && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 400,
            background: "var(--bloom-bg)",
            overflowY: "auto",
          }}
        >
          {/* Close bar */}
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 clamp(1.25rem, 5vw, 3rem)",
            height: "52px",
            background: "rgba(8,12,18,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(97,154,210,0.12)",
          }}>
            <span style={{
              fontFamily: "var(--font-bai-jamjuree), sans-serif",
              fontSize: "0.8125rem", fontWeight: 700,
              color: "rgba(145,196,227,0.5)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Preview — how your page will look
            </span>
            <button
              onClick={() => setPreviewing(false)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.375rem",
                padding: "0.4rem 1rem",
                borderRadius: "8px",
                fontFamily: "var(--font-bai-jamjuree), sans-serif",
                fontSize: "0.8125rem", fontWeight: 700,
                background: "rgba(97,154,210,0.1)",
                border: "1px solid rgba(97,154,210,0.3)",
                color: "#91C4E3",
                cursor: "pointer",
                transition: "all 160ms",
              }}
            >
              <X size={13} /> Close preview
            </button>
          </div>

          <ProductDetail
            product={{
              id: "preview",
              team_id: "preview",
              product_name: form.product_name || "Your product name",
              product_name_th: form.product_name_th || null,
              problem_statement: form.problem_statement || "Your problem statement will appear here.",
              problem_statement_th: form.problem_statement_th || null,
              solution_description: form.solution_description || "Your solution description will appear here.",
              solution_description_th: form.solution_description_th || null,
              cover_image_url: form.cover_image_url || null,
              additional_images: form.additional_images,
              test_mode: form.test_mode,
              demo_url: form.demo_url || null,
              contact_email: form.contact_email || null,
              line_qr_url: form.line_qr_url || null,
              line_id: form.line_id || null,
              tags: form.tags,
              hackathon_year: 2026,
              hackathon_name: "PassionSeed Hackathon",
              interest_count: 0,
              created_at: new Date().toISOString(),
              team: { name: "Your team", members: [] },
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormField({ label, required, hint, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <label style={{
          fontFamily: "var(--font-bai-jamjuree), sans-serif",
          fontSize: "0.8125rem", fontWeight: 700,
          color: "rgba(145,196,227,0.7)",
          letterSpacing: "0.03em",
          textTransform: "uppercase" as const,
        }}>
          {label}{required && <span style={{ color: "rgba(97,154,210,0.6)", marginLeft: "0.25rem" }}>*</span>}
        </label>
        {hint && (
          <span style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.75rem", color: "rgba(90,122,148,0.7)" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function UploadZone({ uploading, label, hint, small, onFile, accent }: {
  uploading: boolean;
  label: string;
  hint?: string;
  small?: boolean;
  onFile: (file: File) => void;
  accent?: "blue" | "green";
}) {
  const color = accent === "green" ? "#4ade80" : "#619AD2";
  return (
    <label style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "0.5rem",
      width: "100%", aspectRatio: small ? "16/9" : undefined,
      minHeight: small ? undefined : "120px",
      borderRadius: "12px",
      border: `2px dashed ${uploading ? color + "60" : "rgba(74,107,130,0.3)"}`,
      cursor: uploading ? "not-allowed" : "pointer",
      transition: "border-color 180ms",
      opacity: uploading ? 0.7 : 1,
    }}
    onMouseEnter={(e) => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = color + "50"; }}
    onMouseLeave={(e) => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,107,130,0.3)"; }}
    >
      {uploading
        ? <Loader2 size={20} style={{ color, animation: "spin 1s linear infinite" }} />
        : <Upload size={20} style={{ color: "rgba(90,122,148,0.7)" }} />
      }
      <span style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.8125rem", color: "rgba(90,122,148,0.8)", fontWeight: 600 }}>
        {uploading ? "Uploading..." : label}
      </span>
      {hint && !uploading && (
        <span style={{ fontFamily: "var(--font-bai-jamjuree), sans-serif", fontSize: "0.75rem", color: "rgba(90,122,148,0.5)", textAlign: "center", padding: "0 1rem" }}>
          {hint}
        </span>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { onFile(f); e.target.value = ""; }
        }}
      />
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "10px",
  padding: "0.75rem 1rem",
  background: "rgba(10,15,22,0.8)",
  border: "1px solid rgba(74,107,130,0.35)",
  color: "#C0D8F0",
  fontFamily: "var(--font-bai-jamjuree), sans-serif",
  fontSize: "0.9375rem",
  lineHeight: 1.5,
  transition: "border-color 180ms",
  boxSizing: "border-box",
};

const removeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "0.5rem",
  right: "0.5rem",
  background: "rgba(0,0,0,0.6)",
  border: "none",
  borderRadius: "50%",
  width: "22px",
  height: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#fff",
  padding: 0,
};
