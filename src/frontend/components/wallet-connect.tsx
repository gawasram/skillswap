"use client"

import { useState } from "react"
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

// Mock Web3 wallet types and functions for demonstration
type WalletStatus = "disconnected" | "connecting" | "connected" | "error"
type TransactionStatus = "none" | "pending" | "success" | "error"
type WalletType = "metamask" | "walletconnect" | "coinbase"

interface WalletConnectProps {
  showDetails?: boolean
}

export function WalletConnect({ showDetails = false }: WalletConnectProps) {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("disconnected")
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [walletBalance, setWalletBalance] = useState<string>("")
  const [walletType, setWalletType] = useState<WalletType | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>("none")
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Mock function to connect wallet
  const connectWallet = async (type: WalletType) => {
    try {
      setWalletStatus("connecting")
      setWalletType(type)
      setError(null)

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock successful connection
      setWalletStatus("connected")
      setWalletAddress("0x1234...5678")
      setWalletBalance("1.25 ETH")
      setIsDialogOpen(false)
    } catch (err) {
      setWalletStatus("error")
      setError("Failed to connect wallet. Please try again.")
    }
  }

  // Mock function to disconnect wallet
  const disconnectWallet = async () => {
    try {
      // Simulate disconnection delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      setWalletStatus("disconnected")
      setWalletAddress("")
      setWalletBalance("")
      setWalletType(null)
    } catch (err) {
      setError("Failed to disconnect wallet. Please try again.")
    }
  }

  // Mock function to sign a transaction
  const signTransaction = async () => {
    try {
      setTransactionStatus("pending")
      setError(null)

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock successful transaction
      setTransactionStatus("success")

      // Reset transaction status after a delay
      setTimeout(() => {
        setTransactionStatus("none")
      }, 3000)
    } catch (err) {
      setTransactionStatus("error")
      setError("Transaction failed. Please try again.")

      // Reset transaction status after a delay
      setTimeout(() => {
        setTransactionStatus("none")
      }, 3000)
    }
  }

  // Mock function to switch networks
  const switchNetwork = async (networkId: string) => {
    try {
      setWalletStatus("connecting")
      setError(null)

      // Simulate network switching delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock successful network switch
      setWalletStatus("connected")
    } catch (err) {
      setError("Failed to switch network. Please try again.")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {walletStatus === "disconnected" ? (
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
                onClick={() => connectWallet("metamask")}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <img src="/placeholder.svg?height=40&width=40" alt="MetaMask" className="h-8 w-8" />
                </div>
                <span className="font-medium text-primary-700">MetaMask</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all"
                onClick={() => connectWallet("walletconnect")}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <img src="/placeholder.svg?height=40&width=40" alt="WalletConnect" className="h-8 w-8" />
                </div>
                <span className="font-medium text-primary-700">WalletConnect</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all"
                onClick={() => connectWallet("coinbase")}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <img src="/placeholder.svg?height=40&width=40" alt="Coinbase Wallet" className="h-8 w-8" />
                </div>
                <span className="font-medium text-primary-700">Coinbase</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all opacity-60"
                disabled
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <img src="/placeholder.svg?height=40&width=40" alt="More Wallets" className="h-8 w-8 opacity-50" />
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
            <span className="truncate max-w-[100px]">{walletAddress}</span>
          </Button>
          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signTransaction()}
              disabled={transactionStatus === "pending"}
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
            >
              {transactionStatus === "pending" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign Transaction
            </Button>
          )}
        </div>
      ) : (
        <Button variant="destructive" className="gap-2" onClick={() => setWalletStatus("disconnected")}>
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
                  {walletType === "metamask"
                    ? "MetaMask"
                    : walletType === "walletconnect"
                      ? "WalletConnect"
                      : "Coinbase"}
                  <ExternalLink className="h-3 w-3 text-primary-400" />
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-primary-50 transition-colors">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-primary-700">{walletAddress}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-primary-50 transition-colors">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-medium text-primary-700">{walletBalance}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-primary-50 transition-colors">
                <span className="text-muted-foreground">Network</span>
                <select
                  className="bg-transparent border-none font-medium cursor-pointer focus:outline-none text-primary-700"
                  onChange={(e) => switchNetwork(e.target.value)}
                >
                  <option value="1">Ethereum Mainnet</option>
                  <option value="137">Polygon</option>
                  <option value="56">BSC</option>
                  <option value="42161">Arbitrum</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {transactionStatus === "success" && (
        <Alert className="mt-4 border-green-200 bg-green-50 text-green-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Transaction completed successfully!</AlertDescription>
        </Alert>
      )}

      {transactionStatus === "error" && (
        <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Transaction Failed</AlertTitle>
          <AlertDescription>Please try again or contact support.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

