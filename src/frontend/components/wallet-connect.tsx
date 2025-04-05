"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Wallet, AlertTriangle, CheckCircle, Loader2, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useWeb3, WalletStatus, TransactionStatus, NETWORKS, ChainId } from "@/lib/web3-context"
import { toast } from "@/components/ui/use-toast"

interface WalletConnectProps {
  showDetails?: boolean
}

// Add a function to format wallet address for display
const formatAddressForDisplay = (address: string | null, chainId: ChainId | null): string => {
  if (!address) return '';
  
  // Determine prefix based on chain ID
  const prefix = (chainId === 50 || chainId === 51) ? 'xdc' : '0x';
  
  // Get the first 6 chars (excluding prefix) and last 4 chars
  const start = address.startsWith(prefix) ? prefix + address.slice(prefix.length, prefix.length + 4) : address.slice(0, 6);
  const end = address.slice(-4);
  
  return `${start}...${end}`;
};

export function WalletConnect({ showDetails = false }: WalletConnectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const { 
    walletStatus, 
    walletAddress,
    walletBalance,
    chainId,
    transactions,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    reconnectWallet
  } = useWeb3()

  // Add a useEffect to detect provider errors and handle reconnection
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    const handleError = async (error: any) => {
      console.error("Provider error detected:", error);
      
      // Check if it's a network mismatch error
      if (
        error?.message?.includes("underlying network changed") ||
        error?.message?.includes("network changed") ||
        error?.message?.includes("NETWORK_ERROR") ||
        error?.code === "NETWORK_ERROR"
      ) {
        console.log("Network mismatch detected, attempting to reconnect");
        setNetworkError(true);
        
        try {
          // Wait a moment to allow MetaMask to fully switch networks
          setTimeout(async () => {
            await reconnectWallet();
            setNetworkError(false);
          }, 1000);
        } catch (reconnectError) {
          console.error("Failed to automatically reconnect after network change:", reconnectError);
        }
      }
    };
    
    // Add listener for error events
    window.ethereum.on("error", handleError);
    
    return () => {
      window.ethereum.removeListener("error", handleError);
    };
  }, [reconnectWallet]);

  const handleConnectWallet = async () => {
    try {
      // Add debugging to check if window.ethereum exists
      if (!window.ethereum) {
        console.error("MetaMask not detected: window.ethereum is undefined");
        toast({
          title: "MetaMask not detected",
          description: "Please install MetaMask extension and refresh the page",
          variant: "destructive",
        });
        return;
      }
      
      console.log("MetaMask detected, attempting to connect...");
      
      // Check if ethereum is locked
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts',
          params: []
        });
        console.log("Current accounts:", accounts);
      } catch (e) {
        console.error("Error checking accounts:", e);
      }
      
      await connectWallet();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }

  const handleSendTransaction = async () => {
    if (!walletAddress) return;
    
    try {
      // For demonstration purposes - in a real app, these would be inputs from a form
      const to = walletAddress; // sending to self for demo
      const amount = "0.001"; // small amount for testing
      
      await sendTransaction(to, amount);
    } catch (error: any) {
      console.error("Failed to send transaction:", error);
    }
  }

  const currentNetworkInfo = chainId ? NETWORKS[chainId] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      {networkError && walletStatus !== "connected" ? (
        <Button 
          variant="destructive" 
          className="gap-2 animate-pulse" 
          onClick={() => reconnectWallet()}
        >
          <AlertTriangle className="h-4 w-4" />
          Network Changed - Reconnect
        </Button>
      ) : walletStatus === "disconnected" ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border border-primary-100">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg blur opacity-10"></div>
            <DialogHeader className="relative">
              <DialogTitle className="text-primary-700">Connect your wallet</DialogTitle>
              <DialogDescription>Choose a wallet to connect to SkillSwap</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 relative">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all"
                onClick={handleConnectWallet}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <img src="/metamask-fox.svg" alt="MetaMask" className="h-8 w-8" />
                </div>
                <span className="font-medium text-primary-700">MetaMask</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all"
                disabled
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <img src="/walletconnect-logo.svg" alt="WalletConnect" className="h-8 w-8" />
                </div>
                <span className="font-medium text-primary-700">WalletConnect</span>
                <span className="text-xs text-gray-500">Coming soon</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all"
                disabled
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <img src="/coinbase-logo.svg" alt="Coinbase Wallet" className="h-8 w-8" />
                </div>
                <span className="font-medium text-primary-700">Coinbase</span>
                <span className="text-xs text-gray-500">Coming soon</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all opacity-60"
                disabled
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <img src="/more-wallets.svg" alt="More Wallets" className="h-8 w-8 opacity-50" />
                </div>
                <span className="font-medium text-gray-500">More Coming</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : walletStatus === "connecting" ? (
        <Button disabled className="gap-2 bg-primary-100 text-primary-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting...
        </Button>
      ) : walletStatus === "connected" ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
            onClick={() => disconnectWallet()}
          >
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="truncate max-w-[100px]">
              {walletAddress ? formatAddressForDisplay(walletAddress, chainId) : ''}
            </span>
          </Button>
          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendTransaction}
              disabled={transactions.some(tx => tx.status === "pending")}
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
            >
              {transactions.some(tx => tx.status === "pending") ? 
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign Transaction
            </Button>
          )}
        </div>
      ) : (
        <Button variant="destructive" className="gap-2" onClick={() => connectWallet()}>
          <AlertTriangle className="h-4 w-4" />
          Retry Connection
        </Button>
      )}

      {showDetails && walletStatus === "connected" && (
        <Card className="w-full max-w-md border border-primary-100 shadow-md overflow-hidden">
          <div className="absolute h-1 top-0 left-0 right-0 bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-primary-50 transition-colors">
                <span className="text-muted-foreground">Wallet Type</span>
                <span className="font-medium text-primary-700 flex items-center gap-1">
                  MetaMask
                  <ExternalLink className="h-3 w-3 text-primary-400" />
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-primary-50 transition-colors">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-primary-700 text-sm">
                  {walletAddress}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-primary-50 transition-colors">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-medium text-primary-700">{walletBalance}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-primary-50 transition-colors">
                <span className="text-muted-foreground">Network</span>
                <select
                  className="bg-transparent border-none font-medium cursor-pointer focus:outline-none text-primary-700"
                  value={chainId?.toString() || "1"}
                  onChange={(e) => switchNetwork(parseInt(e.target.value) as ChainId)}
                >
                  {Object.entries(NETWORKS).map(([id, network]) => (
                    <option key={id} value={id}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Transaction History */}
              {transactions.length > 0 && (
                <div className="mt-4 border-t border-primary-100 pt-4">
                  <h3 className="text-sm font-medium text-primary-700 mb-2">Recent Transactions</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {transactions.map((tx, index) => (
                      <div 
                        key={tx.hash || index} 
                        className="text-xs p-2 rounded-md border border-primary-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {tx.status === "pending" ? (
                            <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                          ) : tx.status === "success" ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                          <span className="text-muted-foreground truncate max-w-[180px]">
                            {tx.description}
                          </span>
                        </div>
                        {tx.hash !== "pending" && (
                          <a 
                            href={`${currentNetworkInfo?.explorerUrl}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:text-primary-600"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Error Handling UI */}
      {walletStatus === "error" && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            There was an error connecting to your wallet. Please make sure MetaMask is installed and unlocked.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

