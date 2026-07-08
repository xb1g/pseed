"use client";

import { useState, useMemo } from "react";
import { CareerPath } from "@/types/career";
import { CareerCaseGrid } from "@/components/careers/CareerCaseGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useViewTracking } from "@/hooks/useViewTracking";
import { Search, Clock, ArrowRight, Star } from "lucide-react";

interface CareerListViewProps {
  paths: CareerPath[];
}

const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };

export function CareerListView({ paths }: CareerListViewProps) {
  const { track } = useViewTracking("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);

  const filteredPaths = useMemo(() => {
    let result = [...paths];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (difficultyFilter !== "all") {
      result = result.filter((p) => p.difficulty === difficultyFilter);
    }

    switch (sortBy) {
      case "featured":
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
      case "difficulty-asc":
        result.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
        break;
      case "difficulty-desc":
        result.sort((a, b) => difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]);
        break;
      case "duration":
        result.sort((a, b) => a.duration_days - b.duration_days);
        break;
    }

    return result;
  }, [paths, searchQuery, difficultyFilter, sortBy]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      track("search_query", { query: value });
    }
  };

  const handleFilter = (value: string) => {
    setDifficultyFilter(value);
    track("filter_applied", { filter: "difficulty", value });
  };

  const handlePathClick = (path: CareerPath) => {
    track("path_clicked", { path_id: path.id, path_title: path.title });
    setSelectedPath(path);
  };

  const handleBack = () => {
    setSelectedPath(null);
  };

  if (selectedPath) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{selectedPath.title}</h2>
          <p className="text-muted-foreground">{selectedPath.description}</p>
        </div>
        {selectedPath.cases && selectedPath.cases.length > 0 ? (
          <CareerCaseGrid cases={selectedPath.cases} onBack={handleBack} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No case studies yet for this path.</p>
            <Button variant="ghost" onClick={handleBack} className="mt-4">
              Back to paths
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search paths, tags..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={difficultyFilter} onValueChange={handleFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="difficulty-asc">Easiest First</SelectItem>
            <SelectItem value="difficulty-desc">Hardest First</SelectItem>
            <SelectItem value="duration">Shortest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredPaths.length} path{filteredPaths.length !== 1 ? "s" : ""} found
      </p>

      {/* Path cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPaths.map((path) => (
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

      {filteredPaths.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No paths match your filters.</p>
        </div>
      )}
    </div>
  );
}
