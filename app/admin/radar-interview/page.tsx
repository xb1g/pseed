import { RadarInterviewClient } from "./RadarInterviewClient";

export const dynamic = "force-dynamic";

export default function AdminRadarInterviewPage() {
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-2xl font-semibold">Radar Interview Note-Taker</h2>
        <p className="text-sm text-muted-foreground">
          Take live notes during a mentor interview, then generate a DB-ready AI
          prompt that turns them into a Career Radar <code>realPeople</code> entry.
        </p>
      </div>
      <RadarInterviewClient />
    </div>
  );
}
