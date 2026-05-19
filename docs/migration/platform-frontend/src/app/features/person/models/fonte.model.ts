export type TipoFonte = 'sipen' | 'snap' | 'manual';

export interface Fonte {
  tipo: TipoFonte;
  prioridade: number;
  dataConsulta: string;
  status: 'ativa' | 'divergente' | 'reconciliada';
}

export type StatusDivergencia =
  | 'sem-divergencia'
  | 'divergencia-identificada'
  | 'divergencia-resolvida'
  | 'divergencia-mantida-como-sinal';
