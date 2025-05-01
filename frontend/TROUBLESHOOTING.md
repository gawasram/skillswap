# SkillSwap Frontend Troubleshooting

This document provides solutions for common issues you might encounter when working with the SkillSwap frontend.

## API Client Generation Issues

### "openapi is not recognized as an internal or external command"

**Problem**: When running `npm run generate-api`, you get an error that 'openapi' is not recognized.

**Solution**: Make sure the openapi-typescript-codegen package is installed correctly.

```bash
# Install the package
npm install openapi-typescript-codegen --save-dev --legacy-peer-deps

# If you still encounter issues, modify package.json to use npx:
# Change: "generate-api": "openapi --input ../backend/skillswap-api-spec.json --output ./lib/api --client fetch"
# To: "generate-api": "npx openapi-typescript-codegen --input ../backend/skillswap-api-spec.json --output ./lib/api --client fetch"
```

### "Module not found: Can't resolve './api'"

**Problem**: Next.js shows an error that it can't find the './api' module.

**Solution**: You need to generate the API client first:

1. Make sure the backend server is running
2. Run `npm run generate-api` to generate the client
3. If the issue persists, create a temporary declaration file:

```typescript
// lib/api.d.ts
declare module '@/lib/api' {
  export interface OpenAPI {
    BASE: string;
    TOKEN?: string;
  }
  
  export const OpenAPI: OpenAPI;
}
```

## API Connection Issues

### API Requests Failing

**Problem**: API requests are failing even though the client is generated.

**Solutions**:

1. Check if the backend server is running at the expected URL
2. Verify CORS settings in the backend to allow requests from your frontend
3. Check that environment variables are set correctly:

```
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5005
```

4. Make sure authentication tokens are being handled correctly in the ApiContext

## Dependency Conflicts

**Problem**: Dependency conflicts when installing packages.

**Solution**: Use the `--legacy-peer-deps` flag to bypass peer dependency checks:

```bash
npm install <package-name> --legacy-peer-deps
```

## TypeScript Errors with Generated Client

**Problem**: TypeScript errors with the generated API client.

**Solutions**:

1. Make sure the OpenAPI specification is valid
2. Regenerate the client with the latest backend specification
3. If using VSCode, restart the TypeScript server:
   - Press Ctrl+Shift+P
   - Type "TypeScript: Restart TS Server"
   - Select it to restart the server

## Further Help

If you're still encountering issues, check:

1. The [API-INTEGRATION.md](./API-INTEGRATION.md) guide
2. The [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md) document
3. Open an issue in the project repository 