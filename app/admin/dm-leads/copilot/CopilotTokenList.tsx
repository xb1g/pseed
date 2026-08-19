"use client";

import { useState, useTransition } from "react";
import { Copy, KeyRound, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CopilotTokenRow } from "@/lib/supabase/dm-copilot-tokens";
import { createCopilotTokenAction, revokeCopilotTokenAction } from "./actions";

interface CopilotTokenListProps {
  initialTokens: CopilotTokenRow[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(token: CopilotTokenRow): { label: string; variant: "default" | "secondary" | "outline" } {
  if (token.revoked_at) return { label: "revoked", variant: "outline" };
  if (Date.parse(token.expires_at) <= Date.now()) return { label: "expired", variant: "outline" };
  return { label: "active", variant: "default" };
}

export function CopilotTokenList({ initialTokens }: CopilotTokenListProps) {
  const [tokens, setTokens] = useState(initialTokens);
  const [name, setName] = useState("");
  const [ttlDays, setTtlDays] = useState(90);
  const [revealed, setRevealed] = useState<{ raw: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const submitCreate = () => {
    setError(null);
    if (!name.trim()) {
      setError("ตั้งชื่อ token ก่อน (e.g. 'boon macbook')");
      return;
    }
    startCreate(async () => {
      try {
        const minted = await createCopilotTokenAction({ name: name.trim(), ttlDays });
        setTokens((current) => [minted.row, ...current]);
        setRevealed({ raw: minted.raw, name: minted.row.name });
        setCopied(false);
        setName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const copyRaw = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed.raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const dismissRevealed = () => {
    setRevealed(null);
    setCopied(false);
  };

  const onRevoke = async (tokenId: string) => {
    setRevokingId(tokenId);
    try {
      await revokeCopilotTokenAction(tokenId);
      setTokens((current) =>
        current.map((t) => (t.id === tokenId ? { ...t, revoked_at: new Date().toISOString() } : t))
      );
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            สร้าง token ใหม่
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr,160px,auto]">
            <Input
              placeholder="boon macbook"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
              maxLength={80}
            />
            <Input
              type="number"
              min={1}
              max={365}
              value={ttlDays}
              onChange={(e) => setTtlDays(Math.max(1, Math.min(365, Number(e.target.value) || 90)))}
              disabled={isCreating}
              aria-label="TTL in days"
            />
            <Button onClick={submitCreate} disabled={isCreating}>
              {isCreating ? "กำลังสร้าง…" : "สร้าง token"}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            token จะหมดอายุตามจำนวนวันที่ตั้ง (ค่าเริ่มต้น 90 วัน) และ revoke ได้ทุกเมื่อ
          </p>
        </CardContent>
      </Card>

      {revealed && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-700 dark:text-amber-400">
              ⚠️ token ใหม่สำหรับ {revealed.name} — เก็บไว้ตอนนี้เลย
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              เราไม่เก็บ raw token ไว้ ปิดการ์ดนี้แล้วจะกู้คืนไม่ได้อีก
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded border bg-background px-3 py-2 font-mono text-xs">
                {revealed.raw}
              </code>
              <Button onClick={copyRaw} variant="outline" className="shrink-0">
                <Copy className="mr-1 h-3 w-3" />
                {copied ? "copied" : "copy"}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissRevealed}>
              ปิด
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tokens ที่มีอยู่</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tokens.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มี token — สร้างอันแรกด้านบน</p>
          )}
          {tokens.map((token) => {
            const status = statusBadge(token);
            return (
              <div
                key={token.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{token.name}</span>
                    <Badge variant={status.variant} className="text-[10px]">
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    สร้าง {formatDate(token.created_at)} · หมดอายุ {formatDate(token.expires_at)} · ใช้ล่าสุด {formatDate(token.last_used_at)}
                  </p>
                </div>
                {!token.revoked_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevoke(token.id)}
                    disabled={revokingId === token.id}
                  >
                    <ShieldOff className="mr-1 h-3 w-3" />
                    {revokingId === token.id ? "กำลัง revoke…" : "revoke"}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
