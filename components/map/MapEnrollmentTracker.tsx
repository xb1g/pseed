"use client";

import { useEffect, useState } from "react";
import {
  enrollUserInMap,
  isUserEnrolledInMap,
} from "@/lib/api/enrollment-client";
import { useToast } from "@/components/ui/use-toast";
import { MapWelcomeExperience } from "./MapWelcomeExperience";
import { LearningMap } from "@/types/map";

interface MapEnrollmentTrackerProps {
  map: LearningMap & {
    node_count?: number;
    avg_difficulty?: number;
    total_assessments?: number;
  };
  children: React.ReactNode;
  /**
   * Skip auto-enrollment. Set for viewers who reached the map by bypassing the
   * lobby gate (admins, instructors, the creator): enrolling them would write a
   * row with a null lobby_id, breaking the "every enrollment belongs to exactly
   * one lobby" invariant the lobby feature depends on.
   */
  skipAutoEnroll?: boolean;
  /**
   * Admins bypass the lobby gate and are never auto-enrolled, so they never see
   * the welcome experience organically. They get a quiet "Replay welcome"
   * button instead (clears the seen-gate and reopens it) for previewing.
   */
  isAdmin?: boolean;
}

export function MapEnrollmentTracker({
  map,
  children,
  skipAutoEnroll = false,
  isAdmin = false,
}: MapEnrollmentTrackerProps) {
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAndEnrollUser = async () => {
      try {
        console.log("🔍 [MapEnrollmentTracker] Checking enrollment for map:", map.id);
        
        // Check if user is already enrolled
        const isEnrolled = await isUserEnrolledInMap(map.id);
        console.log("✅ [MapEnrollmentTracker] Enrollment check result:", isEnrolled);

        if (!isEnrolled) {
          console.log("🎯 [MapEnrollmentTracker] User not enrolled, attempting auto-enrollment");
          
          // Automatically enroll the user
          const enrollmentSuccess = await enrollUserInMap(map.id);
          
          if (enrollmentSuccess) {
            console.log("✅ [MapEnrollmentTracker] Auto-enrollment successful");
            setJustEnrolled(true);

            // Don't show the tour again if the user already skipped/finished it
            const tourSeenKey = `map-welcome-tour-seen:${map.id}`;
            const tourSeen =
              typeof window !== "undefined" &&
              window.localStorage.getItem(tourSeenKey) === "true";

            if (!tourSeen) {
              setShowWelcomeDialog(true);

              toast({
                title: "🎉 Welcome to Your Adventure!",
                description: `You've been enrolled in ${map.title}. Let the learning begin!`,
              });
            }
          } else {
            console.warn("⚠️ [MapEnrollmentTracker] Auto-enrollment failed, but continuing");
            // Don't show error to user, just continue - they can still view the map
          }
        } else {
          console.log("✅ [MapEnrollmentTracker] User already enrolled, no action needed");
        }
      } catch (error) {
        // If there's an error (e.g., user not logged in), silently continue
        // The enrollment will be handled through the proper flow
        console.warn("⚠️ [MapEnrollmentTracker] Auto-enrollment error:", error);
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('401')) {
          console.log("🔐 [MapEnrollmentTracker] Authentication required - user needs to log in");
        }
      } finally {
        setIsCheckingEnrollment(false);
      }
    };

    checkAndEnrollUser();
  }, [map.id, map.title, toast]);

  // Don't show the welcome dialog if we came from the enrollment dialog
  // (to avoid double dialogs)
  useEffect(() => {
    if (justEnrolled) {
      // Check if we just came from the maps page (where enrollment dialog was shown)
      const referrer = document.referrer;
      const isFromMapsPage =
        referrer.includes("/map") && !referrer.includes("/map/");

      if (isFromMapsPage) {
        // Don't show welcome dialog if user just came from maps page
        setShowWelcomeDialog(false);
      }
    }
  }, [justEnrolled]);

  const tourSeenKey = `map-welcome-tour-seen:${map.id}`;

  // Admin preview: forget the seen-gate and reopen the welcome experience.
  const replayWelcome = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(tourSeenKey);
    }
    setShowWelcomeDialog(true);
  };

  return (
    <>
      {children}

      {/* Admin-only replay control; sits under the welcome overlay (z-[60]) */}
      {isAdmin && !showWelcomeDialog && (
        <button
          type="button"
          onClick={replayWelcome}
          className="fixed bottom-4 right-4 z-40 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 backdrop-blur transition-colors hover:text-slate-200"
        >
          Replay welcome
        </button>
      )}

      {/* Welcome experience for first-time visitors */}
      <MapWelcomeExperience
        isOpen={showWelcomeDialog}
        onOpenChange={(open) => {
          if (!open && typeof window !== "undefined") {
            // Remember that the user skipped/finished the tour
            window.localStorage.setItem(tourSeenKey, "true");
          }
          setShowWelcomeDialog(open);
        }}
        map={map}
      />
    </>
  );
}
