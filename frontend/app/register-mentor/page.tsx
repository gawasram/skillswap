"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeb3 } from "@/lib/web3-context";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, DollarSign, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { MentorProfile } from "@/lib/contracts";

export default function RegisterMentorPage() {
  const { walletStatus, contracts, walletAddress } = useWeb3();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: [] as string[],
    hourlyRate: "",
    currentSkill: "",
    isActive: true,
    metadataURI: "" // Added to match the contract interface
  });
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAlreadyMentor, setIsAlreadyMentor] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);

  // Check if user is already a mentor
  useEffect(() => {
    async function checkMentorStatus() {
      if (walletStatus === "connected" && contracts && contracts.isInitialized() && walletAddress) {
        try {
          // Check if the getMentorProfile function exists in the contracts object
          if (typeof contracts.getMentorProfile === 'function') {
            try {
              const profile = await contracts.getMentorProfile(walletAddress);
              // If we can get a profile, then the user is a mentor
              setIsAlreadyMentor(true);
              setMentorProfile(profile);
              
              // Pre-populate form with existing data
              setFormData({
                name: profile.name || "",
                bio: "", // Bio isn't in the contract profile
                skills: profile.skills || [],
                hourlyRate: profile.hourlyRate ? (Number(profile.hourlyRate.toString()) / 1e18).toString() : "",
                currentSkill: "",
                isActive: profile.isActive,
                metadataURI: profile.metadataURI || ""
              });
            } catch (error) {
              console.error("Error fetching mentor profile:", error);
              setIsAlreadyMentor(false);
            }
          }
        } catch (error) {
          console.error("Error checking mentor status:", error);
        }
      }
    }
    
    checkMentorStatus();
  }, [walletStatus, contracts, walletAddress]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddSkill = () => {
    if (formData.currentSkill.trim() !== "" && !formData.skills.includes(formData.currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.currentSkill.trim()],
        currentSkill: ""
      }));
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  // Create metadata URI from form data
  const generateMetadataURI = () => {
    // In a real application, you might upload this data to IPFS or a server
    // For now, we'll just create a basic JSON representation
    const metadata = {
      name: formData.name,
      bio: formData.bio,
      skills: formData.skills,
      timestamp: new Date().toISOString()
    };
    
    // Convert to Base64 encoded JSON string
    return `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress || !contracts || !contracts.isInitialized()) {
      setRegistrationStatus("error");
      setErrorMessage("Please connect your wallet first");
      return;
    }
    
    // Simple validation
    if (!formData.name.trim()) {
      setRegistrationStatus("error");
      setErrorMessage("Name is required");
      return;
    }
    
    if (formData.skills.length === 0) {
      setRegistrationStatus("error");
      setErrorMessage("At least one skill is required");
      return;
    }
    
    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      setRegistrationStatus("error");
      setErrorMessage("Please enter a valid hourly rate");
      return;
    }
    
    setRegistrationStatus("loading");
    
    try {
      // Generate or update metadata URI
      const metadataURI = formData.metadataURI || generateMetadataURI();
      
      if (isAlreadyMentor) {
        // Check if updateMentorProfile exists and call it with appropriate params
        if (typeof contracts.updateMentorProfile === 'function') {
          await contracts.updateMentorProfile(
            formData.name,
            formData.skills,
            formData.hourlyRate,
            metadataURI
          );
          
          // If mentor is inactive but wants to be active again
          if (formData.isActive && mentorProfile && !mentorProfile.isActive) {
            if (typeof contracts.reactivateMentor === 'function') {
              await contracts.reactivateMentor();
            }
          } 
          // If mentor is active but wants to be inactive
          else if (!formData.isActive && mentorProfile && mentorProfile.isActive) {
            if (typeof contracts.deactivateMentor === 'function') {
              await contracts.deactivateMentor();
            }
          }
        } else {
          throw new Error("updateMentorProfile method not available");
        }
      } else {
        // Check if registerMentor exists and call it with appropriate params
        if (typeof contracts.registerMentor === 'function') {
          await contracts.registerMentor(
            formData.name,
            formData.skills,
            formData.hourlyRate,
            metadataURI
          );
        } else {
          throw new Error("registerMentor method not available");
        }
      }
      
      setRegistrationStatus("success");
      setTimeout(() => {
        window.location.href = "/mentors";
      }, 2000);
    } catch (error) {
      console.error("Error registering/updating mentor:", error);
      setRegistrationStatus("error");
      setErrorMessage("Transaction failed. Please try again later.");
    }
  };
  
  // Show appropriate connect wallet state
  if (walletStatus !== "connected") {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <UserPlus className="mr-2 h-8 w-8 text-primary" />
              Become a Mentor
            </h1>
            <p className="text-muted-foreground">
              Share your expertise and earn rewards by becoming a mentor
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to register as a mentor
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <UserPlus className="mr-2 h-8 w-8 text-primary" />
            {isAlreadyMentor ? "Update Mentor Profile" : "Become a Mentor"}
          </h1>
          <p className="text-muted-foreground">
            {isAlreadyMentor 
              ? "Update your mentor profile information" 
              : "Share your expertise and earn rewards by becoming a mentor"}
          </p>
        </div>
        
        {registrationStatus === "success" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{isAlreadyMentor ? "Profile Updated" : "Registration Successful"}</AlertTitle>
            <AlertDescription className="text-green-700">
              {isAlreadyMentor 
                ? "Your mentor profile has been successfully updated." 
                : "You've successfully registered as a mentor on SkillSwap."}
              Redirecting to mentor directory...
            </AlertDescription>
          </Alert>
        )}
        
        {registrationStatus === "error" && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Registration Error</AlertTitle>
            <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>{isAlreadyMentor ? "Update Profile Information" : "Mentor Information"}</CardTitle>
            <CardDescription>
              Provide details about yourself and your expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Your name as shown to mentees" 
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Share information about your background, experience, and teaching style"
                  className="min-h-32"
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Skills/Topics</Label>
                <div className="flex gap-2">
                  <Input
                    name="currentSkill"
                    placeholder="Add a skill or topic you can teach"
                    value={formData.currentSkill}
                    onChange={handleChange}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddSkill}
                    disabled={!formData.currentSkill.trim()}
                  >
                    Add
                  </Button>
                </div>
                
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="pl-2">
                        {skill}
                        <button
                          type="button" 
                          className="ml-1 rounded-full hover:bg-muted/80 px-1"
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hourlyRate" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Hourly Rate (ROXN)
                </Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder="Your hourly rate in ROXN tokens"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {isAlreadyMentor && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="isActive">Available for mentorship</Label>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={registrationStatus === "loading"}
              >
                {registrationStatus === "loading" ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {isAlreadyMentor ? "Updating..." : "Registering..."}
                  </>
                ) : (
                  isAlreadyMentor ? "Update Profile" : "Register as Mentor"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 