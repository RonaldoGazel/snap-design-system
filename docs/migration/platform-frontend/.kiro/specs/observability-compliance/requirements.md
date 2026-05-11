# Observability & Audit Compliance Audit

## Overview

Audit all platform services against the updated governance standards: ARCH-004 (Observability v2.0), SDK-001 (audit-sdk), and SDK-002 (auth-sdk). Ensure structured JSON logging, security event categories, health endpoints, metrics, audit event emission, and JWT validation all conform to the approved specs.

## Services to Audit

### 1. identity-service

- [x] **ARCH-004 Logging**: Structured JSON to stdout with required fields (`timestamp`, `level`, `service`, `request_id`, `message`)
  - ⚠ PARTIAL — `StructuredFormatter` outputs `timestamp`, `level`, `message` but uses `logger` instead of `service`. The `service` field (hardcoded constant per ARCH-004) is **missing entirely**. The `request_id` is only present when passed via `extra` from middleware — not guaranteed in all log entries (e.g., startup, scheduler, consumer logs).
- [ ] **ARCH-004 Logging**: Optional fields (`correlation_id`, `user_id`, `duration_ms`, `http_method`, `http_path`, `http_status`, `extra`)
  - ❌ FAIL — Field names don't match ARCH-004: uses `method` instead of `http_method`, `path` instead of `http_path`, `status_code` instead of `http_status`. No `extra` object — domain fields are placed at top level. No `correlation_id` field at all.
- [ ] **ARCH-004 Logging**: `service` field is a hardcoded constant, not from env var
  - ❌ FAIL — No `service` field exists in `StructuredFormatter`. The formatter outputs `logger` (the Python logger name) instead.
- [x] **ARCH-004 Logging**: No PII, no secrets, no tokens in logs
  - ✅ PASS — Docstrings and code confirm no token/PII logging. `user_id` is UUID only.
- [ ] **ARCH-004 Logging**: `error_stack` omitted in production
  - ⚠ PARTIAL — `StructuredFormatter` outputs `error_type` and `error_message` from `exc_info`, but does NOT output a full stack trace as a field. However, the `exc_info=True` in `RequestLoggingMiddleware` causes Python's logging to append the traceback to the message. There is no environment-conditional guard to suppress this in production.
- [x] **ARCH-004 Request ID**: `X-Request-ID` header propagation, fallback UUID generation
  - ✅ PASS — `RequestLoggingMiddleware` reads `X-Request-ID` header, falls back to `uuid.uuid4()`, sets response header.
- [ ] **ARCH-004 Correlation ID**: `X-Correlation-ID` header propagation, distinct from request_id
  - ❌ FAIL — No `X-Correlation-ID` handling anywhere in identity-service. No `correlation_id` field in logs. ARCH-004 requires these to be distinct concepts.
- [ ] **ARCH-004 Security Events**: `extra.event_category` for AUTH_SUCCESS, AUTH_FAILURE, AUTH_LOCKOUT, AUTHZ_DENIED etc.
  - ❌ FAIL — No security event categories found. No `extra.event_category` field in any log entry. Identity-service handles auth events from Keycloak via Kafka consumer but doesn't emit SIEM-compatible security event logs per ARCH-004.
- [x] **ARCH-004 Health**: `/health` (liveness, no deps) and `/ready` (readiness, checks deps)
  - ⚠ PARTIAL — `/health` exists and checks no deps (✅). `/ready` is at `/health/ready` instead of `/ready` (non-compliant path). Readiness checks database, Redis, and Kafka (✅ dep checks).
- [ ] **ARCH-004 Metrics**: `/metrics` endpoint with `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`
  - ❌ FAIL — `/metrics` endpoint exists (✅). But the ARCH-004 required metrics are **missing**: no `http_requests_total`, no `http_request_duration_seconds`, no `http_requests_in_progress`. Instead has custom `identity_api_requests_total` (different name/labels) and no duration histogram or in-progress gauge matching the spec.
- [ ] **SDK-001 audit-sdk**: Production dependency, lifecycle (init/shutdown), context propagation, event emission for all auditable actions
  - ❌ FAIL — `audit-sdk` is **not a dependency** in `pyproject.toml`. No `AuditClient` initialization, no `set_audit_context`/`clear_audit_context` calls, no audit event emission anywhere. Completely missing.
- [ ] **SDK-002 auth-sdk**: JWT validation via auth-sdk (not custom), subject extraction, requirement primitives
  - ❌ FAIL — `auth-sdk` is **not a dependency** in `pyproject.toml`. Uses custom `python-jose` + hand-rolled `ResilientJWKSClient` in `app/auth.py`. No `extract_subject()`, no SDK requirement primitives.


