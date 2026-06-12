# Codebase Cleanup and Dashboard Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove maps, classrooms, and teams, and simplify the `/me` student dashboard.

**Architecture:** 
1. Delete route folders and API folders related to maps, classrooms, and teams.
2. Clean up navigation components to remove links to deleted pages.
3. Simplify the `UserPortal` component layout to only show Welcome, North Star Assessment, Reflection Streak, and Recent Reflections, removing tabs and unused dynamic sections.

**Tech Stack:** Next.js (App Router), TailwindCSS, TypeScript, Lucide Icons

---

### Task 1: Delete Deprecated Files and Directories

**Files:**
*   Delete:
    *   `app/map/`
    *   `app/classrooms/`
    *   `app/teams/`
    *   `app/test-classroom/`
    *   `app/test-teams/`
    *   `app/api/maps/`
    *   `app/api/classrooms/`
    *   `app/api/test-classroom/`
    *   `app/api/user/next-nodes/`
    *   `components/map/`
    *   `components/classroom/`
    *   `components/teams/`
    *   `components/song-of-the-day/`

**Step 1: Delete directories and verify deletion**

Run:
```bash
rm -rf app/map app/classrooms app/teams app/test-classroom app/test-teams app/api/maps app/api/classrooms app/api/test-classroom app/api/user/next-nodes components/map components/classroom components/teams components/song-of-the-day
```

**Step 2: Commit changes**

Run:
```bash
git add -A
git commit -m "cleanup: remove deprecated map, classroom, team, and song-of-the-day files"
```

---

### Task 2: Simplify Main Navigation

**Files:**
*   Modify: `components/main-nav.tsx`

**Step 1: Simplify `navItems` array and remove hackathon filter logic**

Edit `components/main-nav.tsx` to:
1. Update `navItems` to only contain About, Seeds, and My Journey.
2. Remove the `.filter(item => isHackathon ? !['/classrooms', '/teams'].includes(item.href) : true)` filter check.

```typescript
// Replace lines 19-26 with:
const navItems = [
  { href: "/about", label: { en: "About", th: "เกี่ยวกับ" }, icon: Compass },
  { href: "/seeds", label: { en: "Seeds", th: "Seeds" }, icon: Sprout },
  { href: "/me", label: { en: "My Journey", th: "เส้นทางของฉัน" }, icon: User },
];
```

Also, modify lines 143-146 to render `navItems` directly:
```typescript
{navItems.map((item, index) => (
```

And lines 293-308 in desktop nav:
```typescript
// Remove the !isHackathon check for classrooms/teams. The desktop nav should just map navItems or render them statically.
```

**Step 2: Commit**

Run:
```bash
git add components/main-nav.tsx
git commit -m "cleanup: simplify main navigation links"
```

---

### Task 3: Simplify User Portal (`/me` Dashboard)

**Files:**
*   Modify: `components/user-portal.tsx`

**Step 1: Rewrite `components/user-portal.tsx` to simplify states, effects, and layout**

1. Remove unused imports: `PortalVinyl`, `BadgeGallery`, `MilestoneList`, `MapNode`, `LearningMap`, `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, etc.
2. Remove states: `nextNodes`, `isLoadingNextNodes`.
3. Remove layout sections: "Next Steps" card, "Achievement Badges" card, tabs system, and portal vinyl player.
4. Render the welcome section on top, the North Star assessment on the left, and the Streak + Recent Reflections directly visible on the right side of a grid.

Complete simplified file contents:
```typescript
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  ArrowRight,
  Flame,
  Brain,
  Sparkles,
  Compass,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { getMindmapReflections } from "@/lib/supabase/mindmap-reflections";
import { useAuth } from "@/hooks/use-auth";

interface MindmapReflection {
  id: string;
  satisfaction_rating: number;
  progress_rating: number;
  challenge_rating: number;
  overall_reflection: string;
  created_at: string;
  mindmap_topics: Array<{
    id: string;
    text: string;
    notes: string | null;
    satisfaction_rating: number | null;
    progress_rating: number | null;
    challenge_rating: number | null;
    reflection_why: string | null;
  }>;
}

interface UserPortalProps {
  dashboardData: {
    reflectionStreak: number;
  };
}

