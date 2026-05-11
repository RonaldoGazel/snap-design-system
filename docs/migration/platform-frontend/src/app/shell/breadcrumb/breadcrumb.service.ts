import { Injectable, signal } from '@angular/core';

const KNOWN_LABELS: Record<string, string> = {
  snap: 'shell.breadcrumb.snap',
  'audit-logs': 'shell.breadcrumb.audit',
  intelligence: 'shell.breadcrumb.intelligence',
  person: 'shell.breadcrumb.person',
  dashboard: 'shell.breadcrumb.dashboard',
  profile: 'shell.breadcrumb.profile',
  cadastro: 'shell.breadcrumb.registration',
  registration: 'shell.breadcrumb.registration',
  documents: 'shell.breadcrumb.documents',
  // Admin / IAM labels
  admin: 'shell.breadcrumb.admin',
  users: 'shell.breadcrumb.users',
  organizations: 'shell.breadcrumb.organizations',
  groups: 'shell.breadcrumb.groups',
  roles: 'shell.breadcrumb.roles',
  invitations: 'shell.breadcrumb.invitations',
  'all-users': 'shell.breadcrumb.allUsers',

  // POI route segment labels
  poi: 'shell.breadcrumb.poi',
  // `pessoas` is a legacy path alias for `person`; surface the same label so
  // the breadcrumb deduplication collapses consecutive duplicates.
  pessoas: 'shell.breadcrumb.person',
  'tela-01': 'Painel Inicial',
  'tela-02': 'Busca Geral',
  'tela-03': 'Resultado da Busca',
  'tela-04': 'Filtros Avançados',
  // cadastro: 'Cadastro e Integração',
  'tela-10': 'Fila de Duplicidades',
  'tela-11': 'Comparação de Duplicidade',
  'tela-12': 'Visão Geral',
  'tela-13': 'Timeline',
  'tela-14': 'Vínculos',
  'tela-15': 'Grafo',
  'tela-16': 'Tags',
  'tela-17': 'Alertas',
  'tela-18': 'Monitoramento',
  'tela-19': 'Visão Preso',
  'tela-20': 'Visão Ex-Preso',
  'tela-21': 'Visão Visitante',
  'tela-22': 'Visão Advogado',
  'tela-23': 'Visão Alvo',
  'tela-24': 'Visão Servidor',
  modulo: 'Módulos',
  busca: 'Busca',
  analise: 'Análise',
  documentos: 'Documentos',
  monitoramento: 'Monitoramento',
  configuracoes: 'Configurações',
};

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  readonly overrides = signal<Map<string, string>>(new Map());

  setOverride(segment: string, label: string): void {
    this.overrides.update((prev) => new Map(prev).set(segment, label));
  }

  clearOverride(segment: string): void {
    this.overrides.update((prev) => {
      const next = new Map(prev);
      next.delete(segment);
      return next;
    });
  }

  getLabel(segment: string): string {
    const override = this.overrides().get(segment);
    if (override) return override;
    return KNOWN_LABELS[segment] ?? segment;
  }
}