### 2. permission-service

- [ ] **ARCH-004 Logging**: Structured JSON to stdout with required fields (`timestamp`, `level`, `service`, `request_id`, `message`)
  - ⚠ PARTIAL — Uses `structlog` throughout (good library choice), but **no structlog configuration found** (no `structlog.configure()` call with JSON renderer, processors, or the required field bindings). Without explicit configuration, structlog defaults to key-value text output, not JSON. The `service` hardcoded constant is not bound. `request_id` is set in `RequestIdMiddleware` on `request.state` but there's no evidence it's injected into structlog context for all log entries.
- [ ] **ARCH-004 Logging**: Optional fields (`correlation_id`, `user_id`, `duration_ms`, `http_method`, `http_path`, `http_status`, `extra`)
  - ❌ FAIL — No `correlation_id` handling. No `X-Correlation-ID` header reading or propagation. `AuditContextMiddleware` uses `request_id` as `correlation_id` for audit-sdk context — these should be distinct per ARCH-004. No HTTP request/response logging middleware with `duration_ms`, `http_method`, `http_path`, `http_status`.
- [ ] **ARCH-004 Request ID**: `X-Request-ID` header propagation, fallback UUID generation
  - ⚠ PARTIAL — `RequestIdMiddleware` generates a new UUID and sets response header. But it does **not read the incoming `X-Request-ID` header** — always generates a fresh UUID, breaking distributed tracing across services.
- [ ] **ARCH-004 Correlation ID**: `X-Correlation-ID` header propagation, distinct from request_id
  - ❌ FAIL — No `X-Correlation-ID` handling. `AuditContextMiddleware` incorrectly uses `request_id` as `correlation_id` — these are distinct concepts per ARCH-004.
- [ ] **ARCH-004 Security Events**: AUTHZ_DENIED, AUTHZ_ESCALATION categories
  - ❌ FAIL — No `extra.event_category` field in any log entry. `AuditLogger` logs authorization decisions with structlog but doesn't use the ARCH-004 security event category taxonomy (`AUTHZ_DENIED`, `AUTHZ_ESCALATION`).
- [x] **ARCH-004 Health**: `/health` and `/ready` endpoints
  - ⚠ PARTIAL — `/health` returns `{"status": "ok"}` (should be `{"status": "healthy"}` per ARCH-004). `/ready` checks PostgreSQL only — does **not check Kafka** (a required dependency). `/metrics` endpoint exists (✅).
- [ ] **ARCH-004 Metrics**: `/metrics` endpoint with `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`
  - ❌ FAIL — `/metrics` endpoint exists and serves `prometheus_client` output. But **no Prometheus metric definitions found** in the codebase. No `http_requests_total`, no `http_request_duration_seconds`, no `http_requests_in_progress`. The only metrics exposed would be audit-sdk's auto-registered metrics and Python process defaults.
- [x] **SDK-001 audit-sdk**: Already integrated — verify compliance (event types from EVT-004, envelope from EVT-003)
  - ✅ MOSTLY COMPLIANT — `audit-sdk ^0.1.1` is a production dependency. `AuditConfig.from_env()` + `AuditClient(config)` initialization in lifespan. `await audit_client.close()` on shutdown. `AuditContextMiddleware` calls `set_audit_context`/`clear_audit_context`. `AuditEventService` emits `AuditAuthorizationDecided` and `AuditAccessPolicyUpdated` events with proper envelope fields. Uses `_safe_emit` pattern so audit failures don't break operations.
  - ⚠ Issue: `AuditContextMiddleware` passes `request_id` as `correlation_id` — should be the actual `X-Correlation-ID` value.
- [x] **SDK-002 auth-sdk**: Already migrated — verify compliance
  - ✅ COMPLIANT — `auth-sdk ^0.1.1` is a production dependency. `AuthConfig` constructed with mapped settings. `JWKSClient` initialized at module level. `AuthenticationMiddleware` uses `jwks_client.validate_token()` and `extract_subject()`. Exception handling maps `JWKSFetchError` → 503, `TokenValidationError` → 401, `SubjectExtractionError` → 401. All per SDK-002.

### 3. platform-frontend (Angular SPA)

- [x] **Logging**: `logAuthError` utility — verify it doesn't log PII/tokens
  - ✅ PASS — `logAuthError()` in `src/app/auth/utils/log-auth-error.ts` logs only `error.code`, `error.message`, `timestamp` (ISO 8601), and optional `authSessionId`. Explicitly excludes tokens, headers, PII, and PKCE material per its docstring.
