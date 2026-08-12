'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DawnScene } from '@/components/projectseed/dawn-scene';
import { 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Sparkles, 
  Lock, 
  CreditCard, 
  RefreshCw, 
  AlertTriangle, 
  XCircle, 
  Scale, 
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

interface SummaryPoint {
  title: string;
  desc: string;
}

interface TermSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  plainSummary: string;
  keyPoints: SummaryPoint[];
  fullDetails: string[];
}

const SECTIONS: TermSection[] = [
  {
    id: 'agreement',
    icon: ShieldCheck,
    title: '1. Agreement & Purpose',
    badge: 'Core Terms',
    plainSummary: 'By using Passion Seed, you agree to these terms. We build tools to help students discover their passion and build their future.',
    keyPoints: [
      { title: 'Who we are', desc: 'Passion Seed is operated by PassionSeed Company Limited in Thailand.' },
      { title: 'Our mission', desc: 'Providing interactive learning maps, reflection tools, and collaboration spaces.' },
      { title: 'Acceptance', desc: 'Using our website or platform means you accept these guidelines.' }
    ],
    fullDetails: [
      'By accessing and using Passion Seed ("the Service"), operated by PassionSeed Company Limited ("we," "our," or "us"), you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, please do not use our Service.',
      'These Terms apply to all visitors, registered users, students, educators, and institutional accounts.'
    ]
  },
  {
    id: 'eligibility',
    icon: UserCheck,
    title: '2. Accounts & School Safety',
    badge: 'Eligibility',
    plainSummary: 'Designed for students, teachers, and schools. We keep account safety simple and straightforward.',
    keyPoints: [
      { title: 'Age & Supervision', desc: 'Users under 13 require parental or school consent to register.' },
      { title: 'Account Security', desc: 'You are responsible for keeping your login credentials confidential.' },
      { title: 'Accurate Info', desc: 'Please keep your profile details truthful and accurate.' }
    ],
    fullDetails: [
      'The Service is intended for educational institutions, teachers, and students.',
      'Users under 13 years of age must have parental consent and school supervision to access interactive community features.',
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account.'
    ]
  },
  {
    id: 'acceptable-use',
    icon: AlertTriangle,
    title: '3. Community Rules & Fair Play',
    badge: 'Guidelines',
    plainSummary: 'Passion Seed is a positive, supportive learning environment. Harassment, spam, or abusive content is not tolerated.',
    keyPoints: [
      { title: 'Respectful Conduct', desc: 'No abusive, offensive, or inappropriate content in classrooms.' },
      { title: 'System Security', desc: 'No attempts to hack, exploit, or disrupt platform servers.' },
      { title: 'Intellectual Respect', desc: 'Do not upload material that violates copyright laws.' }
    ],
    fullDetails: [
      'You agree to use the Service only for lawful, educational purposes.',
      'Prohibited actions include: illegal acts, transmitting harmful or abusive content, unauthorized system access, violating third-party IP rights, or uploading inappropriate material in school workspaces.',
      'Violations may lead to immediate account suspension or termination.'
    ]
  },
  {
    id: 'content-ownership',
    icon: BookOpen,
    title: '4. Content & Ownership',
    badge: 'Your Rights',
    plainSummary: 'Your work remains yours. You own your reflections and projects; we own the learning tools and platform code.',
    keyPoints: [
      { title: 'Your Creations', desc: 'You retain full ownership of your written reflections, team work, and uploaded artifacts.' },
      { title: 'Platform License', desc: 'You grant us permission to host and render your content for your learning experience.' },
      { title: 'Passion Seed Content', desc: 'Learning maps, UI design, icons, and curated curriculum belong to Passion Seed.' }
    ],
    fullDetails: [
      'All educational materials, learning maps, software design, and platform tools are owned by PassionSeed Company Limited.',
      'You retain ownership of content you create (reflections, portfolio pieces, team submissions). You grant us a non-exclusive license to host, display, and process your content strictly for operating the Service.',
      'All user-generated content must comply with educational community standards.'
    ]
  },
  {
    id: 'privacy',
    icon: Lock,
    title: '5. Data Privacy & Protection',
    badge: 'Privacy',
    plainSummary: 'We safeguard student data with strict privacy controls. Your data is never sold to advertisers.',
    keyPoints: [
      { title: 'Student First', desc: 'Compliant with educational privacy standards.' },
      { title: 'No Data Sales', desc: 'Your personal reflections and learning progress are never sold.' },
      { title: 'Privacy Policy', desc: 'Governed by our comprehensive Privacy Policy.' }
    ],
    fullDetails: [
      'Your privacy is fundamental to our mission. Collection and usage of personal data are detailed in our Privacy Policy.',
      'We commit to protecting student and educator data in accordance with applicable data protection laws.',
      'Information is used solely to provide personalized learning pathways and classroom features.'
    ]
  },
  {
    id: 'subscription',
    icon: CreditCard,
    title: '6. Subscriptions & Billing',
    badge: 'Billing',
    plainSummary: 'Transparent plans for schools and individuals. Cancel anytime without surprise fees.',
    keyPoints: [
      { title: 'Clear Pricing', desc: 'Free features stay free; premium school plans are clearly itemized.' },
      { title: 'Cancellation', desc: 'Cancel anytime. You retain access until the end of your paid billing cycle.' },
      { title: 'Refunds', desc: 'Fees are non-refundable unless required by applicable consumer law.' }
    ],
    fullDetails: [
      'We offer individual accounts and institutional subscription plans for schools.',
      'Payments are processed through secure payment partners. Subscriptions renew automatically unless cancelled prior to the billing period.',
      'Upon cancellation, access continues through the end of the current paid subscription period.'
    ]
  },
  {
    id: 'modifications',
    icon: RefreshCw,
    title: '7. Service Updates & Changes',
    badge: 'Updates',
    plainSummary: 'We continuously improve Passion Seed. If we make major updates to these terms, we will notify you in advance.',
    keyPoints: [
      { title: 'Platform Improvements', desc: 'We regularly roll out new learning features and fixes.' },
      { title: 'Advance Notice', desc: 'Significant policy updates are announced via email or platform banner.' }
    ],
    fullDetails: [
      'We strive to keep the Service reliable, but uptime is not guaranteed without interruption.',
      'We reserve the right to update or modify these Terms at any time. Material changes will be communicated in advance via email or platform notifications.'
    ]
  },
  {
    id: 'liability-law',
    icon: Scale,
    title: '8. Legal Terms & Jurisdiction',
    badge: 'Legal',
    plainSummary: 'Standard legal protection and governing jurisdiction under the laws of Thailand.',
    keyPoints: [
      { title: 'Limitation of Liability', desc: 'Passion Seed is provided as-is with reasonable care.' },
      { title: 'Governing Law', desc: 'Constructed under the laws of Thailand.' }
    ],
    fullDetails: [
      'To the maximum extent permitted by law, PassionSeed Company Limited is not liable for indirect, incidental, or consequential damages.',
      'These Terms shall be governed by and construed under the laws of Thailand, without regard to conflict of law principles.'
    ]
  }
];

