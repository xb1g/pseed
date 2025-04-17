import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Building, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function WorkshopCategories() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-purple-950 to-violet-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">Workshop Categories</h2>
            <p className="max-w-[900px] text-white md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Explore our workshops designed to help you at every stage of your passion journey.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 mt-12">
          <Card className="bg-white/10 backdrop-blur-sm border-none text-white">
            <CardHeader>
              <Lightbulb className="h-10 w-10 text-yellow-400" />
              <CardTitle>PassionSeed (Inspire)</CardTitle>
              <CardDescription className="text-white/80">Discover and ignite your passions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Workshops designed to help you identify your interests and discover new passions.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Passion Discovery Workshop</li>
                <li>Finding Your Purpose</li>
                <li>Interest Exploration</li>
              </ul>
              <Button asChild className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700">
                <Link href="/workshops?category=inspire">Explore Inspire Workshops</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-none text-white">
            <CardHeader>
              <Building className="h-10 w-10 text-orange-400" />
              <CardTitle>Passion Growth (Build)</CardTitle>
              <CardDescription className="text-white/80">Develop and strengthen your skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Workshops focused on building skills and developing expertise in your chosen areas.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Skill Development Intensive</li>
                <li>Mastery Pathways</li>
                <li>Practical Application</li>
              </ul>
              <Button asChild className="w-full mt-4 bg-orange-600 hover:bg-orange-700">
                <Link href="/workshops?category=build">Explore Build Workshops</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-none text-white">
            <CardHeader>
              <Network className="h-10 w-10 text-red-400" />
              <CardTitle>Passion Scale (Connect)</CardTitle>
              <CardDescription className="text-white/80">Connect and scale your impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Workshops that help you connect with others and scale the impact of your passions.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Community Building</li>
                <li>Networking Strategies</li>
                <li>Impact Amplification</li>
              </ul>
              <Button asChild className="w-full mt-4 bg-red-600 hover:bg-red-700">
                <Link href="/workshops?category=scale">Explore Scale Workshops</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
