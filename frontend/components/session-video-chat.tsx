"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { VideoSession } from "@/components/video-session"
import { SimpleVideoSession } from "@/components/simple-video-session"
import { useWeb3 } from "@/lib/web3-context"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SessionVideoChatProps {
  sessionId: string
  onSessionEnd?: () => void
}

// Add a mock session data for development
const getMockSessionData = (sessionId: string) => {
  return {
    id: sessionId,
    topic: "Mock Development Session",
    status: "accepted",
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // 1 hour later
    meetingLink: "https://mock-meeting-link.com",
    mentor: {
      name: "Mock Mentor",
      walletAddress: "0xMockMentor123"
    },
    mentee: {
      name: "Mock Mentee",
      walletAddress: "0xMockMentee456"
    }
  };
};

export function SessionVideoChat({ sessionId, onSessionEnd }: SessionVideoChatProps) {
  const { toast } = useToast()
  const { walletStatus, walletAddress } = useWeb3()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [isMentor, setIsMentor] = useState(false)
  const [useSimpleMode, setUseSimpleMode] = useState(false)
  
  // Fetch session data
  const fetchSessionData = useCallback(async () => {
    if (!sessionId || !walletAddress) return
    
    try {
      setLoading(true)
      setError(null)
      
      try {
        // In a real implementation, this would fetch from your backend API
        const response = await fetch(`/api/sessions/${sessionId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to load session: ${response.statusText}`)
        }
        
        const data = await response.json()
        setSessionData(data.data)
        
        // Determine if current user is mentor
        setIsMentor(data.data.mentor.walletAddress.toLowerCase() === walletAddress.toLowerCase())
      } catch (error: any) {
        console.error("Error fetching session data:", error)
        console.log("Using mock session data for development")
        
        // Use mock data if backend is not available
        const mockData = getMockSessionData(sessionId)
        setSessionData(mockData)
        setIsMentor(true) // Default to mentor for development
        
        // Set simple mode flag when backend is unavailable
        setUseSimpleMode(true)
        
        toast({
          title: "Development Mode",
          description: "Using simplified video interface. Backend server not available.",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error("Error in fetch flow:", error)
      setError(error.message || "Failed to load session data")
      toast({
        title: "Error loading session",
        description: error.message || "Could not load session data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [sessionId, walletAddress, toast])
  
  // Load session data on mount
  useEffect(() => {
    fetchSessionData()
  }, [fetchSessionData])
  
  // Handle session end
  const handleSessionEnd = () => {
    // In a real app, you might want to update session status here
    if (onSessionEnd) {
      onSessionEnd()
    }
    
    toast({
      title: "Session ended",
      description: "The video session has ended",
    })
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-[400px]" />
      </div>
    )
  }
  
  // Show error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  // If no session data, show placeholder
  if (!sessionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Session Data</CardTitle>
          <CardDescription>
            The requested session could not be found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = "/sessions"}>
            Back to Sessions
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{sessionData.topic}</CardTitle>
          <CardDescription>
            Session with {isMentor ? sessionData.mentee.name : sessionData.mentor.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {useSimpleMode ? (
            // Use the simplified video session component when backend is unavailable
            <SimpleVideoSession 
              sessionId={sessionId} 
              onSessionEnd={handleSessionEnd}
            />
          ) : (
            // Use the full featured component with backend connection
            <VideoSession 
              sessionId={sessionId} 
              initialMeetingLink={sessionData.meetingLink} 
              isMentor={isMentor}
              onSessionEnd={handleSessionEnd}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 