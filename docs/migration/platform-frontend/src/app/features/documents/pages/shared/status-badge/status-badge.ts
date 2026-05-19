import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';

import { DocumentStatus, ProcessStatus } from '../../models/document.models';

type StatusContext = 'process' | 'document' | 'step';
type TagSeverity = 'success' | 'warn' | 'danger' | 'secondary' | 'info' | 'contrast';

const PROCESS_SEVERITY_MAP: Record<ProcessStatus, TagSeverity> = {
  ATIVO: 'info',
  ARQUIVADO: 'secondary',
  CANCELADO: 'danger',
  TRAMITANDO: 'warn',
};

const PROCESS_LABEL_MAP: Record<ProcessStatus, string> = {
  ATIVO: 'ATIVO',
  ARQUIVADO: 'ARQUIVADO',
  CANCELADO: 'CANCELADO',
  TRAMITANDO: 'TRAMITANDO',
};

const DOCUMENT_SEVERITY_MAP: Record<string, TagSeverity> = {
  RASCUNHO: 'secondary',
  ACTIVE: 'info',
  IN_REVIEW: 'warn',
  FORMALIZED: 'success',
  REJECTED: 'danger',
  TRAMITATING: 'warn',
  ASSIGNED: 'contrast',
  ARCHIVED: 'secondary',
  // Workflow-aware statuses (from DocumentStoreService.DocumentStatus)
  EM_PRODUCAO: 'info',
  EM_REVISAO: 'warn',
  EM_FORMALIZACAO: 'warn',
  FORMALIZADO: 'success',
  EM_DIFUSAO_INTERNA: 'info',
  EM_DIFUSAO_EXTERNA: 'info',
  DIFUNDIDO: 'success',
  CANCELADO: 'danger',
};

const DOCUMENT_LABEL_MAP: Record<string, string> = {
  RASCUNHO: 'RASCUNHO',
  ACTIVE: 'ATIVO',
  IN_REVIEW: 'EM REVISÃO',
  FORMALIZED: 'FORMALIZADO',
  REJECTED: 'REJEITADO',
  TRAMITATING: 'TRAMITANDO',
  ASSIGNED: 'ATRIBUÍDO',
  ARCHIVED: 'ARQUIVADO',
  // Workflow-aware statuses
  EM_PRODUCAO: 'EM PRODUÇÃO',
  EM_REVISAO: 'EM REVISÃO',
  EM_FORMALIZACAO: 'EM FORMALIZAÇÃO',
  FORMALIZADO: 'FORMALIZADO',
  EM_DIFUSAO_INTERNA: 'DIFUSÃO INTERNA',
  EM_DIFUSAO_EXTERNA: 'DIFUSÃO EXTERNA',
  DIFUNDIDO: 'DIFUNDIDO',
  CANCELADO: 'CANCELADO',
};

/** Resolve step name: strip 'step.' prefix for lookup. */
function normalizeStepKey(value: string): string {
  return value.startsWith('step.') ? value.substring(5) : value;
}

const STEP_LABEL_MAP: Record<string, string> = {
  production: 'Produção',
  review: 'Revisão',
  approval: 'Aprovação',
  formalization: 'Formalização',
  dispatch: 'Despacho',
  internal_dissemination: 'Disseminação Interna',
  external_dissemination: 'Disseminação Externa',
  initiation: 'Iniciação',
  terminal: 'Estado Final',
  operational_task: 'Tarefa Operacional',
};

const STEP_SEVERITY_MAP: Record<string, TagSeverity> = {
  production: 'info',
  review: 'warn',
  approval: 'warn',
  formalization: 'success',
  dispatch: 'info',
  internal_dissemination: 'info',
  external_dissemination: 'info',
  initiation: 'secondary',
  terminal: 'success',
  operational_task: 'info',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [Tag],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadgeComponent {
  status = input<string | null | undefined>();
  context = input<StatusContext>('process');

  severity = computed<TagSeverity | undefined>(() => {
    const value = this.status();
    const ctx = this.context();
    if (!value) return undefined;

    if (ctx === 'process') {
      return PROCESS_SEVERITY_MAP[value as ProcessStatus];
    }
    if (ctx === 'step') {
      return STEP_SEVERITY_MAP[normalizeStepKey(value)] ?? 'secondary';
    }
    return DOCUMENT_SEVERITY_MAP[value];
  });

  label = computed<string | undefined>(() => {
    const value = this.status();
    const ctx = this.context();
    if (!value) return undefined;

    if (ctx === 'process') {
      return PROCESS_LABEL_MAP[value as ProcessStatus];
    }
    if (ctx === 'step') {
      const key = normalizeStepKey(value);
      return STEP_LABEL_MAP[key] ?? value;
    }
    return DOCUMENT_LABEL_MAP[value] ?? value;
  });
}
