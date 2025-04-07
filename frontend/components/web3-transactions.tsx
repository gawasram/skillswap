"use client";

import { useState } from "react";
import { useWeb3, Transaction } from "@/lib/web3-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, CheckCircle, ExternalLink, ArrowRight } from "lucide-react";
import * as ethers from "ethers";
import { toast } from "@/components/ui/use-toast";

export function Web3Transactions() {
  const { walletStatus, walletAddress, chainId, transactions, sendTransaction, getNetworkInfo } = useWeb3();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const networkInfo = getNetworkInfo();
  
  // Handle transaction form submission
  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (!ethers.utils.isAddress(recipient)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await sendTransaction(recipient, amount, data || undefined);
      
      // Reset form on success
      setRecipient("");
      setAmount("");
      setData("");
    } catch (error: any) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction error",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (walletStatus !== "connected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Connect your wallet to view and create transactions</CardDescription>
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
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Wallet Transactions</CardTitle>
        <CardDescription>Send and track your transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="send">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send" className="mt-4">
            <form onSubmit={handleSendTransaction}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({networkInfo?.currency || 'ETH'})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data">Data (optional)</Label>
                  <Input
                    id="data"
                    placeholder="0x..."
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hexadecimal data for the transaction (for advanced users)
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !recipient || !amount}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Transaction
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-full bg-primary-50 p-3">
                    <CheckCircle className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium">No transactions yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your transaction history will appear here after you make your first transaction.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-md border">
                  {transactions.map((tx, index) => (
                    <TransactionItem 
                      key={tx.hash || index} 
                      transaction={tx} 
                      networkInfo={networkInfo}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
        <div>Connected: {walletAddress?.substring(0, 6)}...{walletAddress?.substring(38)}</div>
        <div>Network: {networkInfo?.name || `Chain ID ${chainId}`}</div>
      </CardFooter>
    </Card>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
  networkInfo: {
    explorerUrl: string;
  } | null;
}

function TransactionItem({ transaction, networkInfo }: TransactionItemProps) {
  const { hash, status, timestamp, description } = transaction;
  
  const formattedDate = new Date(timestamp).toLocaleString();
  
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {status === "pending" ? (
            <div className="rounded-full bg-amber-100 p-1">
              <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
            </div>
          ) : status === "success" ? (
            <div className="rounded-full bg-green-100 p-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          ) : (
            <div className="rounded-full bg-red-100 p-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{description}</p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
          {hash && hash !== "pending" && (
            <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
              {hash}
            </p>
          )}
        </div>
      </div>
      {hash && hash !== "pending" && networkInfo && (
        <a
          href={`${networkInfo.explorerUrl}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center text-xs text-primary hover:underline"
        >
          View <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      )}
    </div>
  );
} 