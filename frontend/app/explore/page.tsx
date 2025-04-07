"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MentorshipCard } from "@/components/mentorship-card";
import { useWeb3 } from "@/lib/web3-context";
import { useState, useEffect } from "react";
import { Compass, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ExplorePage() {
  const { contracts, walletStatus } = useWeb3();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const allSkills = [
    "Blockchain", "Smart Contracts", "Solidity", "Web Development",
    "Design", "Marketing", "Finance", "Legal", "Project Management"
  ];
  
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
                try {
                  averageRating = await contracts.getMentorAverageRating(address);
                } catch (error) {
                  console.error("Error fetching rating:", error);
                  averageRating = 0;
                }
                
                return {
                  address,
                  ...profile,
                  averageRating: averageRating / 10, // Assuming rating is stored as 0-50 (0-5.0)
                };
              } catch (error) {
                console.error("Error fetching mentor profile:", error);
                return null;
              }
            })
          );
          
          // Filter out any null profiles
          setMentors(mentorProfiles.filter(profile => profile !== null));
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
  
  // Filter mentors based on search term and selected skills
  const filteredMentors = mentors.filter(mentor => {
    // Filter by search term
    const matchesSearch = 
      searchTerm === "" || 
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by selected skills
    const matchesSkills = 
      selectedSkills.length === 0 || 
      mentor.skills.some((skill: string) => 
        selectedSkills.includes(skill)
      );
    
    return matchesSearch && matchesSkills;
  });
  
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  
  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Compass className="mr-2 h-8 w-8 text-primary" />
            Explore Mentors
          </h1>
          <p className="text-muted-foreground">
            Find the perfect mentor to help you develop your skills
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or skill..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" className="flex items-center justify-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {/* Skills filter */}
        <div className="flex flex-wrap gap-2">
          {allSkills.map(skill => (
            <Badge 
              key={skill}
              variant={selectedSkills.includes(skill) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : walletStatus !== "connected" ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to view available mentors
              </CardDescription>
            </CardHeader>
          </Card>
        ) : filteredMentors.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Mentors Found</CardTitle>
              <CardDescription>
                {searchTerm || selectedSkills.length > 0 
                  ? "No mentors match your search criteria. Try adjusting your filters."
                  : "There are no mentors registered yet."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor, index) => (
              <MentorshipCard
                key={index}
                name={mentor.name}
                skills={mentor.skills}
                rate={`${Number(mentor.hourlyRate.toString()) / 1e18} ROXN/hour`}
                rating={mentor.averageRating}
                image="/placeholder.svg?height=300&width=300"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 