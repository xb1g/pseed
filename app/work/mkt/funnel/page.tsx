import type { Metadata } from "next";

import { MarketingFunnelWorkspace } from "@/components/work/MarketingFunnelWorkspace";

export const metadata: Metadata = {
  title: "Marketing Funnel | Work OS",
  description: "PassionSeed's TOFU, MOFU, BOFU content and sales workspace.",
};

export default function MarketingFunnelPage() {
  return <MarketingFunnelWorkspace />;
}
