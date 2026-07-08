import type { Metadata } from "next";
import { LinkPageClient, type LinkItem } from "./link-page-client";

export const metadata: Metadata = {
  title: "Passion Seed — Links",
  description: "Office hours, feedback, and ways to join us.",
  openGraph: {
    type: "website",
    title: "Passion Seed — Links",
    description: "Office hours, feedback, and ways to join us.",
  },
};

const links: LinkItem[] = [
  {
    label: "Book Office Hours",
    href: "https://calendly.com/passionseed/office-hours",
    description: "Talk through a path, project, or decision with us.",
    icon: "calendar",
  },
  {
    label: "Pain Report",
    href: "mailto:help@passionseed.org?subject=I%20have%20a%20pain%20report",
    description: "Something broken, confusing, or slow? Tell us directly.",
    icon: "warning",
  },
  {
    label: "Feature Request",
    href: "mailto:help@passionseed.org?subject=Feature%20request",
    description: "What would make Passion Seed more useful tomorrow?",
    icon: "sparkles",
  },
  {
    label: "Join Us",
    href: "mailto:help@passionseed.org?subject=I%20want%20to%20join%20Passion%20Seed",
    description: "Build with us on the future of education and careers.",
    icon: "users",
  },
  {
    label: "Passion Seed",
    href: "https://passionseed.org",
    description: "Discover the platform, programs, and learning maps.",
    icon: "globe",
  },
];

export default function LinkPage() {
  return <LinkPageClient links={links} />;
}
