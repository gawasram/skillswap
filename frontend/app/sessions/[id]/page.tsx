"use client"

import { useParams } from "next/navigation"
import { SessionVideoChat } from "@/components/session-video-chat"
import { Calendar, Video, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.id as string
  
  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Video className="mr-2 h-8 w-8 text-primary" />
            Session Room
          </h1>
          <p className="text-muted-foreground">
            Connect via video for your mentorship session
          </p>
        </div>
        
        <SessionVideoChat 
          sessionId={sessionId} 
          onSessionEnd={() => window.location.href = "/sessions"}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Session Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Before Starting</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Test your camera and microphone</li>
                  <li>Find a quiet place with good internet connection</li>
                  <li>Have any necessary materials or code ready</li>
                  <li>Set clear goals for the session</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">During the Session</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Be respectful and professional</li>
                  <li>Ask questions when you don't understand</li>
                  <li>Take notes on important points</li>
                  <li>Share your screen when demonstrating code or concepts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Session Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Video & Audio</h3>
                <p className="text-sm text-muted-foreground">
                  You can mute your microphone or turn off your camera at any time using the buttons below the video.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Screen Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Click the screen share button to share your entire screen, an application window, or a browser tab.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Mentors can record sessions for later review. Recordings are accessible to both parties after completion.
                </p>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" onClick={() => window.open("https://support.skillswap.xyz/video-guide", "_blank")}>
                  View Video Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 