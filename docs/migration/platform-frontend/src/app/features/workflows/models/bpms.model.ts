import {
  FlowStatus,
  FlowVersionStatus,
  StepType,
  TransitionType,
  RoleCode,
  RuleType,
  RuleScope,
  ProcessStatus,
  InstanceEventType,
} from './bpms.enums';

export interface BpmsOrgUnit {
  id: string;
  name: string;
  acronym: string;
  description?: string;
  parent_id?: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: BpmsOrgUnit[];
}

export interface BpmsProfile {
  id: string;
  name: string;
  code: string;
  hierarchy_level: number;
  description?: string;
  is_active: boolean;
}

export interface BpmsUnitProfile {
  id: string;
  unit_id: string;
  profile_id: string;
  hierarchy_order: number;
  is_active: boolean;
  unit?: BpmsOrgUnit;
  profile?: BpmsProfile;
}

export interface UnitProfileCombo {
  unit_id: string;
  profile_id: string;
  unit?: BpmsOrgUnit;
  profile?: BpmsProfile;
}

export interface BpmsDocumentType {
  id: string;
  organization_id?: string;
  code: string;
  name: string;
  distribution: string;
  doc_category: string;
  template_id?: string | null;
  template_name?: string | null;
  template_version?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BpmsTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  has_file: boolean;
  has_preview: boolean;
  original_filename?: string | null;
  mandatory_metadata?: Record<string, unknown> | null;
  status: string;
  is_active: boolean;
  // Legacy compat
  code?: string;
  full_name?: string;
  /** @deprecated Use has_file instead */
  has_docx?: boolean;
  content_html?: string | null;
}

export interface BpmsFlow {
  id: string;
  name: string;
  code: string;
  description?: string;
  scope?: string;
  status: FlowStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  flow_doc_types?: Array<{ id: string; document_type: BpmsDocumentType }>;
  versions?: BpmsFlowVersion[];
}

export interface BpmsFlowVersion {
  id: string;
  flow_id: string;
  version: number;
  status: FlowStatus;
  published_at?: string;
  published_by?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  steps?: BpmsFlowStep[];
  transitions?: BpmsFlowTransition[];
  roles?: BpmsFlowRole[];
  rules?: BpmsFlowRule[];
}

export interface BpmsFlowStep {
  id: string;
  flow_version_id: string;
  name: string;
  code: string;
  type: StepType;
  description?: string;
  order_index: number;
  is_mandatory: boolean;
  role_code?: string;
  config?: Record<string, unknown>;
}

export interface BpmsFlowTransition {
  id: string;
  flow_version_id: string;
  name: string;
  from_step_id: string;
  to_step_id: string;
  type: TransitionType;
  description?: string;
  conditions?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface BpmsFlowRole {
  id: string;
  flow_version_id: string;
  name: string;
  code: RoleCode;
  description?: string;
  unit_id?: string;
  profile_id?: string;
  config?: Record<string, unknown>;
}

export interface BpmsFlowRule {
  id: string;
  flow_version_id: string;
  name: string;
  type: RuleType;
  scope: RuleScope;
  source_unit_id?: string;
  source_profile_id?: string;
  target_unit_id?: string;
  target_profile_id?: string;
  action?: string;
  conditions?: Record<string, unknown>;
  is_exception: boolean;
  priority: number;
  is_active: boolean;
}

export interface BpmsFlowException extends BpmsFlowRule {
  is_exception: true;
}

export interface BpmsProcess {
  id: string;
  identifier: string;
  subject: string;
  description?: string;
  status: ProcessStatus;
  origin_unit_id?: string;
  origin_profile_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  document_instances?: BpmsDocumentInstance[];
}

export interface BpmsDocumentInstance {
  id: string;
  process_id?: string;
  flow_version_id: string;
  template_id: string;
  title: string;
  nup?: string;
  status: string;
  current_step_id?: string;
  metadata?: Record<string, unknown>;
  content?: string;
  is_formalized: boolean;
  formalized_at?: string;
  formalized_by?: string;
  origin_unit_id?: string;
  origin_profile_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  process?: BpmsProcess;
  flow_version?: BpmsFlowVersion;
  template?: BpmsTemplate;
  events?: BpmsInstanceEvent[];
}

export interface BpmsInstanceEvent {
  id: string;
  instance_id: string;
  event_type: InstanceEventType;
  from_step_id?: string;
  to_step_id?: string;
  actor_unit_id?: string;
  actor_profile_id?: string;
  target_unit_id?: string;
  target_profile_id?: string;
  payload?: Record<string, unknown>;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface BpmsPendingTask {
  instance: BpmsDocumentInstance;
  expected_action?: string;
  step?: BpmsFlowStep;
}

export interface MockUser {
  id: string;
  name: string;
  unit_acronym: string;
  profile_code: string;
  description: string;
}

export interface TransitionPayload {
  notes?: string;
  target_unit_id?: string;
  target_profile_id?: string;
  [key: string]: unknown;
}

export interface DisseminationTarget {
  unit_id: string;
  profile_id: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  entity?: string;
  entity_id?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  entity?: string;
  entity_id?: string;
}

export interface BpmsStepCatalog {
  id: string;
  name: string;
  description?: string;
  step_type: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BpmsRoleCatalog {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
