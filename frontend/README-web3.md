# Web3 and API Integration for SkillSwap

This document provides an overview of the Web3 wallet integration and API client in SkillSwap, including features, architecture, and usage instructions.

## Web3 Features

- **MetaMask Connection**: Connect to MetaMask wallet with user-friendly UI
- **Transaction Signing**: Sign and send transactions with error handling
- **Transaction Status Tracking**: Track pending, successful, and failed transactions
- **Network Switching**: Support for multiple networks (Ethereum, XDC Network)
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **User-friendly Prompts**: Clear guidance and feedback for users

## API Integration Features

- **Type-safe API Client**: Generated from OpenAPI specification
- **Authentication State Management**: Centralized authentication context
- **Automatic Token Handling**: JWT tokens managed automatically
- **Refresh Token Flow**: Automatic token refresh
- **Custom React Hooks**: Reusable hooks for common API operations
- **Error Handling**: Standardized error handling for API requests

## Technical Overview

### Architecture

The integration uses the following architecture:

1. **Web3Context**: Central state management for wallet connections
2. **ApiContext**: Central state management for API authentication
3. **WalletConnect Component**: UI for connecting wallets
4. **API Hooks**: Custom hooks for API operations
5. **ethers.js**: Core library for Ethereum/XDC interactions
6. **OpenAPI Client**: Generated TypeScript client for API calls

### File Structure

#### Web3 Integration
- `lib/web3-context.tsx`: Context provider for Web3 functionality
- `components/wallet-connect.tsx`: Wallet connection UI component

#### API Integration
- `lib/api-context.tsx`: Context provider for API functionality
- `lib/api/`: Generated API client from OpenAPI spec
- `hooks/use-auth.ts`: Authentication hook for login/register
- `hooks/use-users.ts`: Data fetching hooks for user operations

## Usage

### Web3 Integration

#### Connecting to a Wallet

```tsx
import { WalletConnect } from "@/components/wallet-connect";

export function MyComponent() {
  return (
    <div>
      <WalletConnect showDetails={true} />
    </div>
  );
}
```

#### Accessing Web3 State

```tsx
import { useWeb3 } from "@/lib/web3-context";

export function MyComponent() {
  const { 
    walletStatus,
    walletAddress,
    walletBalance,
    chainId,
    connectWallet,
    sendTransaction
  } = useWeb3();

  // Use these values and functions as needed
  return (
    <div>
      {walletStatus === "connected" ? (
        <p>Connected: {walletAddress}</p>
      ) : (
        <button onClick={connectWallet}>Connect</button>
      )}
    </div>
  );
}
```

### API Integration

#### Authentication

```tsx
import { useAuth } from "@/hooks/use-auth";

function LoginForm() {
  const { login, loading, error } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const success = await login({
      username: formData.get("username"),
      password: formData.get("password")
    });
    
    if (success) {
      // Redirect or show success message
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

#### Data Fetching

```tsx
import { useUsers } from "@/hooks/use-users";

function UsersList() {
  const { users, loading, error, fetchUsers } = useUsers();
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <ul>
      {users.map(user => (
        <li key={user._id}>{user.username}</li>
      ))}
    </ul>
  );
}
```

#### Direct API Calls

```tsx
import { DefaultService } from "@/lib/api/services/DefaultService";

async function createSession(sessionData) {
  try {
    const result = await DefaultService.sessionsPost({
      title: sessionData.title,
      description: sessionData.description,
      duration: sessionData.duration,
      // Other fields...
    });
    
    return result;
  } catch (error) {
    console.error("Failed to create session:", error);
    throw error;
  }
}
```

## Setting Up API Client

### Generate API Client

The API client is generated using OpenAPI TypeScript Codegen:

1. Ensure the backend is running and the OpenAPI spec is available
2. Run the following command:

```bash
npm run generate-api
```

This will create the API client in `lib/api/` directory.

### Configure Environment Variables

Create or edit `.env.local` in your frontend directory:

```
NEXT_PUBLIC_API_URL=http://localhost:5005
```

## Supported Networks

The Web3 integration supports the following networks:

| Network | Chain ID | Currency |
|---------|----------|----------|
| Ethereum Mainnet | 1 | ETH |
| XDC Mainnet | 50 | XDC |
| XDC Apothem Testnet | 51 | XDC |
| Polygon | 137 | MATIC |

## Error Handling

The integration includes comprehensive error handling for:

- Wallet connection failures
- Network switching issues
- Transaction failures
- User rejections
- API request failures
- Authentication errors

Errors are displayed through toast notifications with clear messages guiding the user on how to resolve issues.

## Security Considerations

- The integration never stores private keys or seed phrases
- API requests use HTTPS with proper authentication
- Sensitive operations are handled by the user's wallet
- Tokens are stored securely in local storage
- Clear warning messages guide users on secure practices

## Future Improvements

- Support for additional wallets (WalletConnect, Coinbase Wallet)
- ENS name resolution
- Gas fee estimations
- Smart contract interactions for skill token transfers
- Offline mode with data synchronization
- GraphQL integration for more efficient data fetching

## Dependencies

- ethers.js v5.7.2: Ethereum library for wallet interactions
- openapi-typescript-codegen: For API client generation
- shadcn/ui: UI component library based on Radix UI and Tailwind CSS
- Next.js 15.x: React framework for frontend development 