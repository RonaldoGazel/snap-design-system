export type TipoPerfil =
  | 'preso'
  | 'ex-preso'
  | 'visitante'
  | 'familiar'
  | 'advogado'
  | 'alvo'
  | 'pessoa-relacionada'
  | 'servidor';

export interface Perfil {
  tipo: TipoPerfil;
  ativo: boolean;
  dataInicio: string;
  dataFim?: string;
  detalhes: Record<string, string | number | boolean>;
}
