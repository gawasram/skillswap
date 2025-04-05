"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { Session } from "@/lib/contracts";
import { SessionStatus } from "@/lib/contract-abis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, ExternalLink, Calendar, Clock, User, DollarSign, MessageSquare } from "lucide-react";

/**
 * Component for displaying and interacting with SkillSwap contracts
 */
export function ContractInteraction() {
  const { walletStatus, walletAddress, chainId, contracts } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Form states for registering as a mentor
  const [mentorName, setMentorName] = useState("");
  const [mentorSkills, setMentorSkills] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  
  // Session request form states
  const [selectedMentor, setSelectedMentor] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionDuration, setSessionDuration] = useState("60");

  // Load mentor profile and sessions when wallet connects
  useEffect(() => {
    if (walletStatus === "connected" && walletAddress && contracts && contracts.isInitialized()) {
      loadProfileAndSessions();
    } else {
      // Reset state if disconnected
      setIsMentor(false);
      setMentorProfile(null);
      setSessions([]);
    }
  }, [walletStatus, walletAddress, contracts, chainId]);

  // Load mentor profile and sessions
  const loadProfileAndSessions = async () => {
    if (!walletAddress || !contracts) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is a mentor
      const profile = await contracts.getMentorProfile(walletAddress);
      
      if (profile && profile.name) {
        setIsMentor(true);
        setMentorProfile(profile);
        
        // Load mentor sessions
        const sessionIds = await contracts.getMentorSessions(walletAddress);
        
        // Load full session details for each ID
        const sessionsData = await Promise.all(
          sessionIds.map(id => contracts.getSession(id))
        );
        
        setSessions(sessionsData);
      } else {
        setIsMentor(false);
        
        // Load mentee sessions
        const sessionIds = await contracts.getMenteeSessions(walletAddress);
        
        // Load full session details for each ID
        const sessionsData = await Promise.all(
          sessionIds.map(id => contracts.getSession(id))
        );
        
        setSessions(sessionsData);
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Register as a mentor
  const handleRegisterMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contracts || !walletAddress) {
      toast({
        title: "Error",
        description: "Wallet not connected or contracts not initialized",
        variant: "destructive",
      });
      return;
    }
    
    if (!mentorName || !mentorSkills || !hourlyRate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Parse skills into an array
      const skillsArray = mentorSkills.split(',').map(skill => skill.trim());
      
      // Create IPFS metadata URI (in a real app, you'd upload to IPFS)
      const metadataURI = `ipfs://placeholder/${walletAddress}`;
      
      // Register mentor
      const tx = await contracts.registerMentor(mentorName, skillsArray, hourlyRate, metadataURI);
      
      toast({
        title: "Transaction sent",
        description: "Your mentor registration transaction has been sent",
      });
      
      // Wait for transaction confirmation
      await tx.wait();
      
      toast({
        title: "Registration complete",
        description: "You are now registered as a mentor!",
      });
      
      // Refresh data
      loadProfileAndSessions();
      
      // Clear form
      setMentorName("");
      setMentorSkills("");
      setHourlyRate("");
      setMentorBio("");
    } catch (err: any) {
      console.error("Error registering as mentor:", err);
      
      toast({
        title: "Registration failed",
        description: err.message || "Failed to register as mentor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  // Format timestamp from BigNumber to readable date
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp.toString()) * 1000);
    return date.toLocaleString();
  };

  // Not connected state
  if (walletStatus !== "connected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Contract Interaction</CardTitle>
          <CardDescription>Connect your wallet to interact with SkillSwap contracts</CardDescription>
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
          <CardTitle>Smart Contract Interaction</CardTitle>
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
          <CardDescription>Fetching data from blockchain</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p>Loading your SkillSwap data...</p>
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
            onClick={loadProfileAndSessions} 
            className="w-full"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Mentor registration form (if not already a mentor)
  if (!isMentor) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Become a Mentor</CardTitle>
          <CardDescription>Register as a mentor to share your skills and earn tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegisterMentor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                placeholder="JavaScript, React, Solidity"
                value={mentorSkills}
                onChange={(e) => setMentorSkills(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly Rate (in ROXN tokens)</Label>
              <Input
                id="rate"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your experience"
                value={mentorBio}
                onChange={(e) => setMentorBio(e.target.value)}
                rows={4}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register as Mentor"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Mentor dashboard
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mentor Dashboard</CardTitle>
          <CardDescription>Manage your mentorship sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Name</p>
              <p>{mentorProfile?.name || "N/A"}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Hourly Rate</p>
              <p>{mentorProfile?.hourlyRate ? `${Number(mentorProfile.hourlyRate.toString()) / 1e18} ROXN` : "N/A"}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Registration Date</p>
              <p>{mentorProfile?.registrationTime ? formatTimestamp(mentorProfile.registrationTime) : "N/A"}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Status</p>
              <Badge variant={mentorProfile?.isActive ? "default" : "destructive"}>
                {mentorProfile?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="space-y-2 col-span-2">
              <p className="text-sm font-medium">Skills</p>
              <div className="flex flex-wrap gap-2">
                {mentorProfile?.skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Your mentorship sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              <p>No sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="border-l-4 border-primary h-full"></div>
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
                          isMentor 
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
                    
                    {/* Session actions based on status */}
                    {session.status === SessionStatus.Requested && isMentor && (
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {/* Accept session logic */}}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => {/* Reject session logic */}}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {/* Other session action buttons based on status */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 