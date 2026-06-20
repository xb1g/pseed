import { Metadata } from "next";
import { getGalleryProducts } from "@/lib/hackathon/gallery";
import { PLACEHOLDER_PRODUCTS } from "@/lib/hackathon/gallery-placeholders";
import MatchFlow from "./MatchFlow";
import JellyfishBackground from "@/components/hackathon/gallery/JellyfishBackground";

export const metadata: Metadata = {
  title: "Find Your Match | PassionSeed Hackathon",
  description: "Let our whale mascot help you find the perfect health product from the hackathon.",
};

export const revalidate = 60;

export default async function MatchPage() {
  let products = await getGalleryProducts();

  if (products.length === 0) {
    products = PLACEHOLDER_PRODUCTS.map((p) => ({
      ...p,
      interest_count: Math.floor(Math.random() * 30),
      match_count: 0,
      target_personas: null,
    }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bloom-bg)" }}>
      <JellyfishBackground />
      <MatchFlow products={products} />
    </div>
  );
}
