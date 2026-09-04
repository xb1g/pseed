import type { ReactNode } from "react";

import { WorkShell } from "@/components/work/WorkShell";
import { requireWorkAccess } from "@/lib/work/access";

export const dynamic = "force-dynamic";

export default async function WorkLayout({ children }: { children: ReactNode }) {
  await requireWorkAccess();
  return <WorkShell>{children}</WorkShell>;
}
