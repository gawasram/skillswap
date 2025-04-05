"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Settings,
  Phone,
  RepeatIcon as Record,
  Send,
  Download,
  User,
} from "lucide-react"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
}

export function VideoSession() {
  // Video states
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [quality, setQuality] = useState(720)
  const [volume, setVolume] = useState(80)

  // Chat states
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const screenShareRef = useRef<HTMLVideoElement>(null)

  // Mock function to toggle connection
  const toggleConnection = () => {
    if (isConnected) {
      setIsConnected(false)
      stopLocalStream()
    } else {
      setIsConnected(true)
      startLocalStream()
    }
  }

  // Mock function to start local video stream
  const startLocalStream = () => {
    if (localVideoRef.current) {
      // In a real implementation, this would use navigator.mediaDevices.getUserMedia
      // For this demo, we'll use a placeholder video
      localVideoRef.current.src = "/placeholder.svg?height=480&width=640"
      localVideoRef.current.play().catch((e) => console.error("Error playing video:", e))
    }

    if (remoteVideoRef.current) {
      // Simulate remote video
      remoteVideoRef.current.src = "/placeholder.svg?height=480&width=640"
      remoteVideoRef.current.play().catch((e) => console.error("Error playing video:", e))
    }
  }

  // Mock function to stop local stream
  const stopLocalStream = () => {
    if (localVideoRef.current) {
      localVideoRef.current.pause()
      localVideoRef.current.src = ""
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause()
      remoteVideoRef.current.src = ""
    }

    if (isScreenSharing) {
      stopScreenSharing()
    }
  }

  // Mock function to toggle video
  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
    if (localVideoRef.current) {
      localVideoRef.current.style.display = isVideoOn ? "none" : "block"
    }
  }

  // Mock function to toggle audio
  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
  }

  // Mock function to toggle screen sharing
  const toggleScreenSharing = () => {
    if (isScreenSharing) {
      stopScreenSharing()
    } else {
      startScreenSharing()
    }
  }

  // Mock function to start screen sharing
  const startScreenSharing = () => {
    setIsScreenSharing(true)
    if (screenShareRef.current) {
      screenShareRef.current.src = "/placeholder.svg?height=480&width=640"
      screenShareRef.current.style.display = "block"
      screenShareRef.current.play().catch((e) => console.error("Error playing video:", e))
    }
  }

  // Mock function to stop screen sharing
  const stopScreenSharing = () => {
    setIsScreenSharing(false)
    if (screenShareRef.current) {
      screenShareRef.current.pause()
      screenShareRef.current.src = ""
      screenShareRef.current.style.display = "none"
    }
  }

  // Mock function to toggle recording
  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  // Mock function to send a chat message
  const sendMessage = () => {
    if (newMessage.trim() === "") return

    const message: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: newMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, message])
    setNewMessage("")

    // Simulate a response after a delay
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: "Mentor",
        content: "Thanks for your message! Let me explain this concept further...",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, response])
    }, 2000)
  }

  // Mock function to download recording
  const downloadRecording = () => {
    alert("Recording downloaded!")
    setIsRecording(false)
  }

  // Add some initial messages for demo
  useEffect(() => {
    setMessages([
      {
        id: "1",
        sender: "Mentor",
        content: "Welcome to our mentorship session! How can I help you today?",
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: "2",
        sender: "You",
        content: "I'm having trouble understanding how to implement Web3 wallet connections. Can you help?",
        timestamp: new Date(Date.now() - 240000),
      },
      {
        id: "3",
        sender: "Mentor",
        content: "Let's start by going through the basic concepts and then I'll show you some code examples.",
        timestamp: new Date(Date.now() - 180000),
      },
    ])
  }, [])

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            {isConnected ? (
              <>
                {isScreenSharing ? (
                  <video ref={screenShareRef} className="w-full h-full object-cover" muted />
                ) : (
                  <video ref={remoteVideoRef} className="w-full h-full object-cover" muted={!isAudioOn} />
                )}
                <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-background bg-muted">
                  <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    muted
                    style={{ display: isVideoOn ? "block" : "none" }}
                  />
                  {!isVideoOn && (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm">
                    <Record className="h-4 w-4 animate-pulse" />
                    <span>Recording</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Video className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Video session not connected</p>
                <Button className="mt-4" onClick={toggleConnection}>
                  Start Session
                </Button>
              </div>
            )}
          </div>

          {isConnected && (
            <div className="flex items-center justify-center gap-2">
              <Button variant={isAudioOn ? "default" : "outline"} size="icon" onClick={toggleAudio}>
                {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button variant={isVideoOn ? "default" : "outline"} size="icon" onClick={toggleVideo}>
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button variant={isScreenSharing ? "default" : "outline"} size="icon" onClick={toggleScreenSharing}>
                <ScreenShare className="h-4 w-4" />
              </Button>
              <Button variant={isRecording ? "destructive" : "outline"} size="icon" onClick={toggleRecording}>
                <Record className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={toggleConnection}>
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <Tabs defaultValue="chat">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="border rounded-md p-4">
              <div className="flex flex-col h-[300px]">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex flex-col ${message.sender === "You" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`px-3 py-2 rounded-lg max-w-[80%] ${
                            message.sender === "You" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {message.sender} •{" "}
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex items-center gap-2 mt-4">
                  <Textarea
                    placeholder="Type your message..."
                    className="min-h-[40px] resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button size="icon" onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="border rounded-md p-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Video Quality</h4>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[quality]}
                      min={360}
                      max={1080}
                      step={360}
                      onValueChange={(value) => setQuality(value[0])}
                    />
                    <span className="min-w-[60px] text-right">{quality}p</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Volume</h4>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={10}
                      onValueChange={(value) => setVolume(value[0])}
                    />
                    <span className="min-w-[60px] text-right">{volume}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Recording</h4>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="auto-record" />
                      <Label htmlFor="auto-record">Auto-record sessions</Label>
                    </div>
                    {isRecording && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={downloadRecording}>
                        <Download className="h-4 w-4" />
                        Download Recording
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Background</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="h-20">
                      None
                    </Button>
                    <Button variant="outline" size="sm" className="h-20">
                      Blur
                    </Button>
                    <Button variant="outline" size="sm" className="h-20">
                      Virtual
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

