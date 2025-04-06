"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Mic, MicOff, Video, VideoOff, ScreenShare, X, PhoneOff, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { v4 as uuidv4 } from "uuid"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  isSelf: boolean
}

interface SimpleVideoSessionProps {
  sessionId?: string
  onSessionEnd?: () => void
}

export function SimpleVideoSession({ sessionId = "mock-session", onSessionEnd }: SimpleVideoSessionProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("video")
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true)
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true)
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false)
  const [newMessage, setNewMessage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "system-1",
      sender: "System",
      content: "Welcome to the video session. You can chat with other participants here.",
      timestamp: new Date(),
      isSelf: false
    }
  ])
  const [participants] = useState<{ name: string, role: string }[]>([
    { name: "You", role: "Mentor" },
    { name: "Demo User", role: "Mentee" }
  ])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  
  // Initialize local stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast({
            title: "Browser not supported",
            description: "Your browser doesn't support camera/microphone access.",
            variant: "destructive",
          })
          return
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: isAudioOn
        })
        
        setLocalStream(stream)
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        
        toast({
          title: "Development Mode",
          description: "Camera/microphone connected. This is a demo without backend connection.",
        })
      } catch (error: any) {
        console.error("Error accessing media devices:", error)
        toast({
          title: "Camera/Microphone Error",
          description: error.message || "Could not access camera or microphone",
          variant: "destructive",
        })
      }
    }
    
    initLocalStream()
    
    // Clean up
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])
  
  // Toggle video
  const toggleVideo = () => {
    setIsVideoOn(prev => {
      const newValue = !prev
      
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = newValue
        })
      }
      
      return newValue
    })
  }
  
  // Toggle audio
  const toggleAudio = () => {
    setIsAudioOn(prev => {
      const newValue = !prev
      
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = newValue
        })
      }
      
      return newValue
    })
  }
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        })
        
        // Replace video track
        if (localStream && localVideoRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0]
          
          const sender = localStream.getVideoTracks()[0]
          if (sender) {
            sender.stop()
          }
          
          localStream.removeTrack(sender)
          localStream.addTrack(videoTrack)
          
          localVideoRef.current.srcObject = localStream
        }
        
        setIsScreenSharing(true)
        
        // Add message
        addSystemMessage("Screen sharing started")
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          handleStopScreenSharing()
        }
      } else {
        handleStopScreenSharing()
      }
    } catch (error: any) {
      console.error("Error during screen sharing:", error)
      toast({
        title: "Screen Sharing Error",
        description: error.message || "Could not share screen",
        variant: "destructive",
      })
    }
  }
  
  // Handle stopping screen share
  const handleStopScreenSharing = async () => {
    try {
      // Restart camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isAudioOn
      })
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream
      }
      
      // Update local stream
      setLocalStream(newStream)
      setIsScreenSharing(false)
      
      // Add message
      addSystemMessage("Screen sharing stopped")
    } catch (error) {
      console.error("Error stopping screen share:", error)
    }
  }
  
  // End call
  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    
    // Clean up
    setLocalStream(null)
    
    // Add message
    addSystemMessage("Call ended")
    
    toast({
      title: "Call Ended",
      description: "You have left the video session",
    })
    
    // Notify parent component
    if (onSessionEnd) {
      onSessionEnd()
    }
  }
  
  // Add system message
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      sender: "System",
      content,
      timestamp: new Date(),
      isSelf: false
    }
    
    setMessages(prev => [...prev, systemMessage])
  }
  
  // Send message
  const sendMessage = () => {
    if (newMessage.trim() === "") return
    
    // Add message to chat
    const message: Message = {
      id: uuidv4(),
      sender: "You",
      content: newMessage,
      timestamp: new Date(),
      isSelf: true
    }
    
    setMessages(prev => [...prev, message])
    setNewMessage("")
    
    // Simulate a response after a brief delay
    setTimeout(() => {
      const responseMessage: Message = {
        id: uuidv4(),
        sender: "Demo User",
        content: `Reply to: ${newMessage}`,
        timestamp: new Date(),
        isSelf: false
      }
      
      setMessages(prev => [...prev, responseMessage])
    }, 1500)
  }
  
  // Handle key press in message input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  return (
    <div className="flex flex-col h-[600px] overflow-hidden rounded-lg border">
      {/* Header with tabs */}
      <div className="border-b p-3 bg-muted/40">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <TabsContent value="video" className="h-full m-0 p-0 data-[state=active]:flex flex-col">
          {/* Video grid */}
          <div className="flex-1 p-2 grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto">
            {/* Local video */}
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                You {isScreenSharing ? "(Screen)" : ""}
              </div>
            </div>
            
            {/* Remote video placeholder */}
            <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback>DU</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                Demo User (Not Connected)
              </div>
            </div>
          </div>
          
          {/* Video controls */}
          <div className="p-3 bg-muted/20 border-t flex justify-center">
            <div className="flex items-center space-x-2">
              <Button 
                variant={isAudioOn ? "default" : "destructive"}
                size="icon"
                onClick={toggleAudio}
                title={isAudioOn ? "Mute" : "Unmute"}
              >
                {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant={isVideoOn ? "default" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                title={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant={isScreenSharing ? "destructive" : "default"}
                size="icon"
                onClick={toggleScreenSharing}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <X className="h-4 w-4" /> : <ScreenShare className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="destructive"
                size="icon"
                onClick={endCall}
                title="End call"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="chat" className="h-full m-0 p-0 data-[state=active]:flex flex-col">
          {/* Participants */}
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm">Participants ({participants.length})</h3>
            <div className="mt-2 space-y-2">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">({participant.role})</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat messages */}
          <ScrollArea className="flex-1 p-3" ref={chatScrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.sender === 'System' 
                      ? 'bg-muted text-center w-full py-1 text-xs text-muted-foreground'
                      : message.isSelf 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                  } rounded-lg p-2`}>
                    {message.sender !== 'System' && (
                      <div className="font-medium text-xs mb-1">
                        {message.sender}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Message input */}
          <Card className="m-3 mt-0">
            <CardContent className="p-2">
              <div className="flex">
                <Input
                  className="flex-1"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  className="ml-2"
                  size="icon"
                  onClick={sendMessage}
                  disabled={newMessage.trim() === ''}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </div>
  )
} 