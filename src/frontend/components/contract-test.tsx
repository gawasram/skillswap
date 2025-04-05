"use client";

import { useState, useEffect } from "react";
import { useWeb3 } from "@/lib/web3-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users, 
  Calendar,
  CreditCard,
  Wrench
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { 
  Loader2, 
  Info
} from "lucide-react";

export function ContractTest() {
  const { walletStatus, walletAddress, chainId, contracts } = useWeb3();
  
  // Test states
  const [loading, setLoading] = useState(false);
  const [contractStatus, setContractStatus] = useState<Record<string, { status: "success" | "error" | "pending" | "idle", message: string }>>({
    mentorRegistry: { status: "idle", message: "Not tested" },
    sessionManager: { status: "idle", message: "Not tested" },
    reputationSystem: { status: "idle", message: "Not tested" },
    mentorshipToken: { status: "idle", message: "Not tested" },
    write: { status: "idle", message: "Not tested" }
  });
  
  const [mentorCount, setMentorCount] = useState<number | null>(null);
  const [tokenName, setTokenName] = useState<string | null>(null);
  const [isMentor, setIsMentor] = useState<boolean | null>(null);
  
  // Check if wallet is connected
  if (walletStatus !== "connected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Contract Test</CardTitle>
          <CardDescription>Connect your wallet to test contract functionality</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <p className="text-center text-muted-foreground">Please connect your wallet to test the smart contracts</p>
        </CardContent>
      </Card>
    );
  }
  
  // Function to test MentorRegistry read
  const testMentorRegistry = async () => {
    if (!contracts) return;
    
    try {
      setContractStatus(prev => ({
        ...prev,
        mentorRegistry: { status: "pending", message: "Testing..." }
      }));
      
      // Get mentor count (using getAllMentors instead of getMentorCount which doesn't exist)
      const mentors = await contracts.getAllMentors();
      const count = mentors.length;
      setMentorCount(count);
      
      // Check if current address is a mentor
      if (walletAddress) {
        try {
          const profile = await contracts.getMentorProfile(walletAddress);
          setIsMentor(profile.isActive);
        } catch (error) {
          console.log("Not registered as mentor");
          setIsMentor(false);
        }
      }
      
      setContractStatus(prev => ({
        ...prev,
        mentorRegistry: { 
          status: "success", 
          message: `Successfully connected! Found ${count} mentors.`
        }
      }));
      
    } catch (error: any) {
      console.error("MentorRegistry test failed:", error);
      setContractStatus(prev => ({
        ...prev,
        mentorRegistry: { 
          status: "error", 
          message: `Error: ${error.message || "Could not connect to MentorRegistry"}`
        }
      }));
    }
  };
  
  // Function to test SessionManager read
  const testSessionManager = async () => {
    if (!contracts) return;
    
    try {
      setContractStatus(prev => ({
        ...prev,
        sessionManager: { status: "pending", message: "Testing..." }
      }));
      
      // Get session count for current user (as mentee)
      if (walletAddress) {
        try {
          const sessions = await contracts.getMenteeSessions(walletAddress);
          setContractStatus(prev => ({
            ...prev,
            sessionManager: { 
              status: "success", 
              message: `Successfully connected! Found ${sessions.length} sessions for your address.`
            }
          }));
        } catch (error: any) {
          // Handle ENS-specific errors
          if (error.message && error.message.includes('does not support ENS')) {
            console.warn("ENS resolution error in SessionManager test, retrying with direct address");
            // Try again with the address directly (no ENS resolution)
            const sessions = await contracts.getMenteeSessions(walletAddress);
            setContractStatus(prev => ({
              ...prev,
              sessionManager: { 
                status: "success", 
                message: `Successfully connected! Found ${sessions.length} sessions for your address.`
              }
            }));
          } else {
            throw error;
          }
        }
      }
      
    } catch (error: any) {
      console.error("SessionManager test failed:", error);
      
      // Provide a more user-friendly error message
      let errorMessage = "Could not connect to SessionManager";
      if (error.message) {
        if (error.message.includes('does not support ENS')) {
          errorMessage = "Network compatibility issue - ENS not supported on XDC network";
        } else if (error.message.includes('call revert exception')) {
          errorMessage = "Contract call failed - the contract may not be properly deployed";
        } else {
          errorMessage = error.message;
        }
      }
      
      setContractStatus(prev => ({
        ...prev,
        sessionManager: { 
          status: "error", 
          message: `Error: ${errorMessage}`
        }
      }));
    }
  };
  
  // Function to test MentorshipToken read
  const testMentorshipToken = async () => {
    if (!contracts) return;
    
    try {
      setContractStatus(prev => ({
        ...prev,
        mentorshipToken: { status: "pending", message: "Testing..." }
      }));
      
      // Get token name and symbol
      try {
        const name = await contracts.getTokenName();
        const symbol = await contracts.getTokenSymbol();
        setTokenName(`${name} (${symbol})`);
        
        // Get balance for current address
        if (walletAddress) {
          const balance = await contracts.getTokenBalance(walletAddress);
          // Convert balance to a more readable format using simple division
          // Assuming the token has 18 decimals like most ERC20 tokens
          const formattedBalance = (Number(balance) / 10**18).toFixed(4);
          
          setContractStatus(prev => ({
            ...prev,
            mentorshipToken: { 
              status: "success", 
              message: `Successfully connected! Token: ${name} (${symbol}), Balance: ${formattedBalance} ${symbol}`
            }
          }));
        }
      } catch (ensError: any) {
        // Handle ENS-specific errors
        if (ensError.message && ensError.message.includes('does not support ENS')) {
          console.warn("ENS resolution error in token test, retrying with direct calls");
          
          // Try again with direct calls
          const name = await contracts.getTokenName();
          const symbol = await contracts.getTokenSymbol();
          setTokenName(`${name} (${symbol})`);
          
          if (walletAddress) {
            const balance = await contracts.getTokenBalance(walletAddress);
            // Convert balance to a more readable format using simple division
            // Assuming the token has 18 decimals like most ERC20 tokens
            const formattedBalance = (Number(balance) / 10**18).toFixed(4);
            
            setContractStatus(prev => ({
              ...prev,
              mentorshipToken: { 
                status: "success", 
                message: `Successfully connected! Token: ${name} (${symbol}), Balance: ${formattedBalance} ${symbol}`
              }
            }));
          }
        } else {
          throw ensError;
        }
      }
    } catch (error: any) {
      console.error("MentorshipToken test failed:", error);
      
      // Provide a more user-friendly error message
      let errorMessage = "Could not connect to MentorshipToken";
      if (error.message) {
        if (error.message.includes('does not support ENS')) {
          errorMessage = "Network compatibility issue - ENS not supported on XDC network";
        } else if (error.message.includes('call revert exception')) {
          errorMessage = "Contract call failed - the contract may not be properly deployed";
        } else {
          errorMessage = error.message;
        }
      }
      
      setContractStatus(prev => ({
        ...prev,
        mentorshipToken: { 
          status: "error", 
          message: `Error: ${errorMessage}`
        }
      }));
    }
  };
  
  // Function to test ReputationSystem read
  const testReputationSystem = async () => {
    if (!contracts) return;
    
    try {
      setContractStatus(prev => ({
        ...prev,
        reputationSystem: { status: "pending", message: "Testing..." }
      }));
      
      // Get rating count for current address
      if (walletAddress) {
        try {
          // Simple approach without any address manipulation in the component
          // Let the contract service handle the address format
          const ratingCount = await contracts.getMentorRatingCount(walletAddress);
          const countString = String(ratingCount);
          
          setContractStatus(prev => ({
            ...prev,
            reputationSystem: { 
              status: "success", 
              message: `Successfully connected! Rating count: ${countString}`
            }
          }));
        } catch (error: any) {
          console.error("Initial ReputationSystem test failed:", error);
          throw error; // Let the outer catch handle error messaging
        }
      }
    } catch (error: any) {
      console.error("ReputationSystem test failed:", error);
      
      // Provide a more user-friendly error message
      let errorMessage = "Could not connect to ReputationSystem";
      if (error.message) {
        if (error.message.includes('does not support ENS')) {
          errorMessage = "Network compatibility issue - ENS not supported on XDC network";
        } else if (error.message.includes('call revert exception')) {
          errorMessage = "Contract call failed - the contract may not be properly deployed";
        } else if (error.message.includes('resolver or addr is not configured')) {
          errorMessage = "Address format issue - please try a different address format";
        } else {
          errorMessage = error.message;
        }
      }
      
      setContractStatus(prev => ({
        ...prev,
        reputationSystem: { 
          status: "error", 
          message: `Error: ${errorMessage}`
        }
      }));
    }
  };
  
  // Function to test a write operation (register as mentor)
  const testWriteOperation = async () => {
    if (!contracts) return;
    
    try {
      setContractStatus(prev => ({
        ...prev,
        write: { status: "pending", message: "Testing write operation..." }
      }));
      
      // If already a mentor, deactivate. If not, register as mentor
      if (isMentor) {
        // Deactivate mentor profile
        const tx = await contracts.deactivateMentor();
        await tx.wait();
        setIsMentor(false);
        
        setContractStatus(prev => ({
          ...prev,
          write: { 
            status: "success", 
            message: `Successfully deactivated mentor profile! Tx: ${tx.hash.substring(0, 10)}...`
          }
        }));
        
        toast({
          title: "Success!",
          description: "Your mentor profile has been deactivated",
        });
      } else {
        // Register as a new mentor
        const name = "Test Mentor";
        const skills = ["Testing", "Smart Contracts"];
        const hourlyRate = "0.1"; // Very low for testing
        const metadataURI = ""; // Empty for testing
        
        const tx = await contracts.registerMentor(name, skills, hourlyRate, metadataURI);
        await tx.wait();
        setIsMentor(true);
        
        setContractStatus(prev => ({
          ...prev,
          write: { 
            status: "success", 
            message: `Successfully registered as mentor! Tx: ${tx.hash.substring(0, 10)}...`
          }
        }));
        
        toast({
          title: "Success!",
          description: "You are now registered as a mentor",
        });
      }
      
      // Refresh mentor registry data
      testMentorRegistry();
      
    } catch (error: any) {
      console.error("Write operation failed:", error);
      setContractStatus(prev => ({
        ...prev,
        write: { 
          status: "error", 
          message: `Error: ${error.message || "Transaction failed"}`
        }
      }));
      
      toast({
        title: "Transaction failed",
        description: error.message || "Could not complete the operation",
        variant: "destructive",
      });
    }
  };
  
  // Function to test all read operations
  const testAllReadOperations = async () => {
    setLoading(true);
    try {
      await testMentorRegistry();
      await testSessionManager();
      await testMentorshipToken();
      await testReputationSystem();
    } catch (error) {
      console.error("Error testing contracts:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: "success" | "error" | "pending" | "idle") => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Success</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
      case "pending":
        return <Badge variant="outline" className="animate-pulse"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Testing...</Badge>;
      default:
        return <Badge variant="outline"><Info className="h-3 w-3 mr-1" /> Not Tested</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Smart Contract Connectivity Test</CardTitle>
        <CardDescription>
          Test connection to your SkillSwap smart contracts on XDC Testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between">
          <Button onClick={testAllReadOperations} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Test All Read Operations
          </Button>
          <Button 
            onClick={testWriteOperation} 
            disabled={loading || contractStatus.mentorRegistry.status !== "success"} 
            variant="default" 
            className="gap-2"
          >
            {isMentor ? "Deactivate Mentor Profile" : "Register as Test Mentor"}
          </Button>
        </div>
        
        <div className="divide-y">
          {/* Mentor Registry */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-medium">MentorRegistry Contract</h3>
              </div>
              {renderStatusBadge(contractStatus.mentorRegistry.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{contractStatus.mentorRegistry.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testMentorRegistry} 
              disabled={loading || contractStatus.mentorRegistry.status === "pending"}
              className="mt-2"
            >
              Test Mentor Registry
            </Button>
          </div>
          
          {/* Session Manager */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-medium">SessionManager Contract</h3>
              </div>
              {renderStatusBadge(contractStatus.sessionManager.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{contractStatus.sessionManager.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testSessionManager} 
              disabled={loading || contractStatus.sessionManager.status === "pending"}
              className="mt-2"
            >
              Test Session Manager
            </Button>
          </div>
          
          {/* Mentorship Token */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-medium">MentorshipToken Contract</h3>
              </div>
              {renderStatusBadge(contractStatus.mentorshipToken.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{contractStatus.mentorshipToken.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testMentorshipToken} 
              disabled={loading || contractStatus.mentorshipToken.status === "pending"}
              className="mt-2"
            >
              Test Token Contract
            </Button>
          </div>
          
          {/* Reputation System */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h3 className="font-medium">ReputationSystem Contract</h3>
              </div>
              {renderStatusBadge(contractStatus.reputationSystem.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{contractStatus.reputationSystem.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testReputationSystem} 
              disabled={loading || contractStatus.reputationSystem.status === "pending"}
              className="mt-2"
            >
              Test Reputation System
            </Button>
          </div>
          
          {/* Write Test */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Write Operation Test</h3>
              </div>
              {renderStatusBadge(contractStatus.write.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{contractStatus.write.message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 