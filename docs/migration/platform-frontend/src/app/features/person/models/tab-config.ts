import { UnifiedPerson } from './unified-person.model';

export type TabEntry =
  | { index: number; label: string; alwaysVisible: true }
  | { index: number; label: string; alwaysVisible?: false; requiresSection: keyof UnifiedPerson };

export const PROFILE_TABS: readonly TabEntry[] = [
  { index: 0,  label: 'Visão Geral',            alwaysVisible: true },
  { index: 1,  label: 'Histórico Penal',        requiresSection: 'penalHistory' },
  { index: 2,  label: 'Prontuário Jurídico',    requiresSection: 'legalRecord' },
  { index: 3,  label: 'Visitas e Comunicações',  requiresSection: 'visitors' },
  { index: 4,  label: 'Imagens',                 requiresSection: 'images' },
  { index: 5,  label: 'Movimentação',            requiresSection: 'movements' },
  { index: 6,  label: 'Contatos',                alwaysVisible: true },
  { index: 7,  label: 'Vínculos',                alwaysVisible: true },
  { index: 8,  label: 'Processos Judiciais',     alwaysVisible: true },
  { index: 9,  label: 'Mandados (BNMP)',         alwaysVisible: true },
  { index: 10, label: 'Diários Oficiais',        alwaysVisible: true },
  { index: 11, label: 'Perfis Digitais',         alwaysVisible: true },
  { index: 12, label: 'Dados Eleitorais',        alwaysVisible: true },
  { index: 13, label: 'Transparência',           alwaysVisible: true },
  { index: 14, label: 'Ocorrências',             requiresSection: 'occurrences' },
  { index: 15, label: 'Atividades',              requiresSection: 'activities' },
] as const;

/**
 * Returns only tabs whose data section exists on the person (or are always visible).
 * Tab order is preserved.
 */
export function getVisibleTabs(person: UnifiedPerson): TabEntry[] {
  return PROFILE_TABS.filter(tab => {
    if (tab.alwaysVisible) return true;
    return person[(tab as { requiresSection: keyof UnifiedPerson }).requiresSection] !== undefined;
  });
}
