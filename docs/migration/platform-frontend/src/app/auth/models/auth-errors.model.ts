export type AuthErrorCode =
  | 'network_error'
  | 'invalid_grant'
  | 'discovery_failed'
  | 'invalid_token'
  | 'session_expired'
  | 'redirect_loop'
  | 'config_error';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'AuthError';
  }
}

export class AuthSessionRefreshedError extends Error {
  public readonly retryable = true;

  constructor(
    public readonly method: string,
    public readonly url: string,
  ) {
    super(
      `Session was refreshed during ${method} ${url}. Non-idempotent request was not replayed.`,
    );
    this.name = 'AuthSessionRefreshedError';
  }
}
