# SkillSwap API Integration

This document describes how to use the generated API client for the SkillSwap backend.

## Setup

The API client is generated using OpenAPI TypeScript Codegen, providing type-safe access to the backend API.

### Prerequisites

Make sure the backend API is running at `http://localhost:5005` or update the environment variable `NEXT_PUBLIC_API_URL` to point to your API server.

### Generating the API Client

```bash
# Install dependencies if not already done
npm install

# Generate the API client from the OpenAPI specification
npm run generate-api
```

This will create the API client code in `lib/api/` based on the OpenAPI specification from the backend.

## Using the API Client

### API Provider

The application uses an API context provider (`ApiProvider`) to manage authentication state and API configuration. It is included in the root layout, so you don't need to add it to your components.

```tsx
// Example of manual provider usage (already set up in app/layout.tsx)
import { ApiProvider } from '@/lib/api-context';

function App({ children }) {
  return <ApiProvider>{children}</ApiProvider>;
}
```

### Authentication

Use the `useAuth` hook to handle user authentication:

```tsx
import { useAuth } from '@/hooks/use-auth';

function LoginForm() {
  const { login, loading, error } = useAuth();
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    await login({
      username: formData.get('username'),
      password: formData.get('password')
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

### Data Fetching

Use the predefined hooks to interact with the API:

```tsx
import { useUsers, useUser } from '@/hooks/use-users';

function UsersList() {
  const { users, loading, error } = useUsers();
  
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

function UserProfile({ userId }) {
  const { user, loading, error } = useUser(userId);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!user) return <p>User not found</p>;
  
  return (
    <div>
      <h1>{user.full_name}</h1>
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### Direct API Calls

For more advanced use cases, you can use the generated API services directly:

```tsx
import { DefaultService } from '@/lib/api/services/DefaultService';

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
    console.error('Failed to create session:', error);
    throw error;
  }
}
```

## API Path Reference

Here are the main API endpoints available through the generated client:

### Authentication
- `DefaultService.authLoginPost` - Login with username/password
- `DefaultService.authRegisterPost` - Register a new user
- `DefaultService.authRefreshPost` - Refresh token

### Users
- `DefaultService.usersGet` - Get all users
- `DefaultService.usersUserIdGet` - Get user by ID
- `DefaultService.usersUserIdPut` - Update user
- `DefaultService.usersUserIdDelete` - Delete user

### Sessions
- `DefaultService.sessionsGet` - Get all sessions
- `DefaultService.sessionsSessionIdGet` - Get session by ID
- `DefaultService.sessionsPost` - Create a session
- `DefaultService.sessionsSessionIdPut` - Update a session
- `DefaultService.sessionsSessionIdStartPost` - Start a session
- `DefaultService.sessionsSessionIdEndPost` - End a session

### Blockchain
- Various blockchain-related endpoints

### Admin
- Various admin endpoints for monitoring and database management

## Error Handling

All API calls include proper error handling with TypeScript types. The HTTP errors are properly captured and can be handled in your application.

```tsx
try {
  const result = await DefaultService.usersGet();
  // Handle success
} catch (error) {
  if (error.status === 401) {
    // Handle unauthorized
  } else if (error.status === 404) {
    // Handle not found
  } else {
    // Handle other errors
  }
}
```

## TypeScript Types

The generated client includes full TypeScript definitions for all API requests and responses, providing excellent developer experience and type safety.

## Customizing the API Client

If you need to customize the generated client, you can:

1. Modify the OpenAPI specification in the backend
2. Regenerate the client code
3. Add custom wrappers around the generated client if needed 