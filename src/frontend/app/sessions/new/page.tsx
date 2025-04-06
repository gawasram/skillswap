"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeb3 } from "@/lib/web3-context";
import { useState, useEffect, Suspense } from "react";
import { AlertCircle, Calendar, CheckCircle, Clock, DollarSign, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";
import type { MentorProfile } from "@/lib/contracts";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Create a client component that uses useSearchParams
function SessionFormWithParams() {
  const { walletStatus, contracts, walletAddress } = useWeb3();
  const searchParams = useSearchParams();
  const mentorParam = searchParams.get("mentor");
  
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [mentorAddress, setMentorAddress] = useState<string>(mentorParam || "");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    topic: "",
    date: "",
    time: "",
    duration: 60, // Default 60 minutes
  });
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Load mentor profile
  useEffect(() => {
    async function loadMentorProfile() {
      if (!mentorAddress || !contracts || !contracts.isInitialized()) {
        setLoading(false);
        return;
      }
      
      try {
        const profile = await contracts.getMentorProfile(mentorAddress);
        setMentor(profile);
      } catch (error) {
        console.error("Error loading mentor profile:", error);
        setErrorMessage("Failed to load mentor profile");
      } finally {
        setLoading(false);
      }
    }
    
    loadMentorProfile();
  }, [mentorAddress, contracts]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress || !contracts || !contracts.isInitialized()) {
      setRequestStatus("error");
      setErrorMessage("Please connect your wallet first");
      return;
    }
    
    if (!mentor) {
      setRequestStatus("error");
      setErrorMessage("Mentor profile not found");
      return;
    }
    
    // Validation
    if (!formData.topic.trim()) {
      setRequestStatus("error");
      setErrorMessage("Please enter a topic for the session");
      return;
    }
    
    if (!formData.date || !formData.time) {
      setRequestStatus("error");
      setErrorMessage("Please select a date and time for the session");
      return;
    }
    
    // Check if date is in the future
    const sessionDateTime = new Date(`${formData.date}T${formData.time}`);
    if (sessionDateTime <= new Date()) {
      setRequestStatus("error");
      setErrorMessage("Session must be scheduled for a future date and time");
      return;
    }
    
    setRequestStatus("loading");
    
    try {
      // Convert date and time to Unix timestamp (seconds)
      const startTime = Math.floor(sessionDateTime.getTime() / 1000);
      
      // Request the session
      await contracts.requestSession(
        mentorAddress,
        startTime,
        formData.duration,
        formData.topic
      );
      
      setRequestStatus("success");
      setTimeout(() => {
        window.location.href = "/sessions";
      }, 2000);
    } catch (error) {
      console.error("Error requesting session:", error);
      setRequestStatus("error");
      setErrorMessage("Failed to request session. Please try again later.");
    }
  };
  
  // Show appropriate connect wallet state
  if (walletStatus !== "connected") {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Calendar className="mr-2 h-8 w-8 text-primary" />
              Request a Session
            </h1>
            <p className="text-muted-foreground">
              Book a mentorship session with an expert mentor
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to request a session
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Calendar className="mr-2 h-8 w-8 text-primary" />
              Request a Session
            </h1>
            <p className="text-muted-foreground">
              Book a mentorship session with an expert mentor
            </p>
          </div>
          
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // If no mentor is selected
  if (!mentor && !mentorParam) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Calendar className="mr-2 h-8 w-8 text-primary" />
              Request a Session
            </h1>
            <p className="text-muted-foreground">
              Book a mentorship session with an expert mentor
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>No Mentor Selected</CardTitle>
              <CardDescription>
                Please select a mentor first to request a session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/mentors">
                <Button>Browse Mentors</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If mentor was not found
  if (!mentor && mentorParam) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Calendar className="mr-2 h-8 w-8 text-primary" />
              Request a Session
            </h1>
            <p className="text-muted-foreground">
              Book a mentorship session with an expert mentor
            </p>
          </div>
          
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Mentor Not Found</AlertTitle>
            <AlertDescription className="text-red-700">
              The mentor you're looking for doesn't exist or there was an error loading their profile.
            </AlertDescription>
          </Alert>
          
          <Link href="/mentors">
            <Button>Browse Other Mentors</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Calendar className="mr-2 h-8 w-8 text-primary" />
            Request a Session
          </h1>
          <p className="text-muted-foreground">
            Book a mentorship session with an expert mentor
          </p>
        </div>
        
        {requestStatus === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Session Requested</AlertTitle>
            <AlertDescription className="text-green-700">
              Your session request has been sent to the mentor. You'll be notified when they accept or reject it.
              Redirecting to sessions page...
            </AlertDescription>
          </Alert>
        )}
        
        {requestStatus === "error" && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Request Error</AlertTitle>
            <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Mentor Info Card */}
        {mentor && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Mentor</CardTitle>
              <CardDescription>
                You are requesting a session with the following mentor
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary-100 text-primary-700 text-xl">
                  {mentor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">{mentor.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {mentor.skills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="text-sm text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      {skill}
                    </span>
                  ))}
                  {mentor.skills.length > 3 && (
                    <span className="text-sm text-muted-foreground">
                      +{mentor.skills.length - 3} more
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1 mt-1 text-primary-600 font-medium">
                  <DollarSign className="h-4 w-4" />
                  {Number(mentor.hourlyRate.toString()) / 1e18} ROXN per hour
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Session Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              Provide details about the session you want to request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Session Topic</Label>
                <Textarea
                  id="topic"
                  name="topic"
                  placeholder="What do you want to learn or discuss in this session?"
                  className="min-h-24"
                  value={formData.topic}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Time
                  </Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Session Duration (minutes)
                </Label>
                <select
                  id="duration"
                  name="duration"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.duration}
                  onChange={handleChange}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              
              {/* Session Cost Calculation */}
              {mentor && (
                <div className="bg-muted rounded-md p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hourly Rate</span>
                    <span>{Number(mentor.hourlyRate.toString()) / 1e18} ROXN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span>{formData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Estimated Total</span>
                    <span className="text-primary-600">
                      {(Number(mentor.hourlyRate.toString()) / 1e18 * (formData.duration / 60)).toFixed(4)} ROXN
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Note: Payment will only be required after the mentor accepts your request.
                  </p>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={requestStatus === "loading"}
              >
                {requestStatus === "loading" ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Sending Request...
                  </>
                ) : (
                  "Request Session"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component
export default function NewSessionPage() {
  return (
    <div>
      <h1>Create New Session</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SessionFormWithParams />
      </Suspense>
    </div>
  );
} 