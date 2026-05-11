// --- Response Models ---

export interface RoleResponse {
  id: string;
  name: string;
  type: 'platform' | 'service';
  version: number;
  permissions: PermissionResponse[];
  created_at: string;
  updated_at: string;
}

export interface PermissionResponse {
  id: string;
  resource_type: string;
  action: string;
  created_at: string;
}

export interface RoleAssignmentResponse {
  id: string;
  subject_id: string;
  role_id: string;
  scope_type: 'GLOBAL' | 'ORGANIZATION';
  scope_id: string | null;
  created_at: string;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  parent_group_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMemberResponse {
  id: string;
  group_id: string;
  subject_id: string;
  created_at: string;
}

// --- Request Models ---

export interface RoleCreate {
  name: string;
  type: 'platform' | 'service';
  permissions: { resource_type: string; action: string }[];
}

export interface RoleUpdate {
  name?: string;
  type?: 'platform' | 'service';
  permissions?: { resource_type: string; action: string }[];
  version: number;
}

export interface RoleAssignmentCreate {
  subject_id: string;
  scope_type: 'GLOBAL' | 'ORGANIZATION';
  scope_id: string | null;
}

export interface GroupCreate {
  name: string;
  description?: string;
  parent_group_id?: string | null;
}

export interface GroupUpdate {
  name?: string;
  description?: string;
  parent_group_id?: string | null;
  version: number;
}

export interface GroupMemberCreate {
  subject_id: string;
}

// --- Tree Models ---

export interface GroupTreeNode {
  id: string;
  name: string;
  description: string | null;
  parent_group_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  children: GroupTreeNode[];
}

// --- Permission Catalog Models ---

export interface PermissionCatalogEntry {
  resource_type: string;
  actions: string[];
  scope: 'platform' | 'organization';
}

export interface PermissionCatalogResponse {
  entries: PermissionCatalogEntry[];
}

// --- Effective Permissions Models ---

export interface EffectivePermissionsRequest {
  subject_id: string;
}

export interface EffectivePermissionEntry {
  resource_type: string;
  action: string;
}

export interface PermissionTraceEntry {
  resource_type: string;
  action: string;
  source_type: 'role' | 'group' | 'policy';
  source_id: string;
  source_name: string;
}

export interface EffectivePermissionsResponse {
  permissions: EffectivePermissionEntry[];
  evaluation_trace?: PermissionTraceEntry[];
}
