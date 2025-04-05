"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/lib/web3-context";
import { Session } from "@/lib/contracts";
import { SessionStatus } from "@/lib/contract-abis";
import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  BarChart
} from "lucide-react";

export default function SessionsPage() {
  const { contracts, walletStatus, walletAddress } = useWeb3();
  const [sessions, setSessions] = useState<(Session & { id: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMentor, setIsMentor] = useState(false);
  
  useEffect(() => {
    async function loadSessions() {
      if (walletStatus === "connected" && walletAddress && contracts && contracts.isInitialized()) {
        try {
          setLoading(true);
          setError(null);
          
          // Check if user is a mentor
          try {
            const profile = await contracts.getMentorProfile(walletAddress);
            setIsMentor(profile && profile.name ? true : false);
          } catch (err) {
            setIsMentor(false);
          }
          
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
          console.error("Error loading sessions:", err);
          setError(err.message || "Failed to load sessions");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    
    loadSessions();
  }, [contracts, walletStatus, walletAddress, isMentor]);
  
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
  
  // Filter sessions by status
  const upcomingSessions = sessions.filter(
    s => s.status === SessionStatus.Requested || s.status === SessionStatus.Accepted
  );
  
  const completedSessions = sessions.filter(
    s => s.status === SessionStatus.Completed
  );
  
  const cancelledSessions = sessions.filter(
    s => s.status === SessionStatus.Rejected || s.status === SessionStatus.Cancelled
  );
  
  // Session stats
  const totalEarned = completedSessions
    .filter(s => s.mentor === walletAddress)
    .reduce((sum, session) => sum + Number(session.totalPrice.toString()), 0);
  
  const totalSpent = completedSessions
    .filter(s => s.mentee === walletAddress)
    .reduce((sum, session) => sum + Number(session.totalPrice.toString()), 0);
  
  // Session card component
  const SessionCard = ({ session }: { session: Session & { id: number } }) => (
    <Card className="overflow-hidden">
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
      </CardContent>
    </Card>
  );
  
  // Not connected state
  if (walletStatus !== "connected") {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Calendar className="mr-2 h-8 w-8 text-primary" />
              My Sessions
            </h1>
            <p className="text-muted-foreground">
              Manage your mentorship sessions
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>Please connect your wallet to view your sessions</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <AlertTriangle className="h-10 w-10 text-muted-foreground/50" />
                <p>No wallet connected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Calendar className="mr-2 h-8 w-8 text-primary" />
              My Sessions
            </h1>
            <p className="text-muted-foreground">
              Manage your mentorship sessions
            </p>
          </div>
          
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Calendar className="mr-2 h-8 w-8 text-primary" />
            My Sessions
          </h1>
          <p className="text-muted-foreground">
            Manage your mentorship sessions
          </p>
        </div>
        
        {/* Stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime total</p>
            </CardContent>
          </Card>
          
          {isMentor && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(totalEarned / 1e18).toFixed(2)} ROXN</div>
                <p className="text-xs text-muted-foreground mt-1">From completed sessions</p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(totalSpent / 1e18).toFixed(2)} ROXN</div>
              <p className="text-xs text-muted-foreground mt-1">On mentorship sessions</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Sessions tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledSessions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-4">
            {upcomingSessions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Upcoming Sessions</CardTitle>
                  <CardDescription>
                    You don't have any upcoming sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => window.location.href = "/explore"}>
                    Find a Mentor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {upcomingSessions.map((session, index) => (
                  <SessionCard key={index} session={session} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            {completedSessions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Completed Sessions</CardTitle>
                  <CardDescription>
                    You haven't completed any sessions yet.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {completedSessions.map((session, index) => (
                  <SessionCard key={index} session={session} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="mt-4">
            {cancelledSessions.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Cancelled Sessions</CardTitle>
                  <CardDescription>
                    You don't have any cancelled or rejected sessions.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {cancelledSessions.map((session, index) => (
                  <SessionCard key={index} session={session} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 