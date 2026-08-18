import { Flame } from "lucide-react";
import { NOTES } from "@/lib/content/pathlab-page";
import { PARTNER_GOAL } from "@/lib/content/pathlab-partner";

/**
 * "เป้าหมายของโปรเจกต์นี้คืออะไร?" — the problem, then the mission stated on
 * a brown card, the same inversion .pathlab-offer__card uses to mark the
 * answer block on the cream canvas.
 */
export function PartnerGoal() {
  return (
    <section
      id="partner-goal"
      className="pathlab-partner__section"
      aria-labelledby="partner-goal-heading"
    >
      <h2 id="partner-goal-heading" className="pathlab-partner__heading">
        {PARTNER_GOAL.heading}
      </h2>

      <p className="pathlab-partner__body">
        {PARTNER_GOAL.bodyLead}{" "}
        <strong>&quot;{PARTNER_GOAL.bodyStrong}&quot;</strong>{" "}
        {PARTNER_GOAL.bodyTail}
      </p>

      <div className="pathlab-partner__mission">
        <Flame className="pathlab-partner__mission-icon" aria-hidden="true" />
        <p className="pathlab-partner__mission-text">
          <strong>{PARTNER_GOAL.missionLabel}</strong> {PARTNER_GOAL.missionBody}
        </p>
      </div>

      <p className="pathlab-note-row">
        <span className="pathlab-note pathlab-note--tilt-r">
          {NOTES.partnerGoal}
        </span>
      </p>
    </section>
  );
}
