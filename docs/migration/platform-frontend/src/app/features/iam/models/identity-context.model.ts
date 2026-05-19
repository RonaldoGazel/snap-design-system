/**
 * Response shape from GET /api/v1/identity/me?include=roles
 * Maps to the identity-service _build_from_db output.
 */
export interface IdentityContextResponse {
  user: IdentityContextUser;
  organization: IdentityContextOrganization | null;
  roles?: IdentityContextRole[];
}

export interface IdentityContextUser {
  id: string;
  external_auth_id: string;
  email: string;
  display_name: string;
  status: 'active' | 'inactive' | 'locked';
  organization_id: string | null;
  clearance_level: number;
  identity_version: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface IdentityContextOrganization {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface IdentityContextRole {
  id: string;
  key: string | null;
  name: string;
  type: 'platform' | 'service';
  scope_type: 'GLOBAL' | 'ORGANIZATION';
  scope_id: string | null;
}
