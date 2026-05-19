// === Enums (union types) ===

export type DocumentType = 'CAPA' | 'DESPACHO' | 'RELATORIO' | 'OFICIO' | 'ANEXO';

export type ProcessStatus = 'ATIVO' | 'ARQUIVADO' | 'CANCELADO' | 'TRAMITANDO';

export type DocumentStatus =
  | 'RASCUNHO'
  | 'ACTIVE'
  | 'ASSIGNED'
  | 'TRAMITATING'
  | 'ARCHIVED'
  | 'IN_REVIEW'
  | 'FORMALIZED'
  | 'REJECTED';

export type SecurityClassification = 'PUBLICO' | 'RESERVADO' | 'SIGILOSO';

export type Priority = 'NORMAL' | 'ALTA' | 'URGENTE';

export type TramitationStatus = 'PENDING' | 'RECEIVED' | 'REJECTED' | 'CANCELLED';

export type ReviewType = 'APPROVAL' | 'RETURN_WITH_OBSERVATION' | 'REJECTION';

export type ReviewStatus = 'PENDING' | 'COMPLETED';

export type MentionType =
  | 'PESSOA'
  | 'ORGANIZACAO'
  | 'LOCAL'
  | 'VEICULO'
  | 'TELEFONE'
  | 'DOCUMENTO'
  | 'OUTRO';

export type MentionStatus = 'SUGGESTED' | 'CONFIRMED' | 'REJECTED' | 'PENDING_REVIEW';

export type ExportFormat = 'PDF' | 'DOCX' | 'ORIGINAL';

export type DisseminationStatus = 'PENDING' | 'DELIVERED' | 'REVOKED';

export type ExternalDisseminationStatus =
  | 'PENDING_AUTHORIZATION'
  | 'AUTHORIZED'
  | 'EXPORTED'
  | 'CANCELLED';

export type WorkflowStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type DocumentOrigin = 'MANUAL' | 'EMAIL' | 'SISTEMA_EXTERNO' | 'DIGITALIZADO';

// === Interfaces Principais ===

export interface Process {
  id: string;
  nup: string;
  title: string;
  description?: string;
  status: ProcessStatus;
  securityClassification: SecurityClassification;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  currentSectorId: string;
  assignedUserId?: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  processId: string;
  parentId?: string;
  templateId?: string;
  title: string;
  content?: string;
  type: DocumentType;
  securityClassification: SecurityClassification;
  status: DocumentStatus;
  orderIndex: number;
  version: number;
  isActive: boolean;
  /** Whether the document has an associated DOCX file for Collabora editing. */
  has_file?: boolean;
  /** Original filename of the uploaded DOCX. */
  original_filename?: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  currentSectorId: string;
  assignedUserId?: string;
  children?: Document[];
  attachments?: Attachment[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  title: string;
  content?: string;
  createdAt: string;
  createdBy: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  documentType: DocumentType;
  contentTemplate: string;
  metadataSchema?: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  documentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  origin: DocumentOrigin;
  ocrTextContent?: string;
  ocrProcessed: boolean;
  createdAt: string;
  createdBy: string;
}

// === Tramitações ===

export interface Tramitation {
  id: string;
  processId: string;
  fromSectorId: string;
  toSectorId: string;
  userId: string;
  observation?: string;
  status: TramitationStatus;
  sentAt: string;
  receivedAt?: string;
  receivedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  process?: Process;
  fromSectorName?: string;
  toSectorName?: string;
  userName?: string;
}

// === Revisões ===

export interface DocumentReview {
  id: string;
  documentId: string;
  reviewerId: string;
  reviewType?: ReviewType;
  observation?: string;
  status: ReviewStatus;
  createdAt: string;
  completedAt?: string;
  reviewerName?: string;
}

// === Formalização ===

export interface FinalArtifact {
  id: string;
  documentId: string;
  version: number;
  contentHash: string;
  metadataHash: string;
  formalizedBy: string;
  formalizedAt: string;
  signature?: string;
}

export interface IntegrityVerification {
  isIntact: boolean;
  contentHashMatch: boolean;
  metadataHashMatch: boolean;
  storedContentHash: string;
  calculatedContentHash: string;
  storedMetadataHash: string;
  calculatedMetadataHash: string;
}

// === Difusão ===

export interface InternalDissemination {
  id: string;
  documentId: string;
  fromSectorId: string;
  toSectorId: string;
  disseminatedBy: string;
  justification: string;
  status: DisseminationStatus;
  createdAt: string;
  deliveredAt?: string;
  toSectorName?: string;
  disseminatorName?: string;
}

export interface ExternalDissemination {
  id: string;
  documentId: string;
  authorizedBy: string;
  destinationEntity: string;
  destinationContact?: string;
  justification: string;
  exportFormat: ExportFormat;
  signature?: string;
  status: ExternalDisseminationStatus;
  createdAt: string;
  authorizedAt?: string;
  exportedAt?: string;
  authorizerName?: string;
}

// === Apolização ===

export interface DocumentMention {
  id: string;
  documentId: string;
  mentionText: string;
  mentionType: MentionType;
  startOffset: number;
  endOffset: number;
  suggestedEntityId?: string;
  confirmedEntityId?: string;
  status: MentionStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// === Indexação ===

export interface DocumentTextIndex {
  id: string;
  documentId: string;
  contentText: string;
  ocrProcessed: boolean;
  ocrConfidence?: number;
  indexedAt: string;
  updatedAt: string;
}

// === Workflow ===

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  documentType: DocumentType;
  sectorId?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  name: string;
  order: number;
  requiredRole?: string;
  transitions: WorkflowTransition[];
}

export interface WorkflowTransition {
  toStep: string;
  condition?: string;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  documentId: string;
  currentStep: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  startedBy: string;
}

// === Notificações ===

export interface Notification {
  id: string;
  userId: string;
  type: string;
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// === Acesso a Documentos ===

export interface DocumentAccess {
  id: string;
  documentId: string;
  userId: string;
  accessType: string;
  accessedAt: string;
  ipAddress?: string;
}

// === Busca ===

export interface SearchRequest {
  query?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  security_level?: number;
  priority?: Priority;
  sectorId?: string;
  createdFrom?: string;
  createdTo?: string;
  responsibleId?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: DocumentSearchItem[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentSearchItem {
  document: Document;
  process?: Process;
  matchHighlight?: string;
}
