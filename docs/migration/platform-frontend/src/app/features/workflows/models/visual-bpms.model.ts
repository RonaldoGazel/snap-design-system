import { BpmsTemplate, BpmsStepCatalog, BpmsUnitProfile } from './bpms.model';

export type VisualFlowStatus = 'RASCUNHO' | 'ATIVO' | 'INATIVO';

export type ConnectionType = 'AVANCO' | 'RETORNO' | 'INTRA_ETAPA' | 'AUTO_REFERENCIA';

export interface BpmsVisualFlow {
  id: string;
  name: string;
  description?: string;
  document_type_id: string;
  /** @deprecated Use document_type_id. Kept for backward compat during migration. */
  template_id?: string;
  status: VisualFlowStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
  parent_flow_id?: string | null;
  template?: BpmsTemplate;
  stages?: BpmsVisualFlowStage[];
  connections?: BpmsVisualFlowConnection[];
}

export interface FlowVersionSummary {
  id: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BpmsVisualFlowStage {
  id: string;
  visual_flow_id: string;
  step_catalog_id: string;
  order_index: number;
  created_at: string;
  step_catalog?: BpmsStepCatalog;
  profiles?: BpmsVisualFlowStageProfile[];
}

export interface BpmsVisualFlowStageProfile {
  id: string;
  visual_flow_stage_id: string;
  unit_profile_id: string;
  permissions: string[];
  permissions_customized: boolean;
  order_index: number;
  created_at: string;
  unit_profile?: BpmsUnitProfile;
}

export interface BpmsVisualFlowConnection {
  id: string;
  visual_flow_id: string;
  source_stage_profile_id: string;
  target_stage_profile_id: string;
  connection_type: ConnectionType;
  created_at: string;
  source_profile?: BpmsVisualFlowStageProfile;
  target_profile?: BpmsVisualFlowStageProfile;
}

export interface VisualFlowValidationError {
  code: string;
  message: string;
  entity_type: 'STAGE' | 'PROFILE' | 'FLOW';
  entity_id?: string;
}