- [x] **Logging**: Console logging format (less critical — frontend is not a trust boundary)
  - ✅ PASS — Uses `console.error` with structured object. Acceptable for SPA.
- [x] Note: SDK-001/SDK-002 do not apply to frontend (Python SDKs)
  - ✅ N/A — Confirmed. No Python SDK integration needed.

### 4. Keycloak SPI (shared-infra)

- [x] **Event Listener SPI**: Verify Kafka event format includes `correlation_id`, `request_id`
  - ⚠ PARTIAL — `EventPayloadBuilder` includes `correlation_id` (extracted from `X-Correlation-ID` header or auto-generated UUID). However, **`request_id` is missing** from the Kafka event payload. ARCH-004 requires both `correlation_id` and `request_id` in Kafka event metadata for downstream consumers.
- [x] **Auth Context Collector**: Verify session notes don't contain PII
  - ✅ PASS — `AuthContextCollectorAuthenticator` stores only `platform_auth_ip` (IP address) and `platform_auth_timestamp` (epoch millis) as session notes. No names, emails, or other PII. IP is used for security context (drift detection), not PII identification. Sensitive fields are stripped by `EventPayloadBuilder.SENSITIVE_FIELDS`.
- [x] Note: Keycloak is a third-party component — its native logs are exempt from ARCH-004 format requirements
  - ✅ Acknowledged — per ARCH-004 "Third-Party Component Logs" section.

---

## Summary of Findings

### Critical Gaps (must fix)

| # | Service | Finding | Governance Ref |
|---|---------|---------|----------------|
| 1 | identity-service | `audit-sdk` not integrated — no production dependency, no lifecycle, no event emission | SDK-001 |
| 2 | identity-service | `auth-sdk` not integrated — uses custom `python-jose` + `ResilientJWKSClient` | SDK-002 |
| 3 | identity-service | Missing `service` hardcoded constant in log entries | ARCH-004 |
| 4 | identity-service | No `X-Correlation-ID` handling — `correlation_id` absent from all logs | ARCH-004 |
| 5 | identity-service | No security event categories (`extra.event_category`) for SIEM | ARCH-004 |
| 6 | identity-service | Required Prometheus metrics missing (`http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`) | ARCH-004 |
| 7 | identity-service | Readiness endpoint at `/health/ready` instead of `/ready` | ARCH-004 |
| 8 | permission-service | No structlog JSON configuration — likely outputting text, not structured JSON | ARCH-004 |
| 9 | permission-service | `RequestIdMiddleware` ignores incoming `X-Request-ID` header — always generates new UUID | ARCH-004 |
| 10 | permission-service | No `X-Correlation-ID` handling — `correlation_id` absent; audit context incorrectly uses `request_id` as `correlation_id` | ARCH-004 |
| 11 | permission-service | No security event categories (`AUTHZ_DENIED`, `AUTHZ_ESCALATION`) for SIEM | ARCH-004 |
| 12 | permission-service | Required Prometheus metrics missing (`http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`) | ARCH-004 |
| 13 | permission-service | `/health` returns `{"status": "ok"}` instead of `{"status": "healthy"}`; `/ready` doesn't check Kafka | ARCH-004 |
| 14 | Keycloak SPI | `request_id` missing from Kafka event payload | ARCH-004 |

### Compliant Areas

| Service | Area | Status |
|---------|------|--------|
| permission-service | SDK-001 (audit-sdk) | ✅ Integrated with proper lifecycle, context, and event emission |
| permission-service | SDK-002 (auth-sdk) | ✅ Fully compliant — validate_token, extract_subject, exception mapping |
| platform-frontend | PII/token logging | ✅ logAuthError excludes sensitive data |
| Keycloak SPI | Session note PII | ✅ Only IP + timestamp, sensitive fields stripped |
| Keycloak SPI | correlation_id in events | ✅ Extracted from X-Correlation-ID or auto-generated |
| identity-service | X-Request-ID propagation | ✅ Reads header, fallback UUID, sets response header |
| identity-service | No PII/secrets in logs | ✅ Confirmed |

## Reference Specs
- ARCH-004 v2.0: `TrillianCentralRepo/architecture/observability.md`
- SDK-001 v1.0: `TrillianCentralRepo/standards/audit-sdk-integration.md`
- SDK-002 v1.1: `TrillianCentralRepo/standards/auth-sdk-integration.md`
- EVT-003: Audit event envelope schema
- EVT-004: Audit event catalog
- SEC-004: PII handling policy
