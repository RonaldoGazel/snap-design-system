/**
 * Workflow enums — English keys matching the backend.
 * Display labels are handled via i18n (workflows.en.json / workflows.pt.json).
 */

export enum FlowStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum StepType {
  INITIATION = 'initiation',
  PRODUCTION = 'production',
  REVIEW = 'review',
  APPROVAL = 'approval',
  FORMALIZATION = 'formalization',
  DISPATCH = 'dispatch',
  INTERNAL_DISSEMINATION = 'internal_dissemination',
  EXTERNAL_DISSEMINATION = 'external_dissemination',
  OPERATIONAL_TASK = 'operational_task',
  TERMINAL = 'terminal',
}

export enum TransitionType {
  STANDARD_FORWARD = 'standard_forward',
  STANDARD_BACKWARD = 'standard_backward',
  CONDITIONAL = 'conditional',
}

export enum Capability {
  CREATE_DOCUMENT = 'CREATE_DOCUMENT',
  PRODUCE = 'PRODUCE',
  REVIEW = 'REVIEW',
  ADJUST = 'ADJUST',
  COMPLEMENT = 'COMPLEMENT',
  APPROVE = 'APPROVE',
  CLASSIFY = 'CLASSIFY',
  DISPATCH = 'DISPATCH',
  FORMALIZE = 'FORMALIZE',
  AUTHORIZE_DISSEMINATION = 'AUTHORIZE_DISSEMINATION',
  EXECUTE_DISSEMINATION = 'EXECUTE_DISSEMINATION',
  RESPOND = 'RESPOND',
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  EXECUTE_DILIGENCE = 'EXECUTE_DILIGENCE',
}

export enum AssignmentMode {
  DIRECT = 'direct_assignment',
  QUEUE = 'queue_based',
}

export enum DefinitionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ConnectionType {
  FORWARD = 'AVANCO',
  RETURN = 'RETORNO',
  INTRA_STEP = 'INTRA_ETAPA',
  SELF_REFERENCE = 'AUTO_REFERENCIA',
}

export enum ProcessStatus {
  OPEN = 'ABERTO',
  CLOSED = 'ENCERRADO',
  CANCELLED = 'CANCELADO',
}

export enum InstanceStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Available permissions for step catalog entries.
 * These are the capabilities that can be assigned to a step.
 */
export const AVAILABLE_PERMISSIONS = [
  'CREATE_DOCUMENT',
  'PRODUCE',
  'REVIEW',
  'ADJUST',
  'COMPLEMENT',
  'APPROVE',
  'CLASSIFY',
  'DISPATCH',
  'FORMALIZE',
  'AUTHORIZE_DISSEMINATION',
  'EXECUTE_DISSEMINATION',
  'RESPOND',
  'ACKNOWLEDGE',
  'EXECUTE_DILIGENCE'
] as const;

// ---------------------------------------------------------------------------
// Legacy aliases — kept for backward compatibility with prototype components.
// These map the old Portuguese enum names to the new English values.
// Components should migrate to the new enums over time.
// ---------------------------------------------------------------------------

/** @deprecated Use FlowStatus */
export const FlowVersionStatus = FlowStatus;

/** @deprecated Use Capability */
export enum RoleCode {
  CRIADOR = 'CREATE_DOCUMENT',
  PRODUTOR = 'PRODUCE',
  REVISOR = 'REVIEW',
  FORMALIZADOR = 'FORMALIZE',
  AUTORIZADOR_DIFUSAO = 'AUTHORIZE_DISSEMINATION',
  EXECUTOR_DIFUSAO = 'EXECUTE_DISSEMINATION',
}

/** @deprecated Use TransitionType */
export enum RuleType {
  CRIACAO = 'creation',
  TRAMITACAO = 'routing',
  FORMALIZACAO = 'formalization',
  DIFUSAO_INTERNA = 'internal_dissemination',
  DIFUSAO_EXTERNA = 'external_dissemination',
  EXCECAO = 'exception',
}

/** @deprecated */
export enum RuleScope {
  PERMISSAO = 'permission',
  RESTRICAO = 'restriction',
  VEDACAO = 'prohibition',
}

/** @deprecated */
export enum DocumentDistribution {
  EXTERNO = 'EXTERNO',
  INTERNO = 'INTERNO',
  INTERNO_EXTERNO = 'INTERNO_EXTERNO',
}

/** @deprecated */
export enum DisseminationType {
  INTERNAL = 'Internal',
  EXTERNAL = 'External',
}

/** @deprecated */
export enum InstanceEventType {
  CRIACAO = 'creation',
  TRAMITACAO = 'routing',
  REVISAO = 'review',
  DEVOLUCAO = 'return',
  FORMALIZACAO = 'formalization',
  DIFUSAO_INTERNA = 'internal_dissemination',
  DIFUSAO_EXTERNA = 'external_dissemination',
  ENCERRAMENTO = 'closure',
}

/** @deprecated Use FlowStatus */
export enum VisualFlowStatus {
  RASCUNHO = 'draft',
  ATIVO = 'published',
  INATIVO = 'archived',
}
