import { TipoFonte } from './fonte.model';

export type TipoVinculo =
  | 'familiar'
  | 'prisional'
  | 'documental'
  | 'juridico'
  | 'institucional'
  | 'faccional';

export interface Vinculo {
  id: string;
  pessoaOrigemId: string;
  pessoaDestinoId: string;
  tipo: TipoVinculo;
  rotulo: string;
  dataIdentificacao: string;
  fonte: TipoFonte;
  ativo: boolean;
}
