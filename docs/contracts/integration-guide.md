# SkillSwap Contract Integration Guide

This guide explains how to integrate with the SkillSwap platform contracts from both web and mobile applications.

## Prerequisites

- Web3 provider (MetaMask, WalletConnect, etc.)
- XDC Network configuration
- Contract ABIs and addresses

## Basic Setup

### Setting Up Web3 Provider

```javascript
// Example using ethers.js
import { ethers } from "ethers";

// Connect to provider
async function connectWallet() {
  if (window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return { provider, signer };
  }
  throw new Error("No Ethereum wallet detected");
}

// Connect to contracts
async function connectToContracts(signer) {
  const mentorshipToken = new ethers.Contract(
    "0x3bc607852393dcc75a3fccf0deb1699001d32bbd",
    MentorshipTokenABI,
    signer
  );
  
  const mentorRegistry = new ethers.Contract(
    "0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e",
    MentorRegistryABI,
    signer
  );
  
  // Add other contracts similarly
  
  return { mentorshipToken, mentorRegistry /* other contracts */ };
}
```

### XDC Network Configuration

```javascript
// Add XDC Network to MetaMask
const addXdcNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x33', // 51 in decimal
        chainName: 'XDC Apothem Testnet',
        nativeCurrency: {
          name: 'XDC',
          symbol: 'XDC',
          decimals: 18
        },
        rpcUrls: ['https://rpc.apothem.network'],
        blockExplorerUrls: ['https://explorer.apothem.network']
      }]
    });
  } catch (error) {
    console.error("Failed to add XDC Network:", error);
  }
};
```

## Common Integration Scenarios

### 1. Registering as a Mentor

```javascript
async function registerAsMentor(name, skills, hourlyRate, metadataURI) {
  const { signer } = await connectWallet();
  const { mentorRegistry } = await connectToContracts(signer);
  
  const tx = await mentorRegistry.registerMentor(
    name,
    skills,
    ethers.utils.parseEther(hourlyRate.toString()),
    metadataURI
  );
  
  await tx.wait();
  console.log("Successfully registered as mentor!");
}
```

### 2. Requesting a Session

```javascript
async function requestSession(mentorAddress, startTime, duration, topic) {
  const { signer } = await connectWallet();
  const { sessionManager } = await connectToContracts(signer);
  
  const tx = await sessionManager.requestSession(
    mentorAddress,
    startTime, // Unix timestamp
    duration, // in minutes
    topic
  );
  
  await tx.wait();
  return tx; // Contains sessionId in events
}
```

### 3. Processing Payments

```javascript
async function approveAndPay(sessionId, amount) {
  const { signer } = await connectWallet();
  const { mentorshipToken, sessionManager } = await connectToContracts(signer);
  
  // First approve token transfer
  const amountWei = ethers.utils.parseEther(amount.toString());
  const approveTx = await mentorshipToken.approve(
    sessionManager.address, 
    amountWei
  );
  await approveTx.wait();
  
  // Then process payment
  const payTx = await sessionManager.payForSession(sessionId);
  await payTx.wait();
  
  console.log("Payment successful!");
}
```

## Error Handling

```javascript
try {
  await someContractFunction();
} catch (error) {
  if (error.code === 4001) {
    console.log("User rejected the transaction");
  } else if (error.message.includes("insufficient funds")) {
    console.log("Insufficient funds for transaction");
  } else {
    console.error("Error:", error);
  }
}
```

## Events Monitoring

```javascript
// Listen for session-related events
function listenForSessionEvents(sessionManager) {
  sessionManager.on("SessionRequested", (sessionId, mentee, mentor, startTime) => {
    console.log(`New session requested: ${sessionId}`);
    // Update UI or notify user
  });
  
  sessionManager.on("SessionAccepted", (sessionId, mentor, meetingLink) => {
    console.log(`Session ${sessionId} accepted with meeting link: ${meetingLink}`);
    // Update UI or notify user
  });
  
  // Add more event listeners as needed
}
```

## Best Practices

1. **Error Handling**: Always wrap contract interactions in try-catch blocks
2. **Gas Estimation**: Estimate gas before sending transactions
3. **Transaction Receipts**: Wait for transaction receipts to confirm success
4. **User Experience**: Provide clear feedback about transaction status
5. **Testing**: Test all integrations on the testnet before production 