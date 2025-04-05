"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/lib/web3-context";
import { useState, useEffect } from "react";
import { Users, Search, Star, Clock, Calendar, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export default function MentorsPage() {
  const { contracts, walletStatus } = useWeb3();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  
  useEffect(() => {
    async function loadMentors() {
      if (walletStatus === "connected" && contracts && contracts.isInitialized()) {
        try {
          // Get all mentor addresses
          const mentorAddresses = await contracts.getAllMentors();
          
          // Get details for each mentor
          const mentorProfiles = await Promise.all(
            mentorAddresses.map(async (address: string) => {
              try {
                const profile = await contracts.getMentorProfile(address);
                
                // Get rating information
                let averageRating = 0;
                let ratingCount = 0;
                try {
                  averageRating = await contracts.getMentorAverageRating(address);
                  ratingCount = await contracts.getMentorRatingCount(address);
                } catch (error) {
                  console.error("Error fetching rating:", error);
                  averageRating = 0;
                  ratingCount = 0;
                }
                
                return {
                  address,
                  ...profile,
                  averageRating: averageRating / 10, // Assuming rating is stored as 0-50 (0-5.0)
                  ratingCount,
                  // Adding sample stats - in a real app, these would come from contract data
                  completedSessions: Math.floor(Math.random() * 50),
                  totalHours: Math.floor(Math.random() * 200),
                  specialties: profile.skills.slice(0, 3), // Top 3 skills
                };
              } catch (error) {
                console.error("Error fetching mentor profile:", error);
                return null;
              }
            })
          );
          
          // Filter out any null profiles
          const validProfiles = mentorProfiles.filter(profile => profile !== null);
          setMentors(validProfiles);
          
          // Set the first mentor as selected
          if (validProfiles.length > 0) {
            setSelectedMentor(validProfiles[0]);
          }
        } catch (error) {
          console.error("Error loading mentors:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    
    loadMentors();
  }, [contracts, walletStatus]);
  
  // Filter mentors based on search term
  const filteredMentors = mentors.filter(mentor => 
    searchTerm === "" || 
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.skills.some((skill: string) => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  // Generate star rating component
  const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-yellow-400" />
        ))}
      </div>
    );
  };
  
  // Not connected state
  if (walletStatus !== "connected") {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Users className="mr-2 h-8 w-8 text-primary" />
              Mentor Directory
            </h1>
            <p className="text-muted-foreground">
              Browse and connect with experienced mentors
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to view available mentors
              </CardDescription>
            </CardHeader>
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
              <Users className="mr-2 h-8 w-8 text-primary" />
              Mentor Directory
            </h1>
            <p className="text-muted-foreground">
              Browse and connect with experienced mentors
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
            <Users className="mr-2 h-8 w-8 text-primary" />
            Mentor Directory
          </h1>
          <p className="text-muted-foreground">
            Browse and connect with experienced mentors
          </p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or skill..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {filteredMentors.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Mentors Found</CardTitle>
              <CardDescription>
                {searchTerm 
                  ? "No mentors match your search criteria. Try adjusting your search."
                  : "There are no mentors registered yet."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mentor list - left column */}
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-lg font-medium">Available Mentors</h2>
              <div className="space-y-2">
                {filteredMentors.map((mentor, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-colors hover:border-primary ${
                      selectedMentor?.address === mentor.address ? 'border-primary bg-primary-50/50' : ''
                    }`}
                    onClick={() => setSelectedMentor(mentor)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {mentor.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{mentor.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <StarRating rating={mentor.averageRating} />
                          <span className="ml-1">({mentor.ratingCount})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Mentor detail - right columns */}
            {selectedMentor && (
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary-100 text-primary-700 text-xl">
                            {selectedMentor.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{selectedMentor.name}</CardTitle>
                          <div className="flex items-center mt-1">
                            <StarRating rating={selectedMentor.averageRating} />
                            <span className="ml-2 text-sm text-muted-foreground">
                              {selectedMentor.averageRating.toFixed(1)} ({selectedMentor.ratingCount} ratings)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="bg-primary-50">
                        {selectedMentor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <DollarSign className="h-5 w-5 text-primary mb-1" />
                        <span className="text-lg font-bold">
                          {Number(selectedMentor.hourlyRate.toString()) / 1e18} ROXN
                        </span>
                        <span className="text-xs text-muted-foreground">Per hour</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Calendar className="h-5 w-5 text-primary mb-1" />
                        <span className="text-lg font-bold">{selectedMentor.completedSessions}</span>
                        <span className="text-xs text-muted-foreground">Sessions</span>
                      </div>
                      
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Clock className="h-5 w-5 text-primary mb-1" />
                        <span className="text-lg font-bold">{selectedMentor.totalHours}+</span>
                        <span className="text-xs text-muted-foreground">Hours</span>
                      </div>
                    </div>
                    
                    {/* Skills */}
                    <div>
                      <h3 className="font-medium mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedMentor.skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Rating breakdown */}
                    <div>
                      <h3 className="font-medium mb-2">Rating Breakdown</h3>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => {
                          // Simulating rating distribution - in a real app, get this from contract
                          const percent = rating === 5 ? 70 : 
                                         rating === 4 ? 20 : 
                                         rating === 3 ? 5 : 
                                         rating === 2 ? 3 : 2;
                          
                          return (
                            <div key={rating} className="flex items-center gap-2">
                              <div className="flex items-center w-12">
                                <span className="text-sm">{rating}</span>
                                <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                              </div>
                              <Progress value={percent} className="h-2 flex-1" />
                              <span className="text-sm text-muted-foreground w-8 text-right">
                                {percent}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`/api/metadata?address=${selectedMentor.address}`, '_blank')}
                      >
                        View Profile
                      </Button>
                      <Button
                        onClick={() => window.location.href = `/sessions/new?mentor=${selectedMentor.address}`}
                      >
                        Request Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 