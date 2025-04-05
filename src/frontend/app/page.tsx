import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletConnect } from "@/components/wallet-connect"
import { VideoSession } from "@/components/video-session"
import { MentorshipCard } from "@/components/mentorship-card"
import { BookOpen, Calendar, Compass, Lightbulb, Users, Sparkles, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "SkillSwap - Decentralized Skill-sharing Platform",
  description: "A decentralized skill-sharing and mentorship platform powered by blockchain technology",
}

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-primary-50 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary-200/20 to-transparent opacity-70"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400"></div>
        <div className="container px-4 md:px-6 relative">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary-100 text-primary-900">
                <Sparkles className="mr-1 h-3 w-3" /> Blockchain-powered learning
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-primary-700 via-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Share Skills, Grow Together
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A decentralized platform for skill-sharing and mentorship powered by blockchain technology.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/mentors">
                  <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white">
                    Find a Mentor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register-mentor">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-200 text-primary-700 hover:bg-primary-50"
                  >
                    Become a Mentor
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mr-0 flex items-center justify-center">
              <div className="rounded-lg overflow-hidden border bg-background p-2 shadow-xl relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg blur opacity-20"></div>
                <div className="relative grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2">
                    <div className="rounded-md bg-primary-50 p-4 h-24 flex items-center justify-center group hover:bg-primary-100 transition-colors">
                      <BookOpen className="h-10 w-10 text-primary-500 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div className="rounded-md bg-secondary-50 p-4 h-24 flex items-center justify-center group hover:bg-secondary-100 transition-colors">
                      <Calendar className="h-10 w-10 text-secondary-500 group-hover:text-secondary-600 transition-colors" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="rounded-md bg-accent-50 p-4 h-24 flex items-center justify-center group hover:bg-accent-100 transition-colors">
                      <Users className="h-10 w-10 text-accent-500 group-hover:text-accent-600 transition-colors" />
                    </div>
                    <div className="rounded-md bg-primary-50 p-4 h-24 flex items-center justify-center group hover:bg-primary-100 transition-colors">
                      <Compass className="h-10 w-10 text-primary-500 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary-100 text-secondary-900 mb-2">
              <CheckCircle className="mr-1 h-3 w-3" /> Seamless Integration
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
                Platform Features
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Explore the key features of our decentralized skill-sharing platform
              </p>
            </div>
          </div>
          <Tabs defaultValue="wallet" className="mt-12">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
              <TabsTrigger
                value="wallet"
                className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
              >
                Web3 Wallet Integration
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
              >
                Video Session Interface
              </TabsTrigger>
            </TabsList>
            <TabsContent value="wallet" className="p-4">
              <Card className="border-primary-100 shadow-md overflow-hidden">
                <div className="absolute h-1 top-0 left-0 right-0 bg-gradient-to-r from-primary-400 to-primary-600"></div>
                <CardHeader className="bg-primary-50/50">
                  <CardTitle className="text-primary-700">Web3 Wallet Integration</CardTitle>
                  <CardDescription>Connect your wallet to access decentralized features</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <WalletConnect showDetails />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="video" className="p-4">
              <Card className="border-secondary-100 shadow-md overflow-hidden">
                <div className="absolute h-1 top-0 left-0 right-0 bg-gradient-to-r from-secondary-400 to-secondary-600"></div>
                <CardHeader className="bg-secondary-50/50">
                  <CardTitle className="text-secondary-700">Video Session Interface</CardTitle>
                  <CardDescription>High-quality video mentorship sessions with screen sharing</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <VideoSession />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-primary-50/30 relative">
        <div className="absolute inset-0 bg-grid-primary-900/5 [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-accent-100 text-accent-900 mb-2">
              <Users className="mr-1 h-3 w-3" /> Expert Guidance
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl bg-gradient-to-r from-primary-700 to-accent-600 bg-clip-text text-transparent">
                Available Mentors
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Connect with skilled mentors in various domains
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <MentorshipCard
              name="Alex Johnson"
              skills={["Blockchain Development", "Smart Contracts", "Solidity"]}
              rate="0.05 ETH/hour"
              rating={4.8}
              image="/placeholder.svg?height=300&width=300"
            />
            <MentorshipCard
              name="Sarah Chen"
              skills={["UI/UX Design", "Web3 Interfaces", "User Research"]}
              rate="0.04 ETH/hour"
              rating={4.9}
              image="/placeholder.svg?height=300&width=300"
            />
            <MentorshipCard
              name="Michael Rodriguez"
              skills={["DeFi Protocols", "Tokenomics", "Market Analysis"]}
              rate="0.06 ETH/hour"
              rating={4.7}
              image="/placeholder.svg?height=300&width=300"
            />
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/mentors">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white">
                View All Mentors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

