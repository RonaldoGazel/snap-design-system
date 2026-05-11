import { TipoFonte } from './fonte.model';

export interface Alerta {
  id: string;
  tipo: string;
  severidade: 'critica' | 'alta' | 'media' | 'baixa';
  descricao: string;
  dataGeracao: string;
  lido: boolean;
  pessoaId: string;
  fonte: TipoFonte;
}
