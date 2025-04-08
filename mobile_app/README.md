# SkillSwap Mobile App

This is the mobile app component of the SkillSwap platform, built with React Native and Expo.

## Project Structure

```
mobile_app/
├── assets/             # Images, fonts, and other static assets
├── src/
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   │   ├── index.tsx   # Main navigator
│   │   ├── AuthNavigator.tsx  # Authentication flow navigation
│   │   └── MainNavigator.tsx  # Main app tabs navigation
│   ├── redux/          # Redux state management
│   │   ├── slices/     # Redux slices using Redux Toolkit
│   │   └── store.ts    # Redux store configuration
│   ├── screens/        # All app screens
│   │   ├── auth/       # Authentication screens (login, register, etc.)
│   │   └── ...         # Other app screens
│   ├── services/       # API and other services
│   │   └── api.ts      # API configuration with axios
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── App.tsx             # Main App component
├── index.ts            # Entry point
├── app.json            # Expo configuration
└── package.json        # Dependencies and scripts
```

## Features

- **Authentication:** Login, registration, and password recovery
- **Two-Factor Authentication:** Enhanced security with 2FA
- **Session Management:** Browse, book, and manage mentoring sessions
- **Mentor Discovery:** Find mentors based on skills and availability
- **Profile Management:** View and update user profile
- **Secure Communication:** Chat with mentors and mentees

## API Integration

The mobile app connects to the SkillSwap backend API for all data operations. The API service is configured to handle:

- Authentication with JWT tokens
- Automatic token refresh
- API error handling
- Request/response interceptors

## Setup & Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Running on Device/Emulator

- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`

## Code Conventions

- Use TypeScript for type safety
- Follow functional component patterns with hooks
- Use React Navigation for routing
- Implement Redux Toolkit for state management
- Follow the Airbnb React/JSX Style Guide 