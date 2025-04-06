"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
  PhoneOff,
  RepeatIcon as Record,
  StopCircle,
  Send,
  Download,
  User,
  MessageSquare,
  CheckCircle2,
  X,
  MenuIcon,
  Videotape,
  Volume2,
  VolumeX,
  AlertCircle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WebRTCService } from "@/lib/webrtc-service"
import { MockWebRTCService } from "./mock-webrtc-service"
import { useWeb3 } from "@/lib/web3-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { v4 as uuidv4 } from "uuid"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  isSelf: boolean
}

interface VideoSessionProps {
  sessionId?: string
  initialMeetingLink?: string
  isMentor?: boolean
  onSessionEnd?: () => void
}

export function VideoSession({
  sessionId,
  initialMeetingLink,
  isMentor = false,
  onSessionEnd,
}: VideoSessionProps) {
  const { toast } = useToast()
  const { walletAddress } = useWeb3()
  
  // Video states
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<string>("disconnected")
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium")
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [activeTab, setActiveTab] = useState("video")
  const [showSettings, setShowSettings] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  // Chat states
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  
  // Remote participants
  const [remoteStreams, setRemoteStreams] = useState<{[userId: string]: MediaStream}>({})
  const [participants, setParticipants] = useState<{[userId: string]: {username: string, role: string}}>({})
  
  // Meeting link
  const [meetingLink, setMeetingLink] = useState(initialMeetingLink || "")
  
  // WebRTC service
  const webRTCServiceRef = useRef<WebRTCService | null>(null)

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const screenShareRef = useRef<HTMLVideoElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Quality map for display
  const qualityMap = {
    low: "360p",
    medium: "720p",
    high: "1080p"
  };

  // Quality slider value conversion
  const handleQualityChange = (value: number[]) => {
    const qualityValue = value[0];
    if (qualityValue <= 360) {
      changeQuality("low");
    } else if (qualityValue <= 720) {
      changeQuality("medium");
    } else {
      changeQuality("high");
    }
  };

  // WebRTC compatibility check
  const [isWebRTCSupported, setIsWebRTCSupported] = useState<boolean | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        // Check if WebRTC is supported
        if (typeof navigator === 'undefined' || 
            typeof navigator.mediaDevices === 'undefined' || 
            typeof navigator.mediaDevices.getUserMedia !== 'function' ||
            typeof window.RTCPeerConnection !== 'function') {
          setIsWebRTCSupported(false);
          toast({
            title: "WebRTC Not Supported",
            description: "Your browser doesn't support WebRTC. Please use Chrome, Firefox, or Edge.",
            variant: "destructive",
          });
          return;
        }
        
        setIsWebRTCSupported(true);
        
        try {
          // Try to use the real WebRTC service first
          webRTCServiceRef.current = new WebRTCService();
          console.log("Real WebRTC service initialized");
        } catch (error) {
          console.error("Failed to initialize WebRTC service:", error);
          console.log("Using mock WebRTC service for development");
          
          // Fallback to mock service if the real one fails (likely because backend is not running)
          webRTCServiceRef.current = new MockWebRTCService();
          
          toast({
            title: "Development Mode",
            description: "Using mock WebRTC service. Backend server not available.",
            variant: "default",
          });
        }
        
        // Set up event listeners
        if (webRTCServiceRef.current) {
          webRTCServiceRef.current.onConnectionStateChange((state) => {
            setConnectionState(state);
          });
          
          webRTCServiceRef.current.onUserJoined((userId, username) => {
            addParticipant({ id: userId, name: username });
            addSystemMessage(`${username} joined the session`);
          });
          
          webRTCServiceRef.current.onUserLeft((userId) => {
            const participant = participants.find(p => p.id === userId);
            if (participant) {
              addSystemMessage(`${participant.name} left the session`);
              removeParticipant(userId);
            }
          });
          
          webRTCServiceRef.current.onMessage((data) => {
            addMessage({
              id: uuidv4(),
              sender: data.sender,
              content: data.message,
              timestamp: new Date(),
              isSelf: false
            });
          });
          
          webRTCServiceRef.current.onRemoteStream((stream, userId) => {
            console.log(`Received remote stream from user ${userId}`);
            setRemoteStreams(prev => ({
              ...prev,
              [userId]: stream
            }));
          });
          
          webRTCServiceRef.current.onRecordingStarted(() => {
            setIsRecording(true);
            addSystemMessage("Recording started");
          });
          
          webRTCServiceRef.current.onRecordingStopped(() => {
            setIsRecording(false);
            addSystemMessage("Recording stopped");
          });
        }
      } catch (error) {
        console.error("Error initializing WebRTC:", error);
        toast({
          title: "WebRTC Error",
          description: "Failed to initialize WebRTC service.",
          variant: "destructive",
        });
      }
    };
    
    initWebRTC();
    
    // Clean up on unmount
    return () => {
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.disconnect();
      }
    };
  }, [toast]);
  
  // Connect to session
  const connectToSession = useCallback(async () => {
    if (!sessionId || !walletAddress) return
    
    try {
      // Check browser permissions first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (permissionError: any) {
        if (permissionError.name === 'NotAllowedError') {
          throw new Error('Camera and microphone access denied. Please allow access to use the video chat.');
        } else if (permissionError.name === 'NotFoundError') {
          throw new Error('No camera or microphone found. Please connect these devices and try again.');
        }
        throw permissionError;
      }
      
      // In a real app, you would need to:
      // 1. Get a session token from your backend
      // 2. Use that token to connect to the signaling server
      const token = "demo-token" // This would come from your auth system
      
      // Connect to signaling server
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.connect(sessionId, token)
        
        // Start local stream
        const localStream = await webRTCServiceRef.current.startLocalStream(isVideoOn, isAudioOn)
        
        // Attach local stream to video element
    if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
        
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Error connecting to session:", error)
      toast({
        title: "Connection failed",
        description: "Could not connect to the video session",
        variant: "destructive",
      })
    }
  }, [sessionId, walletAddress, isVideoOn, isAudioOn, toast])
  
  // Disconnect from session
  const disconnectFromSession = useCallback(() => {
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.disconnect()
      
      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = null
      }
      
      setIsConnected(false)
      setIsScreenSharing(false)
      setRemoteStreams({})
      setParticipants({})
      
      // Call onSessionEnd callback if provided
      if (onSessionEnd) {
        onSessionEnd()
      }
    }
  }, [onSessionEnd])
  
  // Toggle video
  const toggleVideo = () => {
    setIsVideoOn((prev) => {
      const newValue = !prev
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.toggleVideo(newValue)
      }
      return newValue
    })
  }
  
  // Toggle audio
  const toggleAudio = () => {
    setIsAudioOn((prev) => {
      const newValue = !prev
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.toggleAudio(newValue)
      }
      return newValue
    })
  }
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (!isScreenSharing && webRTCServiceRef.current) {
        const screenStream = await webRTCServiceRef.current.startScreenShare()
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream
        }
        
        setIsScreenSharing(true)
        
        // Add system message
        addSystemMessage("Screen sharing started")
      } else if (webRTCServiceRef.current) {
        webRTCServiceRef.current.stopScreenShare()
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = null
        }
        
        setIsScreenSharing(false)
        
        // Add system message
        addSystemMessage("Screen sharing stopped")
      }
    } catch (error) {
      console.error("Error toggling screen share:", error)
      toast({
        title: "Screen sharing failed",
        description: "Could not start screen sharing",
        variant: "destructive",
      })
    }
  }
  
  // Toggle recording
  const toggleRecording = () => {
    if (!sessionId || !webRTCServiceRef.current) return
    
    if (!isRecording) {
      webRTCServiceRef.current.startRecording(sessionId)
    } else {
      webRTCServiceRef.current.stopRecording(sessionId)
    }
  }
  
  // Change video quality
  const changeQuality = (newQuality: "low" | "medium" | "high") => {
    setQuality(newQuality)
    
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.setVideoQuality(newQuality)
      
      toast({
        title: "Video quality changed",
        description: `Quality set to ${newQuality}`,
      })
    }
  }
  
  // Change volume
  const changeVolume = (newVolume: number) => {
    setVolume(newVolume)
    
    // Apply volume to all remote videos
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = newVolume / 100
    }
  }
  
  // Toggle mute for all remote audio
  const toggleMuteRemote = () => {
    setIsMuted((prev) => {
      const newValue = !prev
      
      // Mute/unmute remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.muted = newValue
      }
      
      return newValue
    })
  }
  
  // Send chat message
  const sendMessage = () => {
    if (newMessage.trim() === "" || !webRTCServiceRef.current) return
    
    // Send message via WebRTC
    webRTCServiceRef.current.sendMessage(newMessage)

    // Add message to local chat
    const message: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: newMessage,
      timestamp: new Date(),
      isSelf: true,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }
  
  // Add system message to chat
  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      sender: "System",
      content,
        timestamp: new Date(),
      isSelf: false,
  }

    setMessages((prev) => [...prev, message])
  }

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])
  
  // Handle enter key in chat input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Mock function to toggle connection
  const toggleConnection = () => {
    if (isConnected) {
      disconnectFromSession()
    } else {
      connectToSession()
    }
  }

  // If WebRTC is not supported, show a message
  if (isWebRTCSupported === false) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="border rounded-lg p-6 bg-destructive/10">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-semibold">Browser Not Compatible</h3>
            <p className="text-muted-foreground">
              Your browser doesn't support WebRTC technology, which is required for video chat.
              Please use a modern browser like Chrome, Firefox, or Edge.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button variant="outline" asChild>
                <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">
                  Download Chrome
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer">
                  Download Firefox
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If WebRTC support is still being checked, show loading
  if (isWebRTCSupported === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Participants</span> ({participantCount})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {isConnected && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex flex-col items-start gap-2 p-4">
                      <div className="font-medium">Video Quality</div>
                      <Select value={quality} onValueChange={(val: any) => changeQuality(val)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (360p)</SelectItem>
                          <SelectItem value="medium">Medium (720p)</SelectItem>
                          <SelectItem value="high">High (1080p)</SelectItem>
                        </SelectContent>
                      </Select>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex flex-col items-start gap-2 p-4">
                      <div className="flex items-center justify-between font-medium w-full">
                        <span>Volume</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMuteRemote();
                          }}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Slider 
                        value={[volume]} 
                        min={0} 
                        max={100} 
                        step={1} 
                        onValueChange={(val) => changeVolume(val[0])}
                        className="w-full"
                      />
                    </DropdownMenuItem>
                    {isMentor && (
                      <DropdownMenuItem 
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRecording();
                        }}
                      >
                        {isRecording ? (
                          <>
                            <StopCircle className="h-4 w-4 text-destructive" />
                            <span>Stop Recording</span>
                          </>
                        ) : (
                          <>
                            <Record className="h-4 w-4" />
                            <span>Start Recording</span>
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={disconnectFromSession}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <TabsContent value="video" className="m-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3 space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            {isConnected ? (
              <>
                {isScreenSharing ? (
                      <video ref={screenShareRef} className="w-full h-full object-cover" autoPlay playsInline />
                    ) : Object.keys(remoteStreams).length > 0 ? (
                      <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted={isMuted} />
                ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <User className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Waiting for participants to join...</p>
                      </div>
                )}
                    <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-background shadow-lg">
                  <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                        autoPlay
                        playsInline
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
                    <Button className="mt-4" onClick={connectToSession}>
                  Start Session
                </Button>
              </div>
            )}
          </div>

          {isConnected && (
            <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant={isAudioOn ? "default" : "outline"} 
                    size="icon" 
                    onClick={toggleAudio}
                    className={isAudioOn ? "" : "bg-muted/50"}
                  >
                {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
                  <Button 
                    variant={isVideoOn ? "default" : "outline"} 
                    size="icon" 
                    onClick={toggleVideo}
                    className={isVideoOn ? "" : "bg-muted/50"}
                  >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
                  <Button 
                    variant={isScreenSharing ? "default" : "outline"} 
                    size="icon" 
                    onClick={toggleScreenSharing}
                    className={isScreenSharing ? "" : "bg-muted/50"}
                  >
                <ScreenShare className="h-4 w-4" />
              </Button>
                  <Button
                    variant={isMuted ? "outline" : "default"}
                    size="icon"
                    onClick={toggleMuteRemote}
                    className={isMuted ? "bg-muted/50" : ""}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
                  {isMentor && (
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      onClick={toggleRecording}
                    >
                      {isRecording ? <StopCircle className="h-4 w-4" /> : <Record className="h-4 w-4" />}
              </Button>
                  )}
            </div>
          )}
        </div>
          </div>
        </TabsContent>
        
        <TabsContent value="chat" className="m-0">
          <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                      <div
                        key={message.id}
                      className={`flex ${
                        message.sender === "System" 
                        ? "justify-center" 
                        : message.isSelf 
                        ? "justify-end" 
                        : "justify-start"
                      }`}
                      >
                        <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.sender === "System"
                            ? "bg-muted text-muted-foreground text-center italic w-full"
                            : message.isSelf
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.sender !== "System" && (
                          <div className="font-medium text-xs mb-1">
                            {message.sender} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        )}
                        <div>{message.content}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                  <Textarea
                  placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-10 resize-none"
                  disabled={!isConnected}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!isConnected || newMessage.trim() === ""}
                >
                    <Send className="h-4 w-4" />
                  </Button>
              </div>
                </div>
              </div>
            </TabsContent>
        
        <TabsContent value="participants" className="m-0">
          <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2">
                {Object.keys(participants).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <User className="h-8 w-8 mb-2" />
                    <p>No other participants</p>
                  </div>
                ) : (
                  Object.entries(participants).map(([userId, data]) => (
                    <div key={userId} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5" />
                </div>
                        <div>
                          <div className="font-medium">{data.username}</div>
                          <div className="text-xs text-muted-foreground">{userId.substring(0, 10)}...</div>
                  </div>
                </div>
                      {data.role && (
                        <Badge variant="outline">{data.role}</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
    </div>
  )
}

