import type { AbaFicha } from '../../intelligence/persons/models/person.model';
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export type CategoriaNotificacao =
  | 'alerta-monitoramento'
  | 'evento-mudanca'
  | 'pendencia-analise'
  | 'falha-integracao';

export type PrioridadeNotificacao = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';

export interface NotificacaoCompleta extends Notification {
  categoria: CategoriaNotificacao;
  prioridade: PrioridadeNotificacao;
  pessoaId?: string;
  abaDestino?: AbaFicha;
}

export interface NotificationPreferences {
  user_id: string;
  tramitation: boolean;
  assignment: boolean;
  document_update: boolean;
  system: boolean;
  desktop: boolean;
  email: boolean;
}
