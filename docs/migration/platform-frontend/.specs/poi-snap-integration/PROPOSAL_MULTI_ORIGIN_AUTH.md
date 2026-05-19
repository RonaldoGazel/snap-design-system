# Proposal: Multi-Origin Authentication Support for Frontend

## Context
The current frontend implementation is configured to send authentication credentials (JWT Bearer tokens) only to a single origin defined as `apiGatewayUrl` in the environment configuration. With the introduction of new microservices on different origins, the application needs to be updated to securely propagate the `Authorization` header to these new services.

## Current Limitations
1.  **Hardcoded Single Origin**: The `AuthInterceptor` has a strict check that rejects any request origin not matching `environment.apiGatewayUrl`.
2.  **Cookie Scope**: Keycloak session cookies are restricted to the Keycloak domain and are not shared with microservices. The frontend must manually attach the Bearer token to each request.

## Proposed Changes

### 1. Update Environment Configuration
Instead of a single `apiGatewayUrl`, we should define a list of `trustedOrigins` or `microservices` in the environment files.

```typescript
// Proposed src/environments/environment.ts
export const environment = {
  // ... other configs
  trustedOrigins: [
    'http://localhost:8080',      // API Gateway
    'http://localhost:8081',      // New Microservice A
    'https://api.myapp.com'       // Production Microservice B
  ],
};
```

### 2. Refactor AuthInterceptor
The `AuthInterceptor` should be updated to iterate through the list of trusted origins before attaching credentials.

```typescript
// Proposed logic in src/app/auth/interceptors/auth.interceptor.ts
const reqOrigin = new URL(req.url, window.location.origin).origin;
const isTrusted = environment.trustedOrigins.some(origin => 
  new URL(origin).origin === reqOrigin
);

if (!isTrusted) {
  return next.handle(req);
}
```

### 3. Security Considerations
*   **Prevent Token Leakage**: It is critical to only send the Bearer token to internal/trusted origins. Sending it to external third-party APIs (like Google Maps or Sentry) would expose our user's credentials.
*   **CORS Configuration**: Each new microservice must be configured to allow the `Authorization` header and the `X-Requested-With` header from the frontend origin.

## Architectural Readiness
The current frontend architecture is already built to handle the complexities of token management across multiple origins. The existing components provide a robust foundation:

1.  **Centralized Interceptor Logic**: The `AuthInterceptor` acts as a single point of control for all outgoing requests. By modifying only the origin-matching policy, we leverage existing logic for header injection and error handling.
2.  **Pluggable Credential Strategies**: The `BearerTokenStrategy` is already implemented and proven. It correctly extracts tokens from the `TokenStoreService` and formats the `Authorization: Bearer <token>` header, making it immediately compatible with any microservice that accepts JWTs.
3.  **Sophisticated Token Lifecycle**:
    *   **Proactive Refresh**: The `AuthService` automatically schedules token renewals before they expire, ensuring that long-running operations across different microservices don't fail due to stale credentials.
    *   **Automatic 401 Retry**: If a token becomes invalid (e.g., revoked), the interceptor catches the `401 Unauthorized` response, refreshes the token, and transparently retries the original request.
    *   **Cross-Tab Synchronization**: Using `BroadcastChannelService`, the application ensures that all browser tabs share the same token state. This prevents race conditions where different tabs might send inconsistent tokens to different microservices.

## Conclusion
By transitioning from a single-origin check to a whitelist-based approach, the frontend will be able to communicate securely with an arbitrary number of microservices while maintaining high security standards.
