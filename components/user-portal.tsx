"use client";

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
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getMindmapReflections } from "@/lib/supabase/mindmap-reflections";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

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
    <div className="relative min-h-screen w-full text-white overflow-hidden pb-12">
      {/* Dusk Background Atmosphere */}
      <div className="absolute inset-0 bg-[#06000f] z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06000f] via-[#1a0336] to-[#0d0d0d] opacity-90 z-0" />
      
      {/* Drifting Cloud Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/10 blur-[100px] animate-cloud-slow z-0" style={{ animationDuration: '18s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-pink-900/10 blur-[90px] animate-cloud-slow z-0" style={{ animationDuration: '22s', animationDelay: '-5s' }} />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header greeting with premium atmospheric typography */}
        <div className="flex flex-col space-y-2 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-kodchasan bg-gradient-to-r from-white via-slate-200 to-purple-200 bg-clip-text text-transparent">
            Hi,{" "}
            {user?.user_metadata?.full_name?.split(" ")[0] ||
              user?.email?.split("@")[0] ||
              "there"}
            ! 👋
          </h1>
          <p suppressHydrationWarning className="text-sm md:text-base text-slate-400 font-bai-jamjuree italic font-light max-w-xl">
            {getRandomMotivationalText()}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          {/* Left: North Star Assessment Card (Premium Dusk Card style) */}
          <div
            className="ei-card lg:col-span-2 h-[450px] md:h-[500px] flex flex-col justify-between p-8 group cursor-pointer"
            onClick={() => {
              if (isLoadingNorthStar) return;
              if (hasNorthStarResult) {
                window.location.assign("/me/journey/new-northstar?step=results");
              } else {
                window.location.assign("/me/journey/new-northstar");
              }
            }}
          >
            {/* Soft inner glow elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            <div className="flex flex-col space-y-4">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl blur-xl opacity-40 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-br from-[#1a0a2e] to-[#2d1449] border border-purple-500/30 p-4 rounded-2xl flex items-center justify-center h-full w-full group-hover:scale-105 transition-transform duration-300">
                  <Compass suppressHydrationWarning className="w-8 h-8 text-orange-400" />
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold font-kodchasan bg-gradient-to-r from-orange-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                {isLoadingNorthStar
                  ? "Loading..."
                  : hasNorthStarResult
                    ? "Your North Star"
                    : "Find Your North Star"}
              </h3>

              <p className="text-slate-400 text-sm md:text-base font-bai-jamjuree max-w-md leading-relaxed">
                {isLoadingNorthStar
                  ? "Checking your progress..."
                  : hasNorthStarResult
                    ? "View your personalized direction profile, career paths, and tailored recommendations."
                    : "Discover your true potential, values, and ideal career directions through our AI-guided alignment check."}
              </p>
            </div>

            <div className="mt-8 flex justify-start">
              {!isLoadingNorthStar && (
                <div className="ei-button-dusk text-sm">
                  {hasNorthStarResult ? (
                    <>
                      <CheckCircle2 suppressHydrationWarning className="w-4 h-4 mr-2" />
                      <span>View Results</span>
                    </>
                  ) : (
                    <>
                      <Sparkles suppressHydrationWarning className="w-4 h-4 mr-2" />
                      <span>Start Assessment</span>
                    </>
                  )}
                  <ArrowRight suppressHydrationWarning className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Streak Card */}
          <div
            className="ei-card lg:col-span-1 p-8 flex flex-col justify-between group cursor-pointer"
            onClick={() => (window.location.href = "/me/reflection")}
          >
            <div className="flex flex-col space-y-4">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-600 rounded-full blur-xl opacity-60" />
                <div className="relative bg-gradient-to-br from-[#1a0a2e] to-[#2d1449] border border-orange-500/20 p-4 rounded-2xl flex items-center justify-center h-full w-full">
                  <Flame suppressHydrationWarning className="h-8 w-8 text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.8)]" />
                </div>
              </div>

              <h4 className="text-xl font-bold font-kodchasan text-orange-200">
                Your Reflection Streak
              </h4>
              <p className="text-slate-400 text-sm font-bai-jamjuree leading-relaxed">
                Stay consistent! Real self-discovery grows night by night.
              </p>
            </div>

            <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-6">
              <div className="text-left">
                <div className="text-5xl font-black font-kodchasan bg-gradient-to-br from-orange-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                  {reflectionStreak}
                </div>
                <div className="text-orange-400/80 text-[10px] tracking-widest uppercase font-bold font-bai-jamjuree">
                  {reflectionStreak === 1 ? "Night" : "Nights"} Streak
                </div>
              </div>

              {reflectionStreak > 0 ? (
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, reflectionStreak) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-8 bg-gradient-to-t from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                    />
                  ))}
                </div>
              ) : (
                <span className="text-xs text-orange-300/60 font-bai-jamjuree">0 days active</span>
              )}
            </div>
          </div>
        </div>

        {/* Reflections Card Section */}
        <div className="ei-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="text-xl font-bold font-kodchasan flex items-center gap-3">
              <Heart suppressHydrationWarning className="h-5 w-5 text-pink-500" />
              Recent Reflections
            </h3>
            <span className="text-xs text-slate-400 font-bai-jamjuree">
              Last 6 entries
            </span>
          </div>

          {reflections.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-full flex items-center justify-center mb-4 text-slate-500">
                <Brain suppressHydrationWarning className="h-8 w-8" />
              </div>
              <p className="text-slate-400 text-sm font-bai-jamjuree mb-4">
                You haven't recorded any reflections yet.
              </p>
              <Button asChild className="ei-button-dusk text-sm">
                <Link href="/me/reflection/mindmap">Start Reflecting</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reflections.map((reflection) => (
                <div
                  key={reflection.id}
                  className="ei-card p-5 cursor-pointer hover:border-purple-500/30 transition-all duration-300"
                  onClick={() => handleReflectionClick(reflection)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar suppressHydrationWarning className="h-4 w-4" />
                      <span className="font-semibold text-xs font-bai-jamjuree">
                        {formatDate(reflection.created_at)}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bai-jamjuree px-2 py-0.5 border-purple-500/20 bg-purple-500/5 text-purple-300"
                    >
                      {reflection.mindmap_topics.length} topics
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-pink-400 text-[11px] font-bai-jamjuree">💗 Satisfaction</span>
                      <span className="text-xs font-bold font-bai-jamjuree text-pink-300">{reflection.satisfaction_rating}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1">
                      <div
                        className="bg-pink-500 h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${reflection.satisfaction_rating}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal Dialog for Reflection Details */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#160b24] to-[#0d0d0d] border border-purple-500/20 text-white rounded-2xl p-6">
          <DialogHeader className="border-b border-white/5 pb-4 mb-4">
            <DialogTitle className="text-xl font-bold font-kodchasan bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Reflection Detail —{" "}
              {selectedReflection && formatDate(selectedReflection.created_at)}
            </DialogTitle>
          </DialogHeader>

          {selectedReflection && (
            <div className="space-y-6 mt-4 font-bai-jamjuree">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-pink-500/5 p-3 rounded-xl border border-pink-500/10 text-center">
                  <div className="text-[10px] text-pink-400 font-bold tracking-wider uppercase mb-1">
                    Satisfaction
                  </div>
                  <div className="text-2xl font-bold text-pink-400">
                    {selectedReflection.satisfaction_rating}
                  </div>
                </div>
                <div className="bg-purple-500/5 p-3 rounded-xl border border-purple-500/10 text-center">
                  <div className="text-[10px] text-purple-400 font-bold tracking-wider uppercase mb-1">
                    Progress
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    {selectedReflection.progress_rating}
                  </div>
                </div>
                <div className="bg-orange-500/5 p-3 rounded-xl border border-orange-500/10 text-center">
                  <div className="text-[10px] text-orange-400 font-bold tracking-wider uppercase mb-1">
                    Challenge
                  </div>
                  <div className="text-2xl font-bold text-orange-400">
                    {selectedReflection.challenge_rating}
                  </div>
                </div>
              </div>

              {selectedReflection.overall_reflection && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Overall Reflection
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                    {selectedReflection.overall_reflection}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-purple-400">
                  Topics Discussed
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReflection.mindmap_topics.map((topic) => (
                    <div key={topic.id} className="ei-card p-5 bg-white/[0.01]">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-sm text-purple-200 truncate pr-2">
                          {topic.text}
                        </h5>
                      </div>

                      {topic.notes && (
                        <p className="text-xs text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                          {topic.notes}
                        </p>
                      )}

                      <div className="space-y-2 border-t border-white/5 pt-3">
                        {topic.satisfaction_rating !== null && (
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Satisfaction</span>
                            <span className="font-bold text-pink-400">{topic.satisfaction_rating}</span>
                          </div>
                        )}
                        {topic.progress_rating !== null && (
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Progress</span>
                            <span className="font-bold text-purple-400">{topic.progress_rating}</span>
                          </div>
                        )}
                        {topic.challenge_rating !== null && (
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Challenge</span>
                            <span className="font-bold text-orange-400">{topic.challenge_rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
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
