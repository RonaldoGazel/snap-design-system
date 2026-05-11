import { Perfil } from './perfil.model';
import { Fonte, StatusDivergencia } from './fonte.model';
import { Tag } from './tag.model';

export interface Pessoa {
  id: string;
  nome: string;
  nomeSocial?: string;
  vulgos: string[];
  cpf?: string;
  rg?: string;
  matricula?: string;
  dataNascimento?: string;
  sexo?: string;
  fotoUrl?: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  nacionalidade?: string;
  perfis: Perfil[];
  fontes: Fonte[];
  resumoAnalitico: string;
  statusReconciliacao: StatusDivergencia;
  indicadoresAnaliticos?: IndicadoresAnaliticos;
  monitoramento?: Monitoramento;
  situacaoPrisionalAtual?: SituacaoPrisional;
  tagsRelevantes: Tag[];
  _sources?: Array<{ graph_id: string; display_name: string }>;
  _merged_from?: number;
  rotulos?: string[];
}

export interface IndicadoresAnaliticos {
  nivelRisco: 'critico' | 'alto' | 'medio' | 'baixo';
  relevancia: number;
  periculosidade?: string;
  qtdAlertas: number;
  qtdVinculos: number;
  qtdDocumentosCitantes: number;
}

export interface Monitoramento {
  monitorado: boolean;
  alvo: boolean;
  dataInicioMonitoramento?: string;
  setorResponsavel?: string;
  criticidade?: 'critica' | 'alta' | 'media' | 'baixa';
}

export interface SituacaoPrisional {
  unidade: string;
  regime: string;
  status: string;
  dataUltimaAtualizacao: string;
}
