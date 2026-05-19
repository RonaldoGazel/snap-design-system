export interface Sector {
  id: string;
  name: string;
  acronym: string;
  description?: string;
  parent_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgTreeNode<T> {
  data: T;
  children: OrgTreeNode<T>[];
  expanded?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  cpf?: string;
  registration?: string;
  sector_id?: string;
  security_level: number;
  role: string;
  is_active: boolean;
  password_reset_required: boolean;
  last_login?: string;
  failed_login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  sectors?: Sector;
  group?: { id: string; name: string } | null;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, unknown>;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  user_id: string;
  group_id: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  value?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
