import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Passion Seed — Links",
  description: "Office hours, feedback, and ways to join us.",
  openGraph: {
    type: "website",
    title: "Passion Seed — Links",
    description: "Office hours, feedback, and ways to join us.",
  },
};

const links = [
  {
    label: "Book Office Hours",
    href: "https://calendly.com/passionseed/office-hours",
    description: "Talk to us. 15 min, no strings.",
  },
  {
    label: "Pain Report",
    href: "mailto:help@passionseed.org?subject=I%20have%20a%20pain%20report",
    description: "Something broken? Tell us.",
  },
  {
    label: "Feature Request",
    href: "mailto:help@passionseed.org?subject=Feature%20request",
    description: "What should we build next?",
  },
  {
    label: "Join Us",
    href: "mailto:help@passionseed.org?subject=I%20want%20to%20join%20Passion%20Seed",
    description: "Rethink education and careers for the future.",
  },
  {
    label: "Passion Seed",
    href: "https://passionseed.org",
    description: "Discover and nurture your passions.",
  },
];

export default function LinkPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-950 via-purple-900 to-violet-950 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="relative w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <Image
            src="/passionseed-logo.svg"
            alt="Passion Seed"
            width={48}
            height={48}
            className="opacity-90"
          />
        </div>

        {/* Name */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Passion Seed</h1>
          <p className="text-sm text-white/60 mt-1">Rethink education and careers for the future.</p>
        </div>

        {/* Links */}
        <div className="w-full flex flex-col gap-3">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group w-full text-left rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-200 px-5 py-4"
            >
              <div className="text-white font-medium text-sm">{link.label}</div>
              <div className="text-white/50 text-xs mt-0.5">{link.description}</div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-white/30 text-xs mt-4">
          help@passionseed.org
        </div>
      </div>
    </main>
  );
}
