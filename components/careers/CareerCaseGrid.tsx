"use client";

import { useState } from "react";
import { CareerCase } from "@/types/career";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Zap, ArrowLeft, Trophy, Footprints, History } from "lucide-react";

interface CareerCaseGridProps {
  cases: CareerCase[];
  onBack?: () => void;
}

const personaConfig = {
  global_idol: { label: "Global Idol", icon: Globe, color: "bg-amber-50 text-amber-700 border-amber-200" },
  local_legend: { label: "Local Legend", icon: MapPin, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  current_icon: { label: "Current Icon", icon: Zap, color: "bg-blue-50 text-blue-700 border-blue-200" },
};

export function CareerCaseGrid({ cases, onBack }: CareerCaseGridProps) {
  const [selectedCase, setSelectedCase] = useState<CareerCase | null>(null);

  if (selectedCase) {
    const config = personaConfig[selectedCase.persona_type];
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedCase(null)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to personas
        </Button>

        <div className={`p-4 rounded-lg border ${config.color}`}>
          <div className="flex items-center gap-2 mb-2">
            <config.icon className="h-5 w-5" />
            <span className="font-semibold">{config.label}</span>
          </div>
          <h2 className="text-2xl font-bold">{selectedCase.name}</h2>
          <p className="mt-2 text-sm opacity-90">{selectedCase.bio}</p>
        </div>

        {/* History Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Life Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCase.history.map((h, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 text-sm font-medium text-muted-foreground">Age {h.age}</div>
                  <div className="flex-1 pb-4 border-l-2 border-muted pl-4 relative">
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm">{h.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Path Steps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Footprints className="h-5 w-5 text-muted-foreground" />
              How to Walk This Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCase.path_steps.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              Key Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedCase.achievements.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {onBack && (
          <Button onClick={onBack} className="w-full">
            Explore Another Path
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to paths
        </Button>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {cases.map((c) => {
          const config = personaConfig[c.persona_type];
          return (
            <Card
              key={c.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${config.color}`}
              onClick={() => setSelectedCase(c)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <config.icon className="h-5 w-5" />
                  <Badge variant="outline" className="text-xs">{config.label}</Badge>
                </div>
                <CardTitle className="text-lg">{c.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{c.bio}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {c.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
