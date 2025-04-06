"use client"

import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/lib/web3-context"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { Lightbulb, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Set initial value
    checkMobile()
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SkillSwap - Decentralized Skill-sharing Platform</title>
        <meta
          name="description"
          content="A decentralized skill-sharing and mentorship platform powered by blockchain technology"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Web3Provider>
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 h-16">
                {isMobile ? (
                  // Mobile header
                  <div className="flex items-center justify-between h-full">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Menu className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[280px]">
                        <div className="flex flex-col gap-4 py-4">
                          <Link 
                            href="/" 
                            className="flex items-center gap-2 font-bold text-xl px-4"
                          >
                            <Lightbulb className="h-5 w-5 text-primary-600" />
                            <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                              SkillSwap
                            </span>
                          </Link>
                          
                          <nav className="flex flex-col gap-1 px-2">
                            <Link 
                              href="/explore" 
                              className="flex items-center h-10 px-4 py-2 text-sm rounded-md hover:bg-accent"
                            >
                              Explore
                            </Link>
                            <Link 
                              href="/sessions" 
                              className="flex items-center h-10 px-4 py-2 text-sm rounded-md hover:bg-accent"
                            >
                              My Sessions
                            </Link>
                            <Link 
                              href="/mentors" 
                              className="flex items-center h-10 px-4 py-2 text-sm rounded-md hover:bg-accent"
                            >
                              Mentors
                            </Link>
                            <Link 
                              href="/about" 
                              className="flex items-center h-10 px-4 py-2 text-sm rounded-md hover:bg-accent"
                            >
                              About
                            </Link>
                          </nav>
                          
                          <div className="px-4 mt-4">
                            <WalletConnect />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                    
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                      <Lightbulb className="h-5 w-5 text-primary-600" />
                      <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                        SkillSwap
                      </span>
                    </Link>
                    
                    <div></div> {/* Empty div for flex spacing */}
                  </div>
                ) : (
                  // Desktop header
                  <div className="flex items-center justify-between h-full">
                    <div className="flex items-center space-x-12">
                      {/* Logo */}
                      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <Lightbulb className="h-5 w-5 text-primary-600" />
                        <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                          SkillSwap
                        </span>
                      </Link>
                      
                      {/* Navigation links */}
                      <nav className="flex items-center space-x-6">
                        <Link 
                          href="/explore" 
                          className="text-sm font-medium hover:text-primary-600 transition-colors"
                        >
                          Explore
                        </Link>
                        <Link 
                          href="/sessions" 
                          className="text-sm font-medium hover:text-primary-600 transition-colors"
                        >
                          My Sessions
                        </Link>
                        <Link 
                          href="/mentors" 
                          className="text-sm font-medium hover:text-primary-600 transition-colors"
                        >
                          Mentors
                        </Link>
                        <Link 
                          href="/about" 
                          className="text-sm font-medium hover:text-primary-600 transition-colors"
                        >
                          About
                        </Link>
                      </nav>
                    </div>
                    
                    {/* Wallet connect */}
                    <WalletConnect />
                  </div>
                )}
              </div>
            </header>
            
            {/* Main content */}
            {children}
            
            {/* Footer */}
            <footer className="border-t py-6 md:py-0 bg-gradient-to-b from-background to-primary-50/20">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © 2025 <span className="font-medium text-primary-600">SkillSwap</span>. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link href="/terms" className="hover:text-primary-600 transition-colors">
                    Terms
                  </Link>
                  <Link href="/privacy" className="hover:text-primary-600 transition-colors">
                    Privacy
                  </Link>
                  <Link href="/about" className="hover:text-primary-600 transition-colors">
                    Contact
                  </Link>
                </div>
              </div>
            </footer>
            
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
