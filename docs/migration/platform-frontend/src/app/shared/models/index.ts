export type { User, Session, Sector, Group, UserGroup, SystemConfig } from './user.model';
export type { Process } from './process.model';
export type { Document, DocumentVersion, DocumentAccess } from './document.model';
export type { Target, TargetPhoto, TargetReport, TargetRelationship } from './target.model';
export type { Tramitation } from './tramitation.model';
export type { Attachment } from './attachment.model';
export type {
  Notification,
  NotificationPreferences,
  CategoriaNotificacao,
  PrioridadeNotificacao,
  NotificacaoCompleta,
} from './notification.model';
export type { AuditLog } from './audit.model';
export type {
  Entity,
  Relationship,
  NetworkGraphMetadata,
  NetworkGraph,
} from './network-graph.model';
export type { ApiResponse } from './api-response.model';
export type { UsuarioContexto, Setor } from './organizacao.model';

export {
  Role,
  SecurityClassification,
  SECURITY_LEVEL_MAP,
  ProcessStatus,
  ProcessPriority,
  DocumentType,
  DocumentStatus,
  TramitationStatus,
  ThreatLevel,
  RelationshipType,
  RelationshipStrength,
  AuditAction,
  EntityType,
  NotificationType,
  DataSource,
  GraphEntityType,
} from './enums';
