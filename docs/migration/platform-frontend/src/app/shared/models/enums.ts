export enum Role {
  ADMIN = 'ADMIN',
  CHIEF = 'CHIEF',
  COORDINATOR = 'COORDINATOR',
  ANALYST = 'ANALYST',
}

export enum SecurityClassification {
  PUBLICO = 'PUBLICO',
  RESERVADO = 'RESERVADO',
  SIGILOSO = 'SIGILOSO',
}

export const SECURITY_LEVEL_MAP: Record<SecurityClassification, number> = {
  [SecurityClassification.PUBLICO]: 1,
  [SecurityClassification.RESERVADO]: 2,
  [SecurityClassification.SIGILOSO]: 3,
};

export enum ProcessStatus {
  ATIVO = 'ATIVO',
  ARQUIVADO = 'ARQUIVADO',
  CANCELADO = 'CANCELADO',
  RASCUNHO = 'RASCUNHO',
  TRAMITANDO = 'TRAMITANDO',
}

export enum ProcessPriority {
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export enum DocumentType {
  CAPA = 'CAPA',
  DESPACHO = 'DESPACHO',
  RELATORIO = 'RELATORIO',
  OFICIO = 'OFICIO',
  ANEXO = 'ANEXO',
}

export enum DocumentStatus {
  RASCUNHO = 'RASCUNHO',
  ACTIVE = 'ACTIVE',
  ASSIGNED = 'ASSIGNED',
  TRAMITATING = 'TRAMITATING',
  ARCHIVED = 'ARCHIVED',
}

export enum TramitationStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ThreatLevel {
  BAIXO = 'BAIXO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
  CRITICO = 'CRITICO',
}

export enum RelationshipType {
  ADVOGADO = 'ADVOGADO',
  FAMILIAR = 'FAMILIAR',
  PESSOA_DE_INTERESSE = 'PESSOA_DE_INTERESSE',
  SOCIO = 'SOCIO',
  COMPARSA = 'COMPARSA',
  INFORMANTE = 'INFORMANTE',
  VISITANTE = 'VISITANTE',
  OUTRO = 'OUTRO',
}

export enum RelationshipStrength {
  FRACO = 'FRACO',
  MEDIO = 'MEDIO',
  FORTE = 'FORTE',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  TRAMITATE = 'TRAMITATE',
  RECEIVE = 'RECEIVE',
  REJECT = 'REJECT',
  ASSIGN = 'ASSIGN',
  SEARCH = 'SEARCH',
}

export enum EntityType {
  PROCESS = 'PROCESS',
  DOCUMENT = 'DOCUMENT',
  TARGET = 'TARGET',
  USER = 'USER',
  TRAMITATION = 'TRAMITATION',
  ATTACHMENT = 'ATTACHMENT',
  NOTIFICATION = 'NOTIFICATION',
  SYSTEM = 'SYSTEM',
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  TRAMITATION = 'TRAMITATION',
  ASSIGNMENT = 'ASSIGNMENT',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  SYSTEM = 'SYSTEM',
}

export enum DataSource {
  MANUAL = 'MANUAL',
  SNAP = 'SNAP',
  IMPORT = 'IMPORT',
}

export enum GraphEntityType {
  PERSON = 'PERSON',
  COMPANY = 'COMPANY',
  ADDRESS = 'ADDRESS',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  VEHICLE = 'VEHICLE',
  PROPERTY = 'PROPERTY',
  RELATIVE = 'RELATIVE',
}

export enum GraphRelationType {
  WORKS_AT = 'WORKS_AT',
  LIVES_AT = 'LIVES_AT',
  OWNS = 'OWNS',
  RELATED_TO = 'RELATED_TO',
  CONTACTS = 'CONTACTS',
  ASSOCIATED_WITH = 'ASSOCIATED_WITH',
}

export const GRAPH_RELATION_LABEL_MAP: Record<string, GraphRelationType> = {
  endereço: GraphRelationType.LIVES_AT,
  telefone: GraphRelationType.CONTACTS,
  empresa: GraphRelationType.WORKS_AT,
  parente: GraphRelationType.RELATED_TO,
  veículo: GraphRelationType.OWNS,
  WORKS_AT: GraphRelationType.WORKS_AT,
  LIVES_AT: GraphRelationType.LIVES_AT,
  OWNS: GraphRelationType.OWNS,
  RELATED_TO: GraphRelationType.RELATED_TO,
  CONTACTS: GraphRelationType.CONTACTS,
  ASSOCIATED_WITH: GraphRelationType.ASSOCIATED_WITH,
};

export enum ProcessDistribution {
  INTERNO = 'INTERNO',
  EXTERNO = 'EXTERNO',
  INTERNO_EXTERNO = 'INTERNO_EXTERNO',
}

export enum ProcessDocType {
  RELATORIO = 'RELATORIO',
  PEDIDO = 'PEDIDO',
  ENCAMINHAMENTO = 'ENCAMINHAMENTO',
  MENSAGEM = 'MENSAGEM',
  OFICIO = 'OFICIO',
  ORDEM = 'ORDEM',
  INFORME = 'INFORME',
  FORMULARIO = 'FORMULARIO',
  CORRESPONDENCIA = 'CORRESPONDENCIA',
  DENUNCIA = 'DENUNCIA',
  SUMARIO = 'SUMARIO',
}
