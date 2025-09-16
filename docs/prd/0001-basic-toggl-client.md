# PRD 0001: Basic Toggl Client

## Overview
Create a foundational Toggl API client using openapi-fetch to generate a type-safe client from the Toggl OpenAPI specification. This will provide authentication and basic connectivity testing functionality, serving as the foundation for future Toggl API integrations in the CLI tool.

## Objectives
- Generate type-safe API client using openapi-fetch from Toggl OpenAPI specification
- Implement wrapper class with API token authentication
- Establish API connectivity testing through the /me endpoint
- Provide foundation for future type-safe API operations

## Requirements

### Technical Requirements
- Install openapi-fetch and openapi-typescript packages
- Generate TypeScript types from Toggl OpenAPI specification
- Create wrapper class using generated openapi-fetch client
- Implement API token authentication using HTTP Basic Auth
- Handle HTTP status codes and basic error responses
- Follow oclif project structure and TypeScript conventions

### Functional Requirements
- API client should authenticate using API token (no email/password support)
- Ping functionality should test connectivity and authentication
- Return boolean result indicating successful authentication and valid user data
- Proper error handling for network issues and authentication failures

### Code Structure
- `src/lib/toggl-client.ts` - Main TogglClient wrapper class implementation
- `src/types/toggl.d.ts` - Generated TypeScript types from OpenAPI spec
- `test/lib/toggl-client.test.ts` - Unit tests for the client

### Data Models
```typescript
// Generated from OpenAPI spec
import type { paths, components } from './types/toggl';

// API client wrapper
class TogglClient {
  private client: Client<paths>;
  constructor(apiToken: string);
  ping(): Promise<boolean>;
}
```

## Acceptance Criteria
- [x] openapi-fetch and openapi-typescript packages installed
- [x] TypeScript types generated from Toggl OpenAPI specification
- [x] TogglClient wrapper class accepts API token in constructor
- [x] ping() method successfully calls Toggl API /me endpoint using generated client
- [x] ping() method returns true when authentication succeeds and user ID is present
- [x] ping() method returns false when authentication fails or user ID is missing
- [x] Generated types provide full type safety for API responses
- [x] Unit tests cover success and failure scenarios
- [x] Code follows project linting and formatting standards

## Dependencies
None - this is a foundational feature.

## Notes
- Use API token with "api_token" as password for HTTP Basic Auth
- Toggl API endpoint: `https://api.track.toggl.com/api/v9/me`
- OpenAPI specification: `https://engineering.toggl.com/assets/files/api-e6d81fa78d97145051ba415fc7d2d2b7.json`
- API accepts only JSON requests (Content-Type: application/json)
- Consider rate limiting (1 request per second recommended)
- Specification uses Swagger 2.0 format

---

**Status:** Implemented