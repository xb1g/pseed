"use client";

import { useState, useMemo } from "react";
import { CareerPath, CareerClass } from "@/types/career";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useViewTracking } from "@/hooks/useViewTracking";
import { Clock, ArrowRight, ChevronRight, Swords, Sparkles, Shield, Star } from "lucide-react";

interface CareerRpgViewProps {
  paths: CareerPath[];
}

const classIcons: Record<string, React.ReactNode> = {
  Founder: <Swords className="h-5 w-5" />,
  Creator: <Sparkles className="h-5 w-5" />,
  Operator: <Shield className="h-5 w-5" />,
};

const classColors: Record<string, string> = {
  Founder: "border-l-amber-500 bg-amber-50/50",
  Creator: "border-l-purple-500 bg-purple-50/50",
  Operator: "border-l-blue-500 bg-blue-50/50",
};

const subclassColors: Record<string, string> = {
  Founder: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  Creator: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  Operator: "bg-blue-100 text-blue-800 hover:bg-blue-200",
};

export function CareerRpgView({ paths }: CareerRpgViewProps) {
  const { track } = useViewTracking("rpg");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);

  // Build class hierarchy
  const classes: CareerClass[] = useMemo(() => {
    const classMap = new Map<string, CareerClass>();

    paths.forEach((path) => {
      if (!classMap.has(path.class)) {
        classMap.set(path.class, {
          name: path.class,
          description: getClassDescription(path.class),
          subclasses: [],
        });
      }

      const cls = classMap.get(path.class)!;
      let subclass = cls.subclasses.find((s) => s.name === path.subclass);
      if (!subclass) {
        subclass = {
          name: path.subclass,
          description: getSubclassDescription(path.subclass),
          paths: [],
        };
        cls.subclasses.push(subclass);
      }
      subclass.paths.push(path);
    });

    return Array.from(classMap.values());
  }, [paths]);

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setSelectedSubclass(null);
    track("class_selected", { class: className });
  };

  const handleSubclassSelect = (subclassName: string) => {
    setSelectedSubclass(subclassName);
    track("subclass_selected", { subclass: subclassName });
  };

  const handlePathClick = (path: CareerPath) => {
    track("path_clicked", { path_id: path.id, path_title: path.title });
  };

  // Get paths to show based on selection
  const visiblePaths = useMemo(() => {
    if (selectedSubclass) {
      return paths.filter((p) => p.subclass === selectedSubclass);
    }
    if (selectedClass) {
      return paths.filter((p) => p.class === selectedClass);
    }
    return [];
  }, [paths, selectedClass, selectedSubclass]);

  return (
    <div className="space-y-6">
      {/* Step 1: Choose your class */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Step 1: Choose Your Class
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.name}
              className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
                selectedClass === cls.name
                  ? "ring-2 ring-primary shadow-md"
                  : "opacity-80 hover:opacity-100"
              } ${classColors[cls.name] || "border-l-gray-500"}`}
              onClick={() => handleClassSelect(cls.name)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background">
                    {classIcons[cls.name] || <Star className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-semibold">{cls.name}</h4>
                    <p className="text-xs text-muted-foreground">{cls.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Step 2: Choose your subclass */}
      {selectedClass && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Step 2: Specialize
          </h3>
          <div className="flex flex-wrap gap-2">
            {classes
              .find((c) => c.name === selectedClass)
              ?.subclasses.map((sub) => (
                <Button
                  key={sub.name}
                  variant={selectedSubclass === sub.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSubclassSelect(sub.name)}
                  className={selectedSubclass === sub.name ? "" : subclassColors[selectedClass] || ""}
                >
                  {sub.name}
                  <span className="ml-1 text-xs opacity-60">({sub.paths.length})</span>
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* Step 3: Explore paths */}
      {visiblePaths.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            {selectedSubclass ? "Your Paths" : "All " + selectedClass + " Paths"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visiblePaths.map((path) => (
              <Card
                key={path.id}
                className="group cursor-pointer transition-all hover:shadow-md"
                onClick={() => handlePathClick(path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    {path.is_featured && (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        path.difficulty === "beginner"
                          ? "default"
                          : path.difficulty === "intermediate"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {path.difficulty}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {path.duration_days} days
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {path.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {path.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {path.examples && path.examples.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Real examples:</p>
                      <div className="flex flex-wrap gap-2">
                        {path.examples.slice(0, 3).map((ex) => (
                          <span key={ex.id} className="text-xs bg-secondary px-2 py-1 rounded">
                            {ex.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Explore <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedClass && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Swords className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Select a class above to see available paths</p>
        </div>
      )}
    </div>
  );
}

function getClassDescription(className: string): string {
  const descriptions: Record<string, string> = {
    Founder: "Build something from nothing. High risk, high reward.",
    Creator: "Make things that resonate. Audience-first, expression-driven.",
    Operator: "Run things well. Process, systems, and execution.",
  };
  return descriptions[className] || "Explore this path.";
}

function getSubclassDescription(subclass: string): string {
  const descriptions: Record<string, string> = {
    "Tech Founder": "AI, SaaS, platforms. Code or no-code.",
    "Small Business": "Local, service, retail. Cash flow focused.",
    "AI Startup": "AI-native products. Models, agents, automation.",
    Indie: "Solo, profitable, sustainable. No VC.",
    "No-Code": "Build without code. Fast validation.",
    "Digital Content": "YouTube, newsletters, podcasts.",
    Community: "Forums, cohorts, tribes. Engagement-first.",
    Product: "Roadmaps, discovery, delivery. User-obsessed.",
    Marketing: "Growth, acquisition, retention. Data-driven.",
    Design: "UI, UX, systems. Aesthetic + functional.",
  };
  return descriptions[subclass] || "Specialized path.";
}
