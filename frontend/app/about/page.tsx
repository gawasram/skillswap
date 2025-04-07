"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Briefcase, Users, Lightbulb, Shield, Award, Code, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Info className="mr-2 h-8 w-8 text-primary" />
            About SkillSwap
          </h1>
          <p className="text-muted-foreground">
            A decentralized peer-to-peer skill sharing and mentorship platform
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Mission Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-6 w-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                SkillSwap is built on the belief that everyone has valuable skills to share and knowledge to gain. 
                Our mission is to create a decentralized ecosystem where individuals can connect directly, 
                exchange knowledge, and grow together without intermediaries.
              </p>
              <p>
                We're leveraging blockchain technology to build a transparent, secure, and fair platform 
                that rewards both mentors and mentees, while ensuring quality interactions and protecting 
                the interests of all participants.
              </p>
            </CardContent>
          </Card>
          
          {/* How It Works Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-6 w-6 text-primary" />
                How SkillSwap Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mentors">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mentors">For Mentors</TabsTrigger>
                  <TabsTrigger value="mentees">For Mentees</TabsTrigger>
                </TabsList>
                <TabsContent value="mentors" className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">Share Your Expertise</h3>
                  <ol className="space-y-4 list-decimal list-inside">
                    <li className="pl-2">
                      <span className="font-medium">Register as a Mentor</span> - Connect your wallet and create a profile highlighting your skills, experience, and hourly rate.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Accept Session Requests</span> - Review and accept session requests from mentees interested in your expertise.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Conduct Sessions</span> - Share your knowledge through video calls, screen sharing, or text-based mentoring.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Receive Payment</span> - Get paid in ROXN tokens directly to your wallet once sessions are completed.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Build Reputation</span> - Earn ratings and reviews to enhance your profile and attract more mentees.
                    </li>
                  </ol>
                  <div className="pt-4">
                    <Button onClick={() => window.location.href = "/register-mentor"}>
                      Become a Mentor
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="mentees" className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">Learn New Skills</h3>
                  <ol className="space-y-4 list-decimal list-inside">
                    <li className="pl-2">
                      <span className="font-medium">Connect Your Wallet</span> - Start by connecting your wallet to the platform.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Find a Mentor</span> - Browse through our directory of mentors filtered by skills, ratings, and hourly rates.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Request a Session</span> - Send a session request specifying your learning goals and preferred duration.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Fund the Session</span> - Once your request is accepted, fund the session with ROXN tokens to secure your spot.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Learn and Grow</span> - Attend the session, ask questions, and gain valuable insights directly from an expert.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Rate your Experience</span> - After the session, provide feedback and rate your mentor to help others find great teachers.
                    </li>
                  </ol>
                  <div className="pt-4">
                    <Button onClick={() => window.location.href = "/mentors"}>
                      Find a Mentor
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Tech Stack Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2 h-6 w-6 text-primary" />
                Our Technology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                SkillSwap is built on cutting-edge blockchain technology to ensure transparency, 
                security, and true ownership of your data and earnings.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-primary" />
                    XDC Network
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Built on the XDC Network for fast, low-cost transactions with enterprise-grade security.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Shield className="mr-2 h-4 w-4 text-primary" />
                    Smart Contracts
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Secure smart contracts manage session payments, escrow, and reputation systems.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Award className="mr-2 h-4 w-4 text-primary" />
                    ROXN Token
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our platform token facilitates payments and rewards active participants in the ecosystem.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Team Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                Meet the Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Alex Rivera",
                    role: "Founder & Lead Developer",
                    bio: "Blockchain enthusiast with 8+ years of development experience across multiple platforms.",
                  },
                  {
                    name: "Priya Sharma",
                    role: "Smart Contract Engineer",
                    bio: "Solidity expert focused on creating secure, efficient decentralized applications.",
                  },
                  {
                    name: "Marcus Chen",
                    role: "UI/UX Designer",
                    bio: "Dedicated to creating intuitive, accessible interfaces for web3 applications.",
                  }
                ].map((member, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-4">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <span className="text-xl font-bold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-primary">{member.role}</p>
                    <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We'd love to hear from you! Whether you have questions about using the platform,
                feature suggestions, or are interested in partnering with us, reach out through
                any of these channels:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="https://discord.gg/skillswap" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.39-.444.885-.608 1.283a18.28 18.28 0 0 0-5.488 0c-.164-.398-.397-.893-.608-1.283a.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515a.07.07 0 0 0-.032.028C.533 9.046-.32 13.58.099 18.06a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.296 1.226-1.994a.076.076 0 0 0-.042-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.127c.126-.095.252-.193.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.892a.077.077 0 0 0-.041.106c.36.698.772 1.363 1.225 1.994a.076.076 0 0 0 .084.028 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Discord Community</h4>
                    <p className="text-sm text-muted-foreground">Join our active community</p>
                  </div>
                </a>
                
                <a 
                  href="mailto:team@skillswap.xyz" 
                  className="flex items-center p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <p className="text-sm text-muted-foreground">team@skillswap.xyz</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 