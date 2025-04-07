"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { Session } from "@/lib/contracts";
import { SessionStatus } from "@/lib/contract-abis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  Star, 
  ExternalLink,
  DollarSign,
  MessageSquare
} from "lucide-react";

/**
 * Component for testing Session and Rating functionality
 */
export function SessionRatingTester() {
  const { walletStatus, walletAddress, contracts } = useWeb3();
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<string[]>([]);
  const [mentorProfiles, setMentorProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isMentor, setIsMentor] = useState(false);
  
  // Form states - Request Session
  const [selectedMentor, setSelectedMentor] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState("");
  const [sessionDuration, setSessionDuration] = useState("60");
  
  // Form states - Accept Session
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  
  // Form states - Submit Rating
  const [ratingScore, setRatingScore] = useState("5");
  const [ratingComment, setRatingComment] = useState("");
  const [selectedSessionForRating, setSelectedSessionForRating] = useState("");
  
  // Initialize and load data
  useEffect(() => {
    if (walletStatus === "connected" && walletAddress && contracts && contracts.isInitialized()) {
      loadData();
    }
  }, [walletStatus, walletAddress, contracts]);
  
  const loadData = async () => {
    if (!contracts || !walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is a mentor
      const profile = await contracts.getMentorProfile(walletAddress);
      setIsMentor(profile && profile.name ? true : false);
      
      // Load all mentors
      const allMentors = await contracts.getAllMentors();
      setMentors(allMentors);
      
      // Load mentor profiles
      const profiles = await Promise.all(
        allMentors.map(address => contracts.getMentorProfile(address))
      );
      setMentorProfiles(profiles.map((profile, index) => ({
        ...profile,
        address: allMentors[index]
      })));
      
      // Load sessions - both as mentor and mentee
      const mentorSessions = isMentor ? await contracts.getMentorSessions(walletAddress) : [];
      const menteeSessions = await contracts.getMenteeSessions(walletAddress);
      
      // Combine and deduplicate session IDs
      const allSessionIds = [...new Set([...mentorSessions, ...menteeSessions])];
      
      // Load full session details
      const sessionsData = await Promise.all(
        allSessionIds.map(id => contracts.getSession(id))
      );
      
      // Add session ID to each session object for easier reference
      const sessionsWithIds = sessionsData.map((session, index) => ({
        ...session,
        id: allSessionIds[index]
      }));
      
      setSessions(sessionsWithIds);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  
  // Format timestamp from BigNumber to readable date
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(Number(timestamp.toString()) * 1000);
      return date.toLocaleString();
    } catch (err) {
      return "Invalid date";
    }
  };
  
  // Helper to get session status text
  const getSessionStatusText = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.Requested:
        return "Requested";
      case SessionStatus.Accepted:
        return "Accepted";
      case SessionStatus.Rejected:
        return "Rejected";
      case SessionStatus.Completed:
        return "Completed";
      case SessionStatus.Cancelled:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };
  
  // Helper to get session status badge variant
  const getSessionStatusVariant = (status: SessionStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case SessionStatus.Requested:
        return "secondary";
      case SessionStatus.Accepted:
        return "default";
      case SessionStatus.Rejected:
        return "destructive";
      case SessionStatus.Completed:
        return "default";
      case SessionStatus.Cancelled:
        return "destructive";
      default:
        return "outline";
    }
  };
  
  // Request a new session
  const handleRequestSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contracts || !walletAddress) {
      toast({
        title: "Error",
        description: "Wallet not connected or contracts not initialized",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedMentor || !sessionTopic || !sessionStartTime || !sessionDuration) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert date/time string to unix timestamp
      const startTimeDate = new Date(sessionStartTime);
      const startTimeUnix = Math.floor(startTimeDate.getTime() / 1000);
      
      // Request session
      const tx = await contracts.requestSession(
        selectedMentor,
        startTimeUnix,
        parseInt(sessionDuration),
        sessionTopic
      );
      
      toast({
        title: "Transaction sent",
        description: "Your session request has been sent",
      });
      
      // Wait for confirmation
      await tx.wait();
      
      toast({
        title: "Session requested",
        description: "Your session request has been submitted",
      });
      
      // Refresh data
      loadData();
      
      // Reset form
      setSelectedMentor("");
      setSessionTopic("");
      setSessionStartTime("");
      setSessionDuration("60");
    } catch (err: any) {
      console.error("Error requesting session:", err);
      
      toast({
        title: "Request failed",
        description: err.message || "Failed to request session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Accept a session (mentor only)
  const handleAcceptSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contracts || !walletAddress || !isMentor) {
      toast({
        title: "Error",
        description: "You must be a mentor to accept sessions",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedSessionId || !meetingLink) {
      toast({
        title: "Missing information",
        description: "Please select a session and provide a meeting link",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Accept session
      const tx = await contracts.acceptSession(selectedSessionId, meetingLink);
      
      toast({
        title: "Transaction sent",
        description: "Accepting session...",
      });
      
      // Wait for confirmation
      await tx.wait();
      
      toast({
        title: "Session accepted",
        description: "You have accepted the session",
      });
      
      // Refresh data
      loadData();
      
      // Reset form
      setSelectedSessionId("");
      setMeetingLink("");
    } catch (err: any) {
      console.error("Error accepting session:", err);
      
      toast({
        title: "Accept failed",
        description: err.message || "Failed to accept session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Reject a session (mentor only)
  const handleRejectSession = async (sessionId: string | number) => {
    if (!contracts || !walletAddress || !isMentor) {
      toast({
        title: "Error",
        description: "You must be a mentor to reject sessions",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Reject session
      const tx = await contracts.rejectSession(sessionId);
      
      toast({
        title: "Transaction sent",
        description: "Rejecting session...",
      });
      
      // Wait for confirmation
      await tx.wait();
      
      toast({
        title: "Session rejected",
        description: "You have rejected the session",
      });
      
      // Refresh data
      loadData();
    } catch (err: any) {
      console.error("Error rejecting session:", err);
      
      toast({
        title: "Reject failed",
        description: err.message || "Failed to reject session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Complete a session
  const handleCompleteSession = async (sessionId: string | number) => {
    if (!contracts || !walletAddress) {
      toast({
        title: "Error",
        description: "Wallet not connected or contracts not initialized",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Complete session
      const tx = await contracts.completeSession(sessionId);
      
      toast({
        title: "Transaction sent",
        description: "Completing session...",
      });
      
      // Wait for confirmation
      await tx.wait();
      
      toast({
        title: "Session completed",
        description: "The session has been marked as completed",
      });
      
      // Refresh data
      loadData();
    } catch (err: any) {
      console.error("Error completing session:", err);
      
      toast({
        title: "Completion failed",
        description: err.message || "Failed to complete session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Pay for a session
  const handlePayForSession = async (sessionId: string | number) => {
    if (!contracts || !walletAddress) {
      toast({
        title: "Error",
        description: "Wallet not connected or contracts not initialized",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Pay for session
      const tx = await contracts.payForSession(sessionId);
      
      toast({
        title: "Transaction sent",
        description: "Processing payment...",
      });
      
      // Wait for confirmation
      await tx.wait();
      
      toast({
        title: "Payment successful",
        description: "You have paid for the session",
      });
      
      // Refresh data
      loadData();
    } catch (err: any) {
      console.error("Error paying for session:", err);
      
      toast({
        title: "Payment failed",
        description: err.message || "Failed to pay for session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel a session
  const handleCancelSession = async (sessionId: string | number) => {
    if (!contracts || !walletAddress) {
      toast({
        title: "Error",
        description: "Wallet not connected or contracts not initialized",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Cancel session
      const tx = await contracts.cancelSession(sessionId);
      
      toast({
        title: "Transaction sent",
        description: "Cancelling session...",
      });
      
      // Wait for confirmation
      await tx.wait();
      
      toast({
        title: "Session cancelled",
        description: "The session has been cancelled",
      });
      
      // Refresh data
      loadData();
    } catch (err: any) {
      console.error("Error cancelling session:", err);
      
      toast({
        title: "Cancellation failed",
        description: err.message || "Failed to cancel session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Submit a rating
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contracts || !walletAddress) {
      toast({
        title: "Error",
        description: "Wallet not connected or contracts not initialized",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedSessionForRating || !ratingScore) {
      toast({
        title: "Missing information",
        description: "Please select a session and provide a rating score",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Submit rating
      const tx = await contracts.submitRating(
        selectedSessionForRating,
        parseInt(ratingScore),
        ratingComment
      );
      
      toast({
        title: "Transaction sent",
        description: "Submitting rating...",
      });
      
      // Wait for confirmation
      await tx.wait();
      
      toast({
        title: "Rating submitted",
        description: "Your rating has been submitted",
      });
      
      // Refresh data
      loadData();
      
      // Reset form
      setSelectedSessionForRating("");
      setRatingScore("5");
      setRatingComment("");
    } catch (err: any) {
      console.error("Error submitting rating:", err);
      
      toast({
        title: "Rating submission failed",
        description: err.message || "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Not connected state
  if (walletStatus !== "connected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session & Rating Tester</CardTitle>
          <CardDescription>Connect your wallet to test session management and ratings</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/50" />
            <p>No wallet connected</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Contracts not initialized state
  if (!contracts || !contracts.isInitialized()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session & Rating Tester</CardTitle>
          <CardDescription>Contracts not initialized or deployed</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/50" />
            <p>Smart contracts not available on this network</p>
            <p className="text-sm">Please switch to a supported network or deploy contracts first</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading</CardTitle>
          <CardDescription>Processing blockchain transaction...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p>Please wait while your transaction is being processed...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>Failed to load contract data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p>{error}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={loadData} 
            className="w-full"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Session & Rating Tester</CardTitle>
        <CardDescription>Test session management and rating functionality</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sessions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="request">Request Session</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>
          
          {/* Current Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Sessions</h3>
              <Button onClick={loadData} variant="outline" size="sm">Refresh</Button>
            </div>
            
            {sessions.length === 0 ? (
              <div className="border rounded-md p-8 text-center text-muted-foreground">
                <p>No sessions found</p>
                <p className="text-sm mt-2">Request a session using the "Request Session" tab</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session: any, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className={`border-l-4 ${
                      session.status === SessionStatus.Accepted ? 'border-green-500' : 
                      session.status === SessionStatus.Requested ? 'border-amber-500' :
                      session.status === SessionStatus.Completed ? 'border-blue-500' :
                      'border-red-500'
                    } h-full`}></div>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                        <h3 className="font-medium text-lg">{session.topic}</h3>
                        <Badge variant={getSessionStatusVariant(session.status)}>
                          {getSessionStatusText(session.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTimestamp(session.startTime)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{session.duration?.toString()} minutes</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{
                            session.mentor === walletAddress 
                              ? `Mentee: ${session.mentee.substring(0, 6)}...${session.mentee.substring(38)}`
                              : `Mentor: ${session.mentor.substring(0, 6)}...${session.mentor.substring(38)}`
                          }</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{session.totalPrice ? `${Number(session.totalPrice.toString()) / 1e18} ROXN` : "N/A"}</span>
                        </div>
                        
                        {session.meetingLink && (
                          <div className="flex items-center gap-2 col-span-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={session.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center"
                            >
                              Meeting Link <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Session actions based on status and role */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {/* Mentor actions */}
                        {session.mentor === walletAddress && (
                          <>
                            {session.status === SessionStatus.Requested && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setSelectedSessionId(session.id)}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => handleRejectSession(session.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {session.status === SessionStatus.Accepted && (
                              <Button 
                                size="sm" 
                                variant="default" 
                                onClick={() => handleCompleteSession(session.id)}
                              >
                                Complete Session
                              </Button>
                            )}
                          </>
                        )}
                        
                        {/* Mentee actions */}
                        {session.mentee === walletAddress && (
                          <>
                            {session.status === SessionStatus.Accepted && !session.isPaid && (
                              <Button 
                                size="sm" 
                                variant="default" 
                                onClick={() => handlePayForSession(session.id)}
                              >
                                Pay Now
                              </Button>
                            )}
                            
                            {session.status === SessionStatus.Requested && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleCancelSession(session.id)}
                              >
                                Cancel Request
                              </Button>
                            )}
                            
                            {session.status === SessionStatus.Completed && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setSelectedSessionForRating(session.id)}
                              >
                                Rate Session
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Form for accepting sessions (only shown when a session is selected) */}
            {selectedSessionId && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Accept Session</CardTitle>
                  <CardDescription>Provide meeting details for the session</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAcceptSession} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meetingLink">Meeting Link</Label>
                      <Input
                        id="meetingLink"
                        placeholder="https://meet.example.com/session"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide a link to a video conferencing tool where the session will take place
                      </p>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setSelectedSessionId("")}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Accept Session</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Request Session Tab */}
          <TabsContent value="request" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Request New Session</CardTitle>
                <CardDescription>Book a session with an available mentor</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestSession} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mentor">Select Mentor</Label>
                    <select
                      id="mentor"
                      className="w-full rounded-md border border-input p-2"
                      value={selectedMentor}
                      onChange={(e) => setSelectedMentor(e.target.value)}
                      required
                    >
                      <option value="">Select a mentor...</option>
                      {mentorProfiles.map((profile, index) => (
                        <option key={index} value={profile.address}>
                          {profile.name} - {Number(profile.hourlyRate?.toString()) / 1e18} ROXN/hour
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="topic">Session Topic</Label>
                    <Input
                      id="topic"
                      placeholder="What would you like to learn about?"
                      value={sessionTopic}
                      onChange={(e) => setSessionTopic(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={sessionStartTime}
                        onChange={(e) => setSessionStartTime(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        max="240"
                        step="15"
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full">Request Session</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Ratings Tab */}
          <TabsContent value="ratings" className="space-y-4 mt-4">
            {/* Rating form (only shown when a session is selected) */}
            {selectedSessionForRating ? (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Rating</CardTitle>
                  <CardDescription>Rate your session with the mentor</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitRating} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="score">Rating Score (1-5)</Label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <Button
                            key={score}
                            type="button"
                            variant={parseInt(ratingScore) === score ? "default" : "outline"}
                            className="p-2 h-auto"
                            onClick={() => setRatingScore(score.toString())}
                          >
                            <Star className={`h-5 w-5 ${parseInt(ratingScore) >= score ? "fill-current" : ""}`} />
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="comment">Comments (optional)</Label>
                      <Textarea
                        id="comment"
                        placeholder="Share your experience with the mentor..."
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setSelectedSessionForRating("")}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Submit Rating</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Ratings</CardTitle>
                    <CardDescription>Rate your completed sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sessions.filter(s => 
                      s.status === SessionStatus.Completed && 
                      s.mentee === walletAddress
                    ).length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground">
                        <p>No completed sessions found to rate</p>
                        <p className="text-sm mt-2">Complete a session first to be able to rate it</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm">Select a completed session to rate:</p>
                        {sessions
                          .filter(s => s.status === SessionStatus.Completed && s.mentee === walletAddress)
                          .map((session: any, index) => (
                            <Card key={index} className="overflow-hidden cursor-pointer hover:border-primary"
                                 onClick={() => setSelectedSessionForRating(session.id)}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium">{session.topic}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {formatTimestamp(session.startTime)}
                                    </p>
                                  </div>
                                  <Button size="sm" variant="outline">Rate</Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 