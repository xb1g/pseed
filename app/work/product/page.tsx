import type { Metadata } from "next";

import { ProductWorkspace } from "@/components/work/ProductWorkspace";

export const metadata: Metadata = {
  title: "Product Development | Work OS",
  description: "Evidence-led product decisions for PassionSeed.",
};

export default function ProductDevelopmentPage() {
  return <ProductWorkspace />;
}
