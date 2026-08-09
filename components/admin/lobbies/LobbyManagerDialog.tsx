"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LobbyList } from "./LobbyList";
import { LobbyRoster } from "./LobbyRoster";

interface LobbyManagerDialogProps {
  mapId: string;
  mapTitle: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function LobbyManagerDialog({
  mapId,
  mapTitle,
  open,
  onOpenChange,
}: LobbyManagerDialogProps) {
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null);

  const handleClose = (o: boolean) => {
    if (!o) {
      // Reset to list view when dialog closes
      setSelectedLobbyId(null);
    }
    onOpenChange(o);
  };

  const handleSelectLobby = (lobbyId: string) => {
    setSelectedLobbyId(lobbyId);
  };

  const handleBack = () => {
    setSelectedLobbyId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedLobbyId ? "Lobby Roster" : "Manage Lobbies"}
          </DialogTitle>
          <DialogDescription>
            {mapTitle}
          </DialogDescription>
        </DialogHeader>

        {selectedLobbyId ? (
          <LobbyRoster lobbyId={selectedLobbyId} onBack={handleBack} />
        ) : (
          <LobbyList mapId={mapId} onSelect={handleSelectLobby} />
        )}
      </DialogContent>
    </Dialog>
  );
}
