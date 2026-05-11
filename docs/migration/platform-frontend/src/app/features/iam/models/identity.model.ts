// --- Response Models ---

export interface UserResponse {
  id: string;
  external_auth_id: string;
  email: string;
  display_name: string;
  status: 'active' | 'inactive' | 'locked';
  organization_id: string | null;
  clearance_level: number;
  identity_version: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface InvitationResponse {
  id: string;
  organization_id: string;
  email: string;
  invited_by_user_id: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Request Models ---

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  display_name: string;
  clearance_level: number;
  organization_id: string;
}

export interface ResetPasswordRequest {
  temporary_password: string;
}

export interface BootstrapOrganizationRequest {
  org_name: string;
  owner_username: string;
  owner_email: string;
  owner_display_name: string;
  owner_password: string;
}

export interface OrgRecoveryRequest {
  target_user_id?: string;
  target_email?: string;
}

export interface OwnershipTransferRequest {
  target_user_id: string;
  revoke_current: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  display_name?: string;
  clearance_level?: number;
}

export interface CreateOrganizationRequest {
  name: string;
  status: 'active' | 'inactive';
}

export interface UpdateOrganizationRequest {
  name?: string;
  status?: 'active' | 'inactive';
}

export interface CreateInvitationRequest {
  email: string;
}

// --- Clearance Level ---

export interface ClearanceLevelResponse {
  level: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// --- Query Params ---

export interface UserQueryParams {
  limit: number;
  offset: number;
  organization_id?: string;
  status?: 'active' | 'inactive' | 'locked';
  search?: string;
}

export interface OrgQueryParams {
  limit: number;
  offset: number;
  include_deleted?: boolean;
}

export interface InvitationQueryParams {
  limit: number;
  offset: number;
  status?: 'pending' | 'accepted' | 'expired' | 'revoked';
}

// --- Section Models (ADR-005: Sections are the data segregation layer) ---

export interface SectionResponse {
  id: string;
  organization_id: string;
  name: string;
  parent_section_id: string | null;
  created_by_user_id: string | null;
  created_by_service_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SectionTreeNode extends SectionResponse {
  children: SectionTreeNode[];
}

export interface CreateSectionRequest {
  name: string;
  parent_section_id?: string | null;
}

export interface UpdateSectionRequest {
  name?: string;
  parent_section_id?: string | null;
}

export interface UserSectionResponse {
  id: string;
  user_id: string;
  section_id: string;
  created_at: string;
}

export interface AssignSectionRequest {
  section_id: string;
}

// --- Section Users Response (from GET /identity/sections/{id}/users) ---

export interface SectionUserItem {
  user_id: string;
  display_name: string;
  email: string;
  status: string;
  clearance_level: number;
}

export interface SectionSummary {
  section_id: string;
  name: string;
  organization_id: string;
}

export interface SectionUsersResponse {
  users: SectionUserItem[];
  section: SectionSummary;
}
