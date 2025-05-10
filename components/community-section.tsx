import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CommunitySection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-violet-900 to-purple-950">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-red-600 px-3 py-1 text-sm text-white">
              Community
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
              Grow Together
            </h2>
            <p className="max-w-[600px] text-white md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join a supportive community of passionate individuals who are
              committed to personal growth and helping others.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="https://discord.gg/Qw2UpDDGeZ">
                  Join Our Community
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="text-white border-white hover:bg-white/10"
              >
                <Link href="/workshops">Browse Workshops</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              <div className="flex flex-col gap-4">
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 text-white">
                  <p className="text-lg font-medium">
                    "Passion Seed helped me discover my love for digital art and
                    connect with amazing mentors."
                  </p>
                  <p className="mt-2 text-sm">- Alex P.</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 text-white">
                  <p className="text-lg font-medium">
                    "The workshops are incredible. I've learned so much in just
                    a few months!"
                  </p>
                  <p className="mt-2 text-sm">- Jamie L.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-8">
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 text-white">
                  <p className="text-lg font-medium">
                    "I found my community here. It's been transformative for my
                    personal growth."
                  </p>
                  <p className="mt-2 text-sm">- Taylor R.</p>
                </div>
                <div className="rounded-xl bg-white/10 backdrop-blur-sm p-6 text-white">
                  <p className="text-lg font-medium">
                    "The emotional skills tracking has helped me understand
                    myself better."
                  </p>
                  <p className="mt-2 text-sm">- Morgan K.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
