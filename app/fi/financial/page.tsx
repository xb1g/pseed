import { FinancialModelDashboard } from "@/components/financial/FinancialModelDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent-funded Financial Model | PassionSeed",
  description: "PassionSeed founder dashboard for parent-funded PathLab unit economics.",
};

export default function FinancialPage() {
  return <FinancialModelDashboard />;
}
