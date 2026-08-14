"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Map view mode for privileged users (admins, instructors, editors).
 *
 * - `preview`: see the map exactly as a student would (default)
 * - `edit`:   side panel becomes an inline node editor
 * - `grade`:  side panel becomes the grading surface for the selected node
 *
 * The mode lives in a context (not the URL) so switching modes never
 * re-fetches the map or loses the user's pan/zoom/selection state.
 */
export type MapViewMode = "preview" | "edit" | "grade";

interface MapViewModeContextValue {
  mode: MapViewMode;
  setMode: (mode: MapViewMode) => void;
  canEdit: boolean;
  canGrade: boolean;
}

const DEFAULT_VALUE: MapViewModeContextValue = {
  mode: "preview",
  setMode: () => {},
  canEdit: false,
  canGrade: false,
};

const MapViewModeContext =
  createContext<MapViewModeContextValue>(DEFAULT_VALUE);

interface MapViewModeProviderProps {
  canEdit: boolean;
  canGrade: boolean;
  children: ReactNode;
}

export function MapViewModeProvider({
  canEdit,
  canGrade,
  children,
}: MapViewModeProviderProps) {
  const [mode, setModeState] = useState<MapViewMode>("preview");

  // Guard against activating a mode the user has no permission for.
  const setMode = useCallback(
    (next: MapViewMode) => {
      if (next === "edit" && !canEdit) return;
      if (next === "grade" && !canGrade) return;
      setModeState(next);
    },
    [canEdit, canGrade]
  );

  const value = useMemo(
    () => ({ mode, setMode, canEdit, canGrade }),
    [mode, setMode, canEdit, canGrade]
  );

  return (
    <MapViewModeContext.Provider value={value}>
      {children}
    </MapViewModeContext.Provider>
  );
}

/**
 * Safe to call outside a provider (e.g. editor preview, seed rooms):
 * falls back to student preview mode.
 */
export function useMapViewMode(): MapViewModeContextValue {
  return useContext(MapViewModeContext);
}