export default function TermsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="dawn-theme relative min-h-screen text-white antialiased selection:bg-amber-500/30">
      {/* Background Dawn atmospheric canvas */}
      <DawnScene />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header bar matching onboarding style */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#020617]/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="dawn-eyebrow text-amber-300/80">PassionSeed</span>
              <span className="hidden text-xs text-white/40 sm:inline">• Terms of Service</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16">
          <div className="mb-10 text-center sm:mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Updated Terms of Service</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Clear, simple terms for your journey
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              We redesigned our terms of service to be easy to read and understand. Below is a plain-English summary of how Passion Seed works, what we promise, and how we protect your space.
            </p>
            <p className="mt-2 text-xs text-white/40">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Quick Summary Banner */}
          <div className="ei-card relative mb-10 overflow-hidden rounded-[24px] border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white sm:text-lg">The 3-Point Guarantee</h3>
                <div className="grid gap-3 pt-1 text-xs leading-relaxed text-white/80 sm:grid-cols-3 sm:text-sm">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <strong className="block font-medium text-amber-200">1. You Own Your Work</strong>
                    <span className="text-white/60">Your projects, reflections, and creations stay 100% yours.</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <strong className="block font-medium text-amber-200">2. Data Safety First</strong>
                    <span className="text-white/60">We never sell your data or trade student profiles to advertisers.</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <strong className="block font-medium text-amber-200">3. Safe Learning Space</strong>
                    <span className="text-white/60">We keep classrooms constructive, respectful, and secure.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="mb-6 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Terms Breakdown ({SECTIONS.length} Sections)
            </h2>
            <button
              type="button"
              onClick={() => setShowAllDetails(!showAllDetails)}
              className="text-xs font-medium text-amber-400/90 transition hover:text-amber-300"
            >
              {showAllDetails ? 'Hide Legal Clause Text' : 'Show Full Legal Text'}
            </button>
          </div>

          {/* Main Sections Cards */}
          <div className="space-y-5">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isExpanded = expandedSection === sec.id || showAllDetails;

              return (
                <div
                  key={sec.id}
                  className="ei-card ei-card--static group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/20"
                >
                  <div className="flex flex-col gap-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-amber-300 group-hover:scale-105 group-hover:border-amber-400/30 transition-transform duration-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{sec.title}</h3>
                            {sec.badge && (
                              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60">
                                {sec.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-white/70">{sec.plainSummary}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.1] hover:text-white"
                        aria-label="Toggle legal clauses"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Key Bullet Summary */}
                    <div className="grid gap-3 pt-2 sm:grid-cols-3">
                      {sec.keyPoints.map((point, idx) => (
                        <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-relaxed">
                          <span className="font-semibold text-white/90">{point.title}</span>
                          <p className="mt-1 text-white/60">{point.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Full Clauses */}
                    {isExpanded && (
                      <div className="mt-2 border-t border-white/[0.08] pt-4 text-xs leading-relaxed text-white/70 space-y-2 bg-black/20 p-4 rounded-xl border border-white/[0.04]">
                        <p className="font-semibold text-amber-300/90 uppercase tracking-wider text-[10px]">
                          Official Clause Details:
                        </p>
                        {sec.fullDetails.map((detail, dIdx) => (
                          <p key={dIdx} className="list-item list-inside">
                            {detail}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Contact Card */}
          <div className="ei-card relative mt-12 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300 mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Questions about our Terms?</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
              We are committed to clear and transparent communication. If you have any questions, feel free to contact our team.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-white/80">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
                <strong>Email:</strong> seedpassion@gmail.com
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
                <strong>Company:</strong> PassionSeed Company Limited
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
                <strong>Location:</strong> Phuket, Thailand
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/"
                className="ei-button-dawn flex items-center gap-2 px-8 py-3 text-sm font-semibold"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}