"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as ethers from "ethers";
import { toast } from "@/components/ui/use-toast";
import { getContractsInstance, SkillSwapContracts } from "./contracts";

// Define types
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";
export type TransactionStatus = "none" | "pending" | "success" | "error";
export type ChainId = number;
export type NetworkInfo = {
  name: string;
  chainId: ChainId;
  rpcUrl: string;
  currency: string;
  explorerUrl: string;
};

// Convert between 0x and xdc address formats
export const formatAddress = (address: string, chainId: number | null): string => {
  if (chainId === 51 || chainId === 50) { // XDC Mainnet is 50, Testnet is 51
    // Convert 0x to xdc if it's an XDC network
    if (address.startsWith('0x')) {
      return 'xdc' + address.slice(2);
    }
  } else {
    // Convert xdc to 0x for other networks
    if (address.startsWith('xdc')) {
      return '0x' + address.slice(3);
    }
  }
  return address;
};

// Define supported networks
export const NETWORKS: Record<ChainId, NetworkInfo> = {
  1: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/your-infura-id",
    currency: "ETH",
    explorerUrl: "https://etherscan.io",
  },
  137: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    currency: "MATIC",
    explorerUrl: "https://polygonscan.com",
  },
  56: {
    name: "Binance Smart Chain",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    currency: "BNB",
    explorerUrl: "https://bscscan.com",
  },
  42161: {
    name: "Arbitrum",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    currency: "ETH",
    explorerUrl: "https://arbiscan.io",
  },
  51: {
    name: "XDC Testnet (Apothem)",
    chainId: 51,
    rpcUrl: "https://rpc.apothem.network",
    currency: "XDC",
    explorerUrl: "https://explorer.apothem.network",
  }
};

// Define transaction interface
export interface Transaction {
  hash: string;
  status: TransactionStatus;
  timestamp: number;
  description: string;
}

// Define Web3Context interface
interface Web3ContextType {
  walletStatus: WalletStatus;
  walletAddress: string | null;
  walletBalance: string | null;
  chainId: ChainId | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  transactions: Transaction[];
  contracts: SkillSwapContracts | null;
  
  connectWallet: () => Promise<string | void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: ChainId) => Promise<void>;
  sendTransaction: (to: string, amount: string, data?: string) => Promise<string | null>;
  getNetworkInfo: () => NetworkInfo | null;
  reconnectWallet: () => Promise<string>;
}

// Create context with default values
const Web3Context = createContext<Web3ContextType>({
  walletStatus: "disconnected",
  walletAddress: null,
  walletBalance: null,
  chainId: null,
  provider: null,
  signer: null,
  transactions: [],
  contracts: null,
  
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  switchNetwork: async () => {},
  sendTransaction: async () => null,
  getNetworkInfo: () => null,
  reconnectWallet: async () => "",
});

