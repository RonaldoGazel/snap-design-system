import type {
  DocumentOrigin,
  ExportFormat,
  MentionType,
  Priority,
  ReviewType,
  SecurityClassification,
} from './document.models';

// === Payloads de Criação/Atualização ===

export interface CreateProcessPayload {
  title: string;
  description?: string;
  securityClassification?: SecurityClassification;
  priority?: Priority;
  assignedUserId?: string;
}

export interface UpdateProcessPayload {
  title?: string;
  description?: string;
  securityClassification?: SecurityClassification;
  priority?: Priority;
  assignedUserId?: string | null;
}

export interface CreateDocumentPayload {
  title: string;
  distribution: string;
  doc_type: string;
  template_key: string;
}

export interface UpdateDocumentPayload {
  title?: string;
  content?: string;
  securityClassification?: SecurityClassification;
  assignedUserId?: string | null;
  expectedVersion?: number;
}

// === Payloads de Tramitação ===

export interface CreateTramitationPayload {
  processId: string;
  toSectorId: string;
  observation?: string;
}

export interface RejectTramitationPayload {
  rejectionReason: string;
}

// === Payloads de Revisão ===

export interface SubmitReviewPayload {
  reviewerId: string;
}

export interface CompleteReviewPayload {
  reviewType: ReviewType;
  observation?: string;
}

// === Payloads de Difusão ===

export interface CreateInternalDisseminationPayload {
  toSectorId: string;
  justification: string;
}

export interface CreateExternalDisseminationPayload {
  destinationEntity: string;
  destinationContact?: string;
  justification: string;
  exportFormat: ExportFormat;
  signature?: string;
}

// === Payloads de Apolização ===

export interface ApolloizePayload {
  mentionTypes?: MentionType[];
}

export interface ReviewMentionPayload {
  status: 'CONFIRMED' | 'REJECTED';
  confirmedEntityId?: string;
}

// === Payload de Importação ===

export interface ImportDocumentPayload {
  origin: DocumentOrigin;
  summary?: string;
  keywords?: string;
  author?: string;
  documentDate?: string;
}
