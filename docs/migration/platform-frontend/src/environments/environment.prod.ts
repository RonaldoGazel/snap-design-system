export const environment = {
  production: true,
  keycloak: {
    baseUrl: '${KEYCLOAK_BASE_URL}',
    realm: '${KEYCLOAK_REALM}',
    clientId: '${KEYCLOAK_CLIENT_ID}',
    redirectUri: '${KEYCLOAK_REDIRECT_URI}',
    postLogoutRedirectUri: '${KEYCLOAK_POST_LOGOUT_REDIRECT_URI}',
  },
  identityServiceUrl: '${IDENTITY_SERVICE_URL}',
  auditServiceUrl: '${AUDIT_SERVICE_URL}',
  personServiceUrl: '${POI_SERVICE_URL}',
  workflowServiceUrl: '${WORKFLOW_SERVICE_URL}',
  trustedOrigins: [
    '${IDENTITY_SERVICE_URL}',
    '${AUDIT_SERVICE_URL}',
    '${POI_SERVICE_URL}',
    '${WORKFLOW_SERVICE_URL}',
  ],
  auth: {
    refreshBufferSeconds: 60,
    clockSkewToleranceSeconds: 30,
    idleTimeoutMinutes: 15,
    maxSessionLifetimeHours: 8,
    interceptorReplayLimit: 5,
    redirectLoopThreshold: 3,
    redirectLoopWindowMs: 10_000,
  },
  credentialStrategy: 'bearer' as const,
  csp: {
    reportUri: '${CSP_REPORT_URI}',
  },
};
