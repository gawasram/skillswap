"use client";

import { WalletConnect } from "@/components/wallet-connect";
import { Web3Transactions } from "@/components/web3-transactions";
import { MetaMaskHelp } from "@/components/metamask-help";
import { AddXdcNetwork } from "@/components/add-xdc-network";
import { useWeb3 } from "@/lib/web3-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { ContractInteraction } from "@/components/contract-interaction";
import { ContractTest } from "@/components/contract-test";
import { SessionRatingTester } from "@/components/session-rating-tester";
import React from "react";

export default function WalletPage() {
  const { walletStatus, walletAddress, walletBalance, chainId, getNetworkInfo, reconnectWallet } = useWeb3();
  const networkInfo = getNetworkInfo();
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState<boolean | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const hasRefreshedBalance = React.useRef(false);
  
  // Check if MetaMask is available
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      setIsMetaMaskAvailable(!!window.ethereum);
    }
  }, []);
  
  // Force balance refresh when wallet page loads - but only once
  useEffect(() => {
    const refreshBalance = async () => {
      if (walletStatus === "connected" && window.ethereum && !hasRefreshedBalance.current) {
        try {
          hasRefreshedBalance.current = true; // Mark as refreshed to prevent loops
          await reconnectWallet();
          console.log("Wallet balance refreshed successfully");
        } catch (error) {
          console.error("Error refreshing wallet balance:", error);
          hasRefreshedBalance.current = false; // Reset on error to allow retry
        }
      }
    };
    
    // Run once when component mounts and wallet is connected
    if (walletStatus === "connected" && !hasRefreshedBalance.current) {
      refreshBalance();
    }
    
    return () => {
      // No need to reset the ref on unmount as it will be garbage collected with the component
    };
  }, [walletStatus, reconnectWallet]);
  
  // Handle provider errors
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum || walletStatus !== "connected") return;
    
    const handleProviderError = async (error: any) => {
      console.error("Wallet provider error:", error);
      
      if (
        error?.message?.includes("underlying network changed") ||
        error?.message?.includes("network changed") ||
        error?.message?.includes("NETWORK_ERROR") ||
        error?.code === "NETWORK_ERROR"
      ) {
        setNetworkError("Network changed. Please reconnect your wallet.");
      }
    };
    
    // Add window error listener
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && typeof event.reason === 'object') {
        handleProviderError(event.reason);
      }
    });
    
    return () => {
      window.removeEventListener('unhandledrejection', (event) => {
        if (event.reason && typeof event.reason === 'object') {
          handleProviderError(event.reason);
        }
      });
    };
  }, [walletStatus, reconnectWallet]);
  
  // Handle reconnect
  const handleReconnect = async () => {
    try {
      setNetworkError(null);
      await reconnectWallet();
    } catch (error) {
      console.error("Failed to reconnect wallet:", error);
    }
  };

  // Show loading state until we've checked for MetaMask
  if (isMetaMaskAvailable === null) {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }
  
  // Show help component if MetaMask is not available
  if (isMetaMaskAvailable === false) {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Wallet Dashboard</h1>
          <p className="text-muted-foreground">
            MetaMask is required to use the wallet features.
          </p>
          <MetaMaskHelp />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Wallet Dashboard</h1>
          <p className="text-muted-foreground">
            Connect your wallet and manage your cryptocurrency transactions.
          </p>
        </div>
        
        {/* Show network error banner if there's an error */}
        {networkError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Error Detected</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{networkError}</span>
              <Button size="sm" onClick={handleReconnect}>
                Reconnect Wallet
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Your Wallet</h2>
            <p className="text-sm text-muted-foreground">Connect to view your balance and transactions</p>
          </div>
          <WalletConnect showDetails={false} />
        </div>
        
        {walletStatus === "connected" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Balance</CardTitle>
                  <CardDescription>Your current wallet balance</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {walletBalance || `0.00 ${networkInfo?.currency || 'ETH'}`}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2 h-5 w-5 opacity-70 hover:opacity-100"
                    onClick={() => reconnectWallet()}
                    title="Refresh Balance"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-0 scale-100 transition-all">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                  </Button>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Network: {networkInfo?.name || `Chain ID ${chainId}`}
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Address</CardTitle>
                  <CardDescription>Your connected wallet address</CardDescription>
                </CardHeader>
                <CardContent>
                  <code className="bg-muted p-2 rounded-md text-xs block overflow-x-auto">
                    {walletAddress}
                  </code>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Connected via MetaMask
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Network</CardTitle>
                  <CardDescription>Current blockchain network</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium">{networkInfo?.name || `Chain ID ${chainId}`}</span>
                  </div>
                  {networkInfo && (
                    <p className="text-sm text-muted-foreground">
                      Currency: {networkInfo.currency}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  <a 
                    href={networkInfo?.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View in Explorer
                  </a>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">XDC Network Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    We've detected you're using the XDC network (Chain ID: 51). This section helps you configure and manage your XDC wallet connection.
                  </p>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>XDC Address Format</AlertTitle>
                    <AlertDescription>
                      XDC uses a different address format than Ethereum. Addresses start with "xdc" instead of "0x". Make sure you're using the correct format when sending transactions.
                    </AlertDescription>
                  </Alert>
                </div>
                <AddXdcNetwork />
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Test Smart Contracts</h2>
              <ContractTest />
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">SkillSwap Contracts</h2>
              <ContractInteraction />
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Session & Rating Testing</h2>
              <SessionRatingTester />
            </div>
          </>
        ) : (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>Wallet not connected</AlertTitle>
            <AlertDescription>
              Connect your wallet to view your balance and make transactions.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="pt-4">
          <Web3Transactions />
        </div>
        
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Web3 Wallet Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>How to use Web3 wallets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  Web3 wallets like MetaMask are your gateway to decentralized applications and blockchain transactions.
                </p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>Install a Web3 wallet like MetaMask from their official website</li>
                  <li>Create or import a wallet with your secret recovery phrase</li>
                  <li>Connect your wallet to this application using the "Connect Wallet" button</li>
                  <li>Ensure you have some funds for transaction fees (gas)</li>
                </ol>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Get MetaMask
                  </a>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Tips</CardTitle>
                <CardDescription>Keep your assets safe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  When using Web3 wallets, security should be your top priority. Follow these best practices:
                </p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Never share your secret recovery phrase or private keys with anyone</li>
                  <li>Always verify transaction details before confirming</li>
                  <li>Be cautious of phishing attempts and only use official websites</li>
                  <li>Consider using a hardware wallet for large amounts</li>
                  <li>Keep your browser and wallet extensions up to date</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Alert variant="destructive" className="p-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-xs">Warning</AlertTitle>
                  <AlertDescription className="text-xs">
                    This platform will never ask for your private keys or seed phrase.
                  </AlertDescription>
                </Alert>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 