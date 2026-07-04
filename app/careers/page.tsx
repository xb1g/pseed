"use client";

import { useState, useEffect } from "react";
import { CareerPath } from "@/types/career";
import { CareerListView } from "@/components/careers/CareerListView";
import { CareerRpgView } from "@/components/careers/CareerRpgView";
import { Button } from "@/components/ui/button";
import { List, Gamepad2 } from "lucide-react";

export default function CareersPage() {
  const [view, setView] = useState<"list" | "rpg">("list");
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/careers/paths")
      .then((res) => res.json())
      .then((data) => {
        setPaths(data.paths || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Career Paths</h1>
        <p className="text-muted-foreground">
          Explore real paths with real examples. Find where you fit.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={view === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("list")}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" />
          List View
        </Button>
        <Button
          variant={view === "rpg" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("rpg")}
          className="flex items-center gap-2"
        >
          <Gamepad2 className="h-4 w-4" />
          RPG View
        </Button>
      </div>

      {/* View Content */}
      {view === "list" ? (
        <CareerListView paths={paths} />
      ) : (
        <CareerRpgView paths={paths} />
      )}
    </div>
  );
}
