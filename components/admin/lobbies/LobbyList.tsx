"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import type { MapLobbyWithCount } from "@/types/lobby";
import { Copy, Check, Users, Plus } from "lucide-react";

interface LobbyListProps {
  mapId: string;
  onSelect: (lobbyId: string) => void;
}

export function LobbyList({ mapId, onSelect }: LobbyListProps) {
  const [lobbies, setLobbies] = useState<MapLobbyWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLobbyName, setNewLobbyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingLobbyId, setTogglingLobbyId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadLobbies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/lobbies?mapId=${encodeURIComponent(mapId)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setLobbies(data.lobbies ?? []);
    } catch (error) {
      console.error("Error loading lobbies:", error);
      toast({
        title: "Failed to load lobbies",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setLobbies([]);
    } finally {
      setLoading(false);
    }
  }, [mapId, toast]);

  useEffect(() => {
    loadLobbies();
  }, [loadLobbies]);

  const handleCreateLobby = async () => {
    const name = newLobbyName.trim();
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter a name for the new lobby.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/admin/lobbies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapId, name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setNewLobbyName("");
      toast({
        title: "Lobby created",
        description: `Join code: ${data.lobby?.join_code ?? "—"}`,
      });
      // Refresh the list so the new lobby appears immediately
      await loadLobbies();
    } catch (error) {
      console.error("Error creating lobby:", error);
      toast({
        title: "Failed to create lobby",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleOpen = async (lobbyId: string, currentIsOpen: boolean) => {
    try {
      setTogglingLobbyId(lobbyId);
      const response = await fetch("/api/admin/lobbies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId, isOpen: !currentIsOpen }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Optimistically update local state
      setLobbies((prev) =>
        prev.map((l) => (l.id === lobbyId ? { ...l, is_open: !currentIsOpen } : l))
      );
    } catch (error) {
      console.error("Error updating lobby:", error);
      toast({
        title: "Failed to update lobby",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTogglingLobbyId(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create new lobby */}
      <div className="flex gap-2">
        <Input
          placeholder="New lobby name..."
          value={newLobbyName}
          onChange={(e) => setNewLobbyName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateLobby();
          }}
          disabled={creating}
          className="flex-1"
        />
        <Button onClick={handleCreateLobby} disabled={creating || !newLobbyName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          {creating ? "Creating..." : "New lobby"}
        </Button>
      </div>

      {/* Lobbies list */}
      {lobbies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No lobbies for this map yet.
        </div>
      ) : (
        <div className="space-y-2">
          {lobbies.map((lobby) => (
            <div
              key={lobby.id}
              className="ei-card p-4 cursor-pointer"
              onClick={() => onSelect(lobby.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(lobby.id);
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{lobby.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Join code with copy button */}
                    <div className="flex items-center gap-1.5">
                      <code className="text-mono text-xs bg-black/30 px-1.5 py-0.5 rounded text-amber-300/80">
                        {lobby.join_code}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(lobby.join_code);
                        }}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        aria-label="Copy join code"
                        title="Copy join code"
                      >
                        {copiedCode === lobby.join_code ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                    {/* Member count */}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Users className="h-3 w-3" />
                      <span>{lobby.member_count}</span>
                    </div>
                  </div>
                </div>

                {/* Open/closed switch */}
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                  role="none"
                >
                  <span className="text-xs text-slate-400">
                    {lobby.is_open ? "Open" : "Closed"}
                  </span>
                  <Switch
                    checked={lobby.is_open}
                    onCheckedChange={() => handleToggleOpen(lobby.id, lobby.is_open)}
                    disabled={togglingLobbyId === lobby.id}
                    aria-label={`Toggle ${lobby.name} open state`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
