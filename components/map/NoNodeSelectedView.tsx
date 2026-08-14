// app/components/NodeViewPanel/NoNodeSelectedView.tsx
import { ClipboardCheck, MapPin, Pencil } from "lucide-react";

interface NoNodeSelectedViewProps {
  // Matches the map view mode so privileged users get an empty state that
  // explains what the side panel will do once they pick a node.
  variant?: "preview" | "edit" | "grade";
}

const VARIANT_CONTENT = {
  preview: {
    icon: MapPin,
    iconClasses: "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600",
    title: "Explore Your Learning Journey",
    body: "Select any node on the map to view its content, track your progress, and complete assessments. Your adventure awaits!",
    tips: [
      "💡 Tip: Click on any unlocked node to get started",
      "🔒 Locked nodes require completing prerequisites first",
    ],
  },
  edit: {
    icon: Pencil,
    iconClasses:
      "bg-gradient-to-br from-amber-100 to-orange-200 text-amber-600",
    title: "Select a Node to Edit",
    body: "Click any node on the map to edit its title, content, assessment, and settings. Changes save as you go.",
    tips: [
      "✏️ Title and settings update on blur",
      "🖼️ Sprites and content save immediately",
    ],
  },
  grade: {
    icon: ClipboardCheck,
    iconClasses:
      "bg-gradient-to-br from-green-100 to-emerald-200 text-emerald-600",
    title: "Select a Node to Grade",
    body: "Click any node on the map to review student submissions, leave feedback, and assign pass/fail grades.",
    tips: [
      "📥 Submissions awaiting review appear per node",
      "🔁 Grading updates student progress instantly",
    ],
  },
} as const;

export function NoNodeSelectedView({
  variant = "preview",
}: NoNodeSelectedViewProps) {
  const content = VARIANT_CONTENT[variant] ?? VARIANT_CONTENT.preview;
  const Icon = content.icon;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-muted/5">
      <div className="space-y-6 max-w-sm">
        <div
          className={`w-20 h-20 mx-auto bg-gradient-to-br rounded-full flex items-center justify-center ${content.iconClasses}`}
        >
          <Icon className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-3">
            {content.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content.body}
          </p>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          {content.tips.map((tip) => (
            <p key={tip}>{tip}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
