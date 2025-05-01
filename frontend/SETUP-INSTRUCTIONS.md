# SkillSwap API Integration Setup

Follow these steps to set up the integration between your SkillSwap frontend and the FastAPI backend.

## Step 1: Install Dependencies

```bash
cd frontend
npm install openapi-typescript-codegen --save-dev
```

## Step 2: Generate API Client from OpenAPI Specification

```bash
# Make sure your backend is running
python -m uvicorn main:app --reload --port 5005

# In a separate terminal, fetch the OpenAPI specification
curl http://localhost:5005/api/openapi.json > ../backend/skillswap-api-spec.json

# Generate the API client
npm run generate-api
```

This will create the TypeScript API client in `lib/api/` directory.

## Step 3: Configure Environment Variables

Create or edit `.env.local` in your frontend directory:

```
NEXT_PUBLIC_API_URL=http://localhost:5005
```

## Step 4: Fix TypeScript Errors (Temporary)

You may need to temporarily fix TypeScript errors while development continues. Create a declaration file:

```bash
# Create file
touch frontend/lib/api.d.ts

# Add content
echo "declare module '@/lib/api';" > frontend/lib/api.d.ts
```

## Step 5: Update Generated Code

After generating the API client, you may need to adjust some of the generated code to match your API structure:

1. Check the service names in `lib/api/services/` directory
2. Update imports in hooks if needed
3. Update API method names if they don't match your expectations

## Step 6: Run the Frontend

```bash
npm run dev
```

## Troubleshooting

### Authentication Issues

If you have CORS issues, make sure your backend's CORS settings in `settings.py` include your frontend URL:

```python
cors_origins: List[str] = [
    "http://localhost:3000",  # React frontend
    "http://localhost:5005",  # API itself (for testing)
]
```

### Type Errors

If you face TypeScript errors with the generated client:

1. Make sure the backend is providing correct OpenAPI specification
2. Regenerate the client after fixing any backend issues
3. Use explicit type assertions if needed for temporary development

### API Client Generation Errors

If you face errors during client generation:

1. Verify your OpenAPI specification is valid
2. Try using alternative generators like `@openapitools/openapi-generator-cli`
3. Check for any custom modifications needed in the OpenAPI file

## Next Steps

1. Implement more specific API hooks for your application features
2. Add error handling and loading states to your components
3. Implement token refresh logic for authentication
4. Add protected routes that require authentication

Refer to `API-INTEGRATION.md` for more details on using the generated API client in your components. 