"use client";

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { PlusCircle, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export function AddXdcNetwork() {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const addXdcTestnet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not detected",
        description: "Please install MetaMask extension and refresh the page",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x33", // 51 in hexadecimal
            chainName: "XDC Testnet (Apothem)",
            nativeCurrency: {
              name: "XDC",
              symbol: "XDC",
              decimals: 18,
            },
            rpcUrls: ["https://rpc.apothem.network"],
            blockExplorerUrls: ["https://explorer.apothem.network"],
          },
        ],
      });
      
      setIsAdded(true);
      toast({
        title: "Network added",
        description: "XDC Testnet has been added to your MetaMask",
      });
    } catch (error: any) {
      console.error("Error adding XDC Testnet:", error);
      toast({
        title: "Failed to add network",
        description: error.message || "Could not add XDC Testnet to MetaMask",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white font-bold text-xs">
            XDC
          </div>
          XDC Network
        </CardTitle>
        <CardDescription>
          Add XDC Testnet (Apothem) to your MetaMask
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted-foreground">Network Name</div>
            <div>XDC Testnet (Apothem)</div>
            
            <div className="text-muted-foreground">RPC URL</div>
            <div className="break-all">https://rpc.apothem.network</div>
            
            <div className="text-muted-foreground">Chain ID</div>
            <div>51</div>
            
            <div className="text-muted-foreground">Currency Symbol</div>
            <div>XDC</div>
            
            <div className="text-muted-foreground">Block Explorer</div>
            <div className="break-all">https://explorer.apothem.network</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          asChild
        >
          <a 
            href="https://www.xinfin.io/xdc-faucet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            Get Test XDC <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        
        <Button 
          onClick={addXdcTestnet} 
          disabled={isAdding || isAdded}
          className="flex items-center gap-1"
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4" /> Network Added
            </>
          ) : isAdding ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Adding...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" /> Add to MetaMask
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 