export function UserPortal({ dashboardData }: UserPortalProps) {
  const { reflectionStreak } = dashboardData;
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [reflections, setReflections] = useState<MindmapReflection[]>([]);
  const [selectedReflection, setSelectedReflection] =
    useState<MindmapReflection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasNorthStarResult, setHasNorthStarResult] = useState(false);
  const [isLoadingNorthStar, setIsLoadingNorthStar] = useState(true);

  useEffect(() => {
    const fetchReflections = async () => {
      try {
        const data = await getMindmapReflections(20);

        const deduplicatedReflections = (data || []).reduce(
          (acc, reflection) => {
            const date = new Date(reflection.created_at).toDateString();
            const existing = acc.get(date);

            if (
              !existing ||
              new Date(reflection.created_at) > new Date(existing.created_at)
            ) {
              acc.set(date, reflection);
            }

            return acc;
          },
          new Map<string, MindmapReflection>()
        );

        const uniqueReflections = Array.from(deduplicatedReflections.values())
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 6);

        setReflections(uniqueReflections);
      } catch (error) {
        console.error("Error fetching reflections:", error);
        setReflections([]);
      }
    };
    fetchReflections();
  }, []);

  useEffect(() => {
    const checkNorthStarResult = async () => {
      try {
        setIsLoadingNorthStar(true);
        const { getUserDirectionFinderResult } = await import(
          "@/app/actions/save-direction"
        );
        const result = await getUserDirectionFinderResult();
        setHasNorthStarResult(!!result?.result);
      } catch (error) {
        console.error("Error checking North Star result:", error);
        setHasNorthStarResult(false);
      } finally {
        setIsLoadingNorthStar(false);
      }
    };
    checkNorthStarResult();
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleReflectionClick = (reflection: MindmapReflection) => {
    setSelectedReflection(reflection);
    setIsModalOpen(true);
  };

  const getRandomMotivationalText = () => {
    const texts = [
      "Every great journey begins with a single step. Keep moving forward!",
      "Your passion is your superpower. Use it wisely today.",
      "Growth happens outside your comfort zone. Embrace the challenge!",
      "Small consistent actions lead to extraordinary results.",
      "You're capable of amazing things. Believe in your potential.",
      "Learning is a lifelong adventure. Enjoy the journey!",
      "Your unique perspective makes the world a better place.",
      "Progress over perfection. Celebrate your wins today!",
      "Curiosity is the spark that ignites innovation.",
      "Your dedication inspires others. Keep shining!",
    ];

    const seed = user?.id || user?.email || "anonymous";
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash) % texts.length;
    return texts[index];
  };

  return (
    <div className="flex flex-col space-y-6 md:space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Hi,{" "}
              {user?.user_metadata?.full_name?.split(" ")[0] ||
                user?.email?.split("@")[0] ||
                "there"}
              ! 👋
            </h1>
            <p suppressHydrationWarning className="text-sm md:text-base text-muted-foreground italic">
              {getRandomMotivationalText()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Left Column: North Star Assessment Card */}
        <Card
          className="md:col-span-2 h-[480px] md:h-[580px] overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border-purple-500/20 hover:border-purple-500/50"
          onClick={() => {
            if (isLoadingNorthStar) return;
            if (hasNorthStarResult) {
              window.location.assign("/me/journey/new-northstar?step=results");
            } else {
              window.location.assign("/me/journey/new-northstar");
            }
          }}
        >
          <CardContent className="h-full p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-2xl" />

            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-3xl shadow-lg group-hover:scale-110 transition-transform">
                <Compass suppressHydrationWarning className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-200 to-blue-300 mb-3">
              {isLoadingNorthStar
                ? "Loading..."
                : hasNorthStarResult
                  ? "Your North Star"
                  : "Find Your North Star"}
            </h3>

            <p className="text-slate-400 text-sm md:text-base mb-6 max-w-md leading-relaxed">
              {isLoadingNorthStar
                ? "Checking your progress..."
                : hasNorthStarResult
                  ? "View your personalized direction profile and career recommendations"
                  : "Discover your strengths, values, and ideal career paths through our AI-powered assessment"}
            </p>

            {!isLoadingNorthStar && (
              <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold shadow-lg group-hover:shadow-purple-500/50 group-hover:scale-105 transition-all">
                {hasNorthStarResult ? (
                  <>
                    <CheckCircle2 suppressHydrationWarning className="w-4 h-4" />
                    <span>View Results</span>
                  </>
                ) : (
                  <>
                    <Sparkles suppressHydrationWarning className="w-4 h-4" />
                    <span>Start Assessment</span>
                  </>
                )}
                <ArrowRight suppressHydrationWarning className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Streak Card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-[2px] cursor-pointer group hover:scale-[1.02] transition-transform"
            onClick={() => (window.location.href = "/me/reflection")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-2xl" />

              <div className="relative z-10 flex items-center justify-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-600 rounded-full blur-xl opacity-60" />
                  <Flame suppressHydrationWarning className="relative h-10 w-10 text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]" />
                </div>

                <div className="text-center">
                  <div className="text-4xl font-black bg-gradient-to-br from-orange-300 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
                    {reflectionStreak}
                  </div>
                  <div className="text-orange-200 text-base font-semibold tracking-wider uppercase">
                    {reflectionStreak === 1 ? "Night" : "Nights"}
                  </div>
                  <div className="text-orange-400/80 text-sm font-medium tracking-widest uppercase">
                    Streak
                  </div>
                </div>

                {reflectionStreak > 0 && (
                  <div className="flex flex-col items-center gap-1.5">
                    {Array.from({ length: Math.min(5, reflectionStreak) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-6 bg-gradient-to-t from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                        />
                      )
                    )}
                  </div>
                )}
              </div>

              <p className="text-orange-200/60 text-xs text-center mt-3 max-w-[200px] mx-auto">
                {reflectionStreak === 0
                  ? "Start your reflection journey today!"
                  : reflectionStreak < 3
                    ? "Keep the fire burning! 🔥"
                    : reflectionStreak < 7
                      ? "You're on a roll! ✨"
                      : reflectionStreak < 14
                        ? "Amazing dedication! 🌟"
                        : "Legendary streak! 🏆"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reflections Section */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center text-lg md:text-xl">
            <Heart suppressHydrationWarning className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Recent Reflections
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Your latest mindmap reflections and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reflections.length === 0 ? (
            <div className="text-center py-8">
              <Brain suppressHydrationWarning className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm md:text-base">
                No reflections yet
              </p>
              <Button asChild className="mt-4 text-sm md:text-base">
                <Link href="/me/reflection/mindmap">Start Reflecting</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {reflections.map((reflection) => (
                <Card
                  key={reflection.id}
                  className="cursor-pointer hover:shadow-md transition-shadow h-full"
                  onClick={() => handleReflectionClick(reflection)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                        <Calendar suppressHydrationWarning className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm truncate">
                          {formatDate(reflection.created_at)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 flex-shrink-0"
                      >
                        {reflection.mindmap_topics.length} topics
                      </Badge>
                    </div>

                    <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-pink-500 text-[10px] md:text-xs">
                          💗 Satisfaction
                        </span>
                        <span className="text-[10px] md:text-xs font-medium">
                          {reflection.satisfaction_rating}
                        </span>
                      </div>
                      <div className="w-full bg-muted/60 rounded-full h-1 md:h-1.5">
                        <div
                          className="bg-pink-500 h-1 md:h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${reflection.satisfaction_rating}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog for Reflection Details */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Reflection Detail —{" "}
                {selectedReflection && formatDate(selectedReflection.created_at)}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedReflection && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-pink-500/10 p-3 rounded-lg border border-pink-500/20 text-center">
                  <div className="text-[10px] text-pink-400 font-semibold tracking-wider uppercase mb-1">
                    Satisfaction
                  </div>
                  <div className="text-2xl font-bold text-pink-500">
                    {selectedReflection.satisfaction_rating}
                  </div>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-center">
                  <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase mb-1">
                    Progress
                  </div>
                  <div className="text-2xl font-bold text-emerald-500">
                    {selectedReflection.progress_rating}
                  </div>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-center">
                  <div className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase mb-1">
                    Challenge
                  </div>
                  <div className="text-2xl font-bold text-amber-500">
                    {selectedReflection.challenge_rating}
                  </div>
                </div>
              </div>

              {selectedReflection.overall_reflection && (
                <div className="p-4 rounded-xl bg-muted/40 border border-white/[0.04]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Overall Reflection
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {selectedReflection.overall_reflection}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Topics Discussed
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReflection.mindmap_topics.map((topic) => (
                    <Card key={topic.id} className="bg-muted/30 border-white/[0.04]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-sm truncate pr-2">
                            {topic.text}
                          </h5>
                        </div>

                        {topic.notes && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                            {topic.notes}
                          </p>
                        )}

                        <div className="space-y-1">
                          {topic.satisfaction_rating !== null && (
                            <div className="flex justify-between text-[10px]">
                              <span>Satisfaction</span>
                              <span>{topic.satisfaction_rating}</span>
                            </div>
                          )}
                          {topic.progress_rating !== null && (
                            <div className="flex justify-between text-[10px]">
                              <span>Progress</span>
                              <span>{topic.progress_rating}</span>
                            </div>
                          )}
                          {topic.challenge_rating !== null && (
                            <div className="flex justify-between text-[10px]">
                              <span>Challenge</span>
                              <span>{topic.challenge_rating}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Commit**

Run:
```bash
git add components/user-portal.tsx
git commit -m "cleanup: simplify user-portal dashboard component"
```

---

### Task 4: Verification

**Step 1: Run project build to check for compilation/lint/import errors**

Run:
```bash
pnpm build
```
Expected: PASS with no errors

**Step 2: Start dev server to verify visually if needed**

Run:
```bash
pnpm dev
```
Expected: Runs on localhost successfully
