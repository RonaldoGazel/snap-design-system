export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface UserProfile {
  sub: string;
  preferredUsername: string;
  name: string;
  email: string;
}

export interface SessionState {
  status: SessionStatus;
  user: UserProfile | null;
  isRefreshing: boolean;
  isStale: boolean;
}