// Create provider component
export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State variables
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("disconnected");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<ChainId | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // New state for contracts
  const [contracts, setContracts] = useState<SkillSwapContracts | null>(null);

  // Add global error handler for ENS resolution errors
  useEffect(() => {
    const handleUnhandledErrors = (event: ErrorEvent) => {
      // Check if it's an ENS resolution error
      if (event.error && event.error.message && 
          (event.error.message.includes('does not support ENS') ||
           event.error.message.includes('network does not support ENS'))) {
        // Prevent the default error handling
        event.preventDefault();
        console.log('Caught ENS resolution error:', event.error.message);
      }
    };

    // Add global error listener
    window.addEventListener('error', handleUnhandledErrors);

    // Clean up
    return () => {
      window.removeEventListener('error', handleUnhandledErrors);
    };
  }, []);

  // Update balance function - improved for large balances
  const updateBalance = useCallback(async () => {
    if (!window.ethereum || !walletAddress) return;
    
    try {
      // Get network information for the currency symbol
      const currentNetworkInfo = chainId ? NETWORKS[chainId] : null;
      const currencySymbol = currentNetworkInfo ? currentNetworkInfo.currency : 'ETH';
      
      // Format address properly for the balance check (always use 0x format for RPC)
      let addressForBalance = walletAddress;
      if (addressForBalance.startsWith('xdc')) {
        addressForBalance = '0x' + addressForBalance.slice(3);
      }
      
      console.log("Fetching balance for address:", addressForBalance);
      
      // Direct RPC call using MetaMask's provider
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [addressForBalance, 'latest'],
      });
      
      console.log("Raw balance hex:", balanceHex);
      
      try {
        // Use BigInt for handling large numbers without precision loss
        const balanceWei = BigInt(balanceHex);
        console.log("Balance in wei (BigInt):", balanceWei.toString());
        
        // Format to string with proper decimal places
        // To display XDC with proper decimals (18 decimals like ETH)
        // Convert to a string first
        const balanceWeiStr = balanceWei.toString();
        
        // Handle different cases for large and small balances
        let formattedBalance;
        if (balanceWeiStr.length <= 18) {
          // Less than 1 XDC
          const paddedStr = balanceWeiStr.padStart(18, '0');
          const decimalPart = paddedStr.padStart(19, '0'); // Add one more 0 for "0."
          formattedBalance = `0.${decimalPart.substring(1, 5)}`; // Show 4 decimal places
        } else {
          // More than 1 XDC
          const wholePart = balanceWeiStr.slice(0, balanceWeiStr.length - 18);
          const decimalPart = balanceWeiStr.slice(balanceWeiStr.length - 18).padEnd(18, '0');
          formattedBalance = `${wholePart}.${decimalPart.substring(0, 4)}`;
        }
        
        console.log("Formatted balance:", formattedBalance, currencySymbol);
        
        // Set the balance with correct currency
        setWalletBalance(`${formattedBalance} ${currencySymbol}`);
      } catch (parseError) {
        console.error("Error parsing balance:", parseError);
        
        // Fallback to the previous method
        const balanceInWei = parseInt(balanceHex, 16).toString();
        console.log("Fallback: Balance in wei (parseInt):", balanceInWei);
        
        // Use ethers to format if available
        try {
          const formattedBalance = ethers.utils.formatEther(balanceHex);
          const shortenedBalance = parseFloat(formattedBalance).toFixed(4);
          setWalletBalance(`${shortenedBalance} ${currencySymbol}`);
        } catch (ethersError) {
          // Last resort - use basic division
          const ethValue = parseInt(balanceInWei) / 1e18;
          const formattedBalance = ethValue.toFixed(4);
          setWalletBalance(`${formattedBalance} ${currencySymbol}`);
        }
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      // Set a default message with correct currency
      setWalletBalance(`0.00 ${chainId && NETWORKS[chainId] ? NETWORKS[chainId].currency : 'ETH'}`);
    }
  }, [walletAddress, chainId]);

  // Initialize wallet from localStorage on mount
  useEffect(() => {
    const connectOnMount = async () => {
      // Check for browser environment (prevent error during SSR)
      if (typeof window === 'undefined') {
        console.log('Running on server, skipping wallet reconnection');
        return;
      }
      
      // Check if previously connected
      const savedAddress = localStorage.getItem("walletAddress");
      
      if (savedAddress && window.ethereum) {
        try {
          console.log("Previously connected address found, attempting to reconnect:", savedAddress);
          await connectWallet();
        } catch (error) {
          console.error("Failed to reconnect wallet:", error);
          localStorage.removeItem("walletAddress");
        }
      }
    };
    
    connectOnMount();
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setWalletStatus("connecting");
      
      // Check if ethereum is available in the window object
      if (!window.ethereum) {
        console.error("No Ethereum browser extension detected");
        throw new Error("No Ethereum browser extension detected. Please install MetaMask.");
      }
      
      console.log("MetaMask detected, requesting accounts...");
      
      try {
        // Get chain ID first, so we know which network we're connecting to
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const currentChainId = parseInt(chainIdHex, 16);
        console.log("Detected chain ID:", currentChainId);
        
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        console.log("Accounts received:", accounts);
        
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned from MetaMask. User may have denied access.");
        }
        
        // Create provider with the correct network options
        const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
        console.log("Provider created successfully for network:", currentChainId);
        
        // Get signer and address
        const ethSigner = ethProvider.getSigner();
        const address = await ethSigner.getAddress();
        console.log("Connected to address:", address);
        
        // Format the address based on the network
        const formattedAddress = formatAddress(address, currentChainId);
        console.log("Formatted address for display:", formattedAddress);
        
        // Update state
        setProvider(ethProvider);
        setSigner(ethSigner);
        setWalletAddress(formattedAddress);
        setChainId(currentChainId);
        setWalletStatus("connected");
        
        // Save to localStorage for persistence
        localStorage.setItem("walletAddress", formattedAddress);
        
        // Update balance
        await updateBalance();
        
        toast({
          title: "Wallet connected",
          description: `Connected to ${formattedAddress.substring(0, 6)}...${formattedAddress.substring(38)}`,
        });
        
        // After successful connection, initialize contracts
        if (ethProvider && ethSigner) {
          const contractsService = getContractsInstance(ethProvider, ethSigner);
          try {
            await contractsService.initialize();
            setContracts(contractsService);
            console.log("Contracts initialized successfully");
          } catch (contractError) {
            console.error("Failed to initialize contracts:", contractError);
            // Continue even if contracts fail - they might not be deployed yet
          }
        }
        
        return formattedAddress;
      } catch (requestError: any) {
        console.error("Error requesting accounts:", requestError);
        throw new Error(requestError.message || "Failed to connect to MetaMask. User may have denied access.");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setWalletStatus("error");
      
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = async () => {
    setWalletStatus("disconnected");
    setWalletAddress(null);
    setWalletBalance(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setContracts(null);
    
    // Remove from localStorage
    localStorage.removeItem("walletAddress");
    
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Switch network function
  const switchNetwork = async (targetChainId: ChainId) => {
    if (!window.ethereum) {
      throw new Error("No Ethereum browser extension detected");
    }
    
    const networkInfo = NETWORKS[targetChainId];
    if (!networkInfo) {
      throw new Error(`Network configuration not found for chain ID ${targetChainId}`);
    }
    
    try {
      setWalletStatus("connecting");
      
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      
      // After switching, we need to recreate the provider to avoid network mismatch errors
      if (window.ethereum) {
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        
        const newSigner = newProvider.getSigner();
        const address = await newSigner.getAddress();
        const formattedAddress = formatAddress(address, targetChainId);
        
        // Update state with new provider and network
        setProvider(newProvider);
        setSigner(newSigner);
        setChainId(targetChainId);
        setWalletAddress(formattedAddress);
        setWalletStatus("connected");
        
        // Update balance with new network currency
        await updateBalance();
        
        toast({
          title: "Network changed",
          description: `Connected to ${networkInfo.name}`,
        });
        
        // After successful network switch, reinitialize contracts
        if (newProvider && newSigner) {
          const contractsService = getContractsInstance(newProvider, newSigner);
          try {
            await contractsService.initialize();
            setContracts(contractsService);
            console.log("Contracts reinitialized for new network");
          } catch (contractError) {
            console.error("Failed to reinitialize contracts for new network:", contractError);
            // Continue even if contracts fail
          }
        }
      }
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: networkInfo.name,
                nativeCurrency: {
                  name: networkInfo.currency,
                  symbol: networkInfo.currency,
                  decimals: 18,
                },
                rpcUrls: [networkInfo.rpcUrl],
                blockExplorerUrls: [networkInfo.explorerUrl],
              },
            ],
          });
          
          // After adding, we need to recreate the provider
          if (window.ethereum) {
            const newProvider = new ethers.providers.Web3Provider(window.ethereum);
            
            const newSigner = newProvider.getSigner();
            const address = await newSigner.getAddress();
            const formattedAddress = formatAddress(address, targetChainId);
            
            // Update state with new provider and network
            setProvider(newProvider);
            setSigner(newSigner);
            setChainId(targetChainId);
            setWalletAddress(formattedAddress);
            setWalletStatus("connected");
            
            // Update balance with new network currency
            await updateBalance();
            
            toast({
              title: "Network added",
              description: `Connected to ${networkInfo.name}`,
            });
          }
        } catch (addError) {
          setWalletStatus("error");
          throw new Error(`Failed to add network: ${addError}`);
        }
      } else {
        setWalletStatus("error");
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  // Send transaction function
  const sendTransaction = async (to: string, amount: string, data?: string): Promise<string | null> => {
    if (!signer || !provider) {
      throw new Error("Wallet not connected");
    }
    
    try {
      // Create transaction
      const tx = {
        to,
        value: ethers.utils.parseEther(amount),
        data: data || "0x",
      };
      
      // Add transaction to state with pending status
      const pendingTx: Transaction = {
        hash: "pending",
        status: "pending",
        timestamp: Date.now(),
        description: `Sending ${amount} ETH to ${to.substring(0, 6)}...${to.substring(38)}`,
      };
      
      setTransactions(prev => [...prev, pendingTx]);
      
      // Send transaction
      const txResponse = await signer.sendTransaction(tx);
      
      // Update transaction with hash
      setTransactions(prev => 
        prev.map(t => 
          t === pendingTx 
            ? { ...t, hash: txResponse.hash }
            : t
        )
      );
      
      // Show toast notification
      toast({
        title: "Transaction sent",
        description: `Transaction hash: ${txResponse.hash.substring(0, 10)}...`,
      });
      
      // Wait for transaction to be mined
      const receipt = await txResponse.wait();
      
      // Update transaction status
      setTransactions(prev => 
        prev.map(t => 
          t.hash === txResponse.hash 
            ? { ...t, status: "success" }
            : t
        )
      );
      
      // Show success toast notification
      toast({
        title: "Transaction confirmed",
        description: `Transaction successfully confirmed`,
      });
      
      // Update balance
      updateBalance();
      
      return txResponse.hash;
    } catch (error: any) {
      console.error("Transaction error:", error);
      
      // Update transaction status to error
      setTransactions(prev => 
        prev.map(t => 
          t.status === "pending" 
            ? { ...t, status: "error" }
            : t
        )
      );
      
      // Show error toast notification
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
      
      return null;
    }
  };

  // Get current network info
  const getNetworkInfo = (): NetworkInfo | null => {
    if (!chainId) return null;
    return NETWORKS[chainId] || null;
  };

  // Event listeners for wallet events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleChainChanged = async (chainIdHex: string) => {
      console.log("Chain changed to:", chainIdHex);
      const newChainId = parseInt(chainIdHex, 16);
      
      // If we're connected and the chain changed, we need to update our state
      if (walletStatus === "connected") {
        try {
          console.log("Updating provider for new chain:", newChainId);
          
          // Create new provider for the new chain
          const newProvider = new ethers.providers.Web3Provider(window.ethereum);
          const newSigner = newProvider.getSigner();
          
          // Get address and format it for the new chain
          const address = await newSigner.getAddress();
          const formattedAddress = formatAddress(address, newChainId);
          
          // Update state
          setProvider(newProvider);
          setSigner(newSigner);
          setChainId(newChainId);
          setWalletAddress(formattedAddress);
          
          // Update balance with new network currency
          await updateBalance();
          
          // Notify user
          const networkInfo = NETWORKS[newChainId];
          toast({
            title: "Network changed",
            description: networkInfo 
              ? `Connected to ${networkInfo.name}` 
              : `Connected to chain ID ${newChainId}`,
          });
        } catch (error) {
          console.error("Error handling chain change:", error);
          setWalletStatus("error");
        }
      }
    };

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      
      if (accounts.length === 0) {
        // User disconnected their wallet
        console.log("User disconnected wallet");
        await disconnectWallet();
      } else if (walletStatus === "connected") {
        // User switched accounts while connected
        try {
          const newAddress = accounts[0];
          const formattedAddress = formatAddress(newAddress, chainId || 1);
          
          setWalletAddress(formattedAddress);
          localStorage.setItem("walletAddress", formattedAddress);
          
          // Update balance for new account
          await updateBalance();
          
          toast({
            title: "Account changed",
            description: `Connected to ${formattedAddress.substring(0, 6)}...${formattedAddress.substring(38)}`,
          });
        } catch (error) {
          console.error("Error handling account change:", error);
        }
      }
    };

    // Add event listeners
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    // Clean up listeners when component unmounts
    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [walletStatus, disconnectWallet, updateBalance, chainId]);

  // Add a reconnectWallet function for handling network mismatch errors
  const reconnectWallet = async () => {
    try {
      console.log("Attempting to reconnect wallet due to network changes");
      setWalletStatus("connecting");
      
      // Check if ethereum is available
      if (!window.ethereum) {
        console.error("No Ethereum browser extension detected");
        throw new Error("No Ethereum browser extension detected. Please install MetaMask.");
      }
      
      // Get current chain ID
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      const currentChainId = parseInt(chainIdHex, 16);
      console.log("Reconnecting to chain ID:", currentChainId);
      
      // Create new provider instance
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
      const ethSigner = ethProvider.getSigner();
      
      // Check if accounts are accessible
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts || accounts.length === 0) {
        console.log("No accounts found during reconnection, requesting access");
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
      
      // Get and format address
      const address = await ethSigner.getAddress();
      const formattedAddress = formatAddress(address, currentChainId);
      console.log("Reconnected to address:", formattedAddress);
      
      // Update state
      setProvider(ethProvider);
      setSigner(ethSigner);
      setWalletAddress(formattedAddress);
      setChainId(currentChainId);
      setWalletStatus("connected");
      
      // Update balance
      await updateBalance();
      
      toast({
        title: "Wallet reconnected",
        description: `Connected to ${formattedAddress.substring(0, 6)}...${formattedAddress.substring(38)}`,
      });
      
      return formattedAddress;
    } catch (error: any) {
      console.error("Error reconnecting wallet:", error);
      setWalletStatus("error");
      
      toast({
        title: "Reconnection failed",
        description: error.message || "Failed to reconnect wallet",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  // Add a function to handle API errors
  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    toast({
      title: "API Error",
      description: "Could not connect to the backend server. Operating in limited functionality mode.",
      variant: "destructive",
    });
  };

  // Prepare context value
  const contextValue: Web3ContextType = {
    walletStatus,
    walletAddress,
    walletBalance,
    chainId,
    provider,
    signer,
    transactions,
    contracts,
    
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    getNetworkInfo,
    reconnectWallet,
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Create hook for easy context access
export const useWeb3 = () => useContext(Web3Context);

// Add TypeScript declarations for ethereum window object
declare global {
  interface Window {
    ethereum: any;
  }
} 