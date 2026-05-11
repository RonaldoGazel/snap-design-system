// src/app/data/pessoa-snap-visao.data.ts

import { Perfil } from '../models/perfil.model';

export interface IdentidadeSnap {
  nomeCompleto: string;
  primeiroNome: string;
  sobrenome: string;
  cpf: string;
  dataNascimento: string; // dd-mm-yyyy
  idade: string;
  sexo: string;
  idioma: string;
  situacaoCpf?: string; // Sintegra
  fotoUrl?: string;
  aliases: AliasSnap[];
}

export interface AliasSnap {
  alias: string;
}

export interface TelefoneSnap {
  numero: string;
  codigoPais: string;
  tipo: string;
}

export interface EmailSnap {
  endereco: string;
  tipo: string;
  provedor: string;
}

export interface EnderecoSnap {
  nome?: string;
  logradouro: string;
  numero: string;
  cidade: string;
  estadoOuRegiao: string;
  cepOuZipcode: string;
  pais: string;
}

export interface ContatosSnap {
  telefones: TelefoneSnap[];
  emails: EmailSnap[];
  enderecos: EnderecoSnap[];
}

export interface VinculoPessoa {
  nomeCompleto: string;
  rotulo: string;
  classificacao: string;
}

export interface VinculoEmpresa {
  razaoSocial: string;
  cnpj: string;
  cargo: string;
  cargoAtual: string;
  dataInicio: string;
  dataTermino: string;
  situacaoAtual: string;
  socios: SocioEmpresa[];
}

export interface SocioEmpresa {
  nomeCompleto: string;
  cpf: string;
  qualificacaoSocietaria: string;
}

export interface ProcessoEscavador {
  numero: string;
  dataRemessa: string;
  dataInstauracao: string;
  orgao: string;
  instancia: string;
  partes: string[];
  advogados: string[];
}

export interface ProcessoSeeu {
  numero: string;
  comarca: string;
  competencia: string;
  dataAutuacao: string;
  vara: string;
  dataSentenca: string;
  juiz: string;
  assuntos: string;
}

export interface MandadoBnmp {
  numero: string;
  dataValidade: string;
  biometria: string;
  orgaoExpedidor: string;
  especiePrisao: string;
  tipificacoesPenais: string;
  pena: string;
  regimePrisional: string;
}

export interface DiarioOficialEscavador {
  data: string;
  local: string;
  descricao: string;
  link: string;
}

export interface DiarioOficialQueridoDiario {
  data: string;
  local: string;
  link: string;
  uf: string;
  edicaoExtra: boolean;
  frases: string[];
}

export interface PerfilDigital {
  plataforma: 'twitter' | 'facebook' | 'linkedin' | 'vk';
  url: string;
  alias: string;
  idPerfil: string;
}

export interface FiliacaoPartidaria {
  sigla: string;
  uf: string;
  dataRegistro: string;
  situacao: string;
  tipo: string;
  dataCancelamento?: string;
  motivoCancelamento?: string;
}

export interface CandidaturaEleitoral {
  anoEleicao: string;
  tipoEleicao: string;
  descricaoEleicao: string;
  unidadeEleitoral: string;
  turno: string;
  cargoEleitoral: string;
  numeroCandidato: string;
  partidoEleitoral: string;
}

export interface VinculoEleitoral {
  valor: string;
  descricao: string;
  data: string;
  tipo: string;
  rotulo: string;
}

export interface ServidorPublico {
  fonte: 'transparencia-manaus' | 'transparencia-pr';
  instituicao: string;
  matricula?: string;
  orgao: string;
  tempoServico?: string;
  carreira?: string;
  municipio?: string;
  quadroFuncional?: string;
  vinculo?: string;
}

export interface DespesaPublica {
  fonte: 'transparencia-am' | 'transparencia-mg';
  data: string;
  credor?: string;
  numeroEmpenho?: string;
  fonteRecurso?: string;
  classificacao?: string;
  valor?: number;
  nomeOrgao?: string;
}

export interface MonitoramentoSnap {
  monitorado: boolean;
  alvo: boolean;
}

export interface PessoaSnapVisao {
  id: string;
  identidade: IdentidadeSnap;
  contatos: ContatosSnap;
  vinculosPessoas: VinculoPessoa[];
  vinculosEmpresas: VinculoEmpresa[];
  processosEscavador: ProcessoEscavador[];
  processosSeeu: ProcessoSeeu[];
  mandadosBnmp: MandadoBnmp[];
  diariosEscavador: DiarioOficialEscavador[];
  diariosQueridoDiario: DiarioOficialQueridoDiario[];
  perfisDigitais: PerfilDigital[];
  filiacaoPartidaria: FiliacaoPartidaria[];
  candidaturas: CandidaturaEleitoral[];
  vinculosEleitorais: VinculoEleitoral[];
  servidoresPublicos: ServidorPublico[];
  despesasPublicas: DespesaPublica[];
  monitoramento: MonitoramentoSnap;
  alertaContextual?: string;
  dataUltimoEnriquecimento?: string;
  fontesDisponiveis: string[]; // quais sub-fontes retornaram dados
  perfis: Perfil[];
}

export const PESSOA_SNAP_MOCK: PessoaSnapVisao = {
  id: 'snap-001',
  identidade: {
    nomeCompleto: 'Carlos Eduardo Fonseca',
    primeiroNome: 'Carlos Eduardo',
    sobrenome: 'Fonseca',
    cpf: '321.654.987-00',
    dataNascimento: '14-03-1978',
    idade: '46',
    sexo: 'Masculino',
    idioma: 'Português',
    situacaoCpf: 'Regular',
    fotoUrl: undefined,
    aliases: [{ alias: 'Carlos Fonseca' }, { alias: 'C.E. Fonseca' }, { alias: 'Carlão' }],
  },
  contatos: {
    telefones: [
      { numero: '(21) 99871-4532', codigoPais: '+55', tipo: 'Celular' },
      { numero: '(21) 3344-8821', codigoPais: '+55', tipo: 'Residencial' },
    ],
    emails: [
      { endereco: 'carlos.fonseca@email.com', tipo: 'Pessoal', provedor: 'Gmail' },
      { endereco: 'cfonseca@construtora.com.br', tipo: 'Profissional', provedor: 'Corporativo' },
    ],
    enderecos: [
      {
        logradouro: 'Rua das Acácias',
        numero: '412',
        cidade: 'Rio de Janeiro',
        estadoOuRegiao: 'RJ',
        cepOuZipcode: '22041-001',
        pais: 'Brasil',
      },
      {
        logradouro: 'Av. Brasil',
        numero: '1800',
        cidade: 'Niterói',
        estadoOuRegiao: 'RJ',
        cepOuZipcode: '24020-002',
        pais: 'Brasil',
      },
    ],
  },
  vinculosPessoas: [
    { nomeCompleto: 'Roberto Alves Mendes', rotulo: 'Sócio', classificacao: 'Empresarial' },
    { nomeCompleto: 'Patrícia Lima Fonseca', rotulo: 'Cônjuge', classificacao: 'Familiar' },
    { nomeCompleto: 'Marcos Vinícius Souza', rotulo: 'Associado', classificacao: 'Suspeito' },
  ],
  vinculosEmpresas: [
    {
      razaoSocial: 'Fonseca & Mendes Construções Ltda',
      cnpj: '12.345.678/0001-90',
      cargo: 'Sócio-Administrador',
      cargoAtual: 'Sócio-Administrador',
      dataInicio: '2015-03-10',
      dataTermino: '',
      situacaoAtual: 'Ativa',
      socios: [
        {
          nomeCompleto: 'Carlos Eduardo Fonseca',
          cpf: '321.654.987-00',
          qualificacaoSocietaria: 'Sócio-Administrador',
        },
        {
          nomeCompleto: 'Roberto Alves Mendes',
          cpf: '456.789.123-00',
          qualificacaoSocietaria: 'Sócio',
        },
      ],
    },
    {
      razaoSocial: 'CEF Empreendimentos ME',
      cnpj: '98.765.432/0001-11',
      cargo: 'Titular',
      cargoAtual: 'Titular',
      dataInicio: '2019-07-22',
      dataTermino: '',
      situacaoAtual: 'Baixada',
      socios: [
        {
          nomeCompleto: 'Carlos Eduardo Fonseca',
          cpf: '321.654.987-00',
          qualificacaoSocietaria: 'Titular',
        },
      ],
    },
  ],
  processosEscavador: [
    {
      numero: '0012345-67.2021.8.19.0001',
      dataRemessa: '15/03/2021',
      dataInstauracao: '10/03/2021',
      orgao: 'TJRJ — 3ª Vara Criminal',
      instancia: '1ª Instância',
      partes: ['Carlos Eduardo Fonseca', 'Ministério Público do Estado do Rio de Janeiro'],
      advogados: ['Dr. Antônio Pereira — OAB/RJ 98765'],
    },
    {
      numero: '0054321-89.2023.8.19.0042',
      dataRemessa: '08/11/2023',
      dataInstauracao: '01/11/2023',
      orgao: 'TJRJ — 7ª Vara Cível',
      instancia: '1ª Instância',
      partes: ['Fonseca & Mendes Construções Ltda', 'Banco do Brasil S.A.'],
      advogados: ['Dra. Fernanda Costa — OAB/RJ 54321'],
    },
  ],
  processosSeeu: [
    {
      numero: '0098765-43.2022.8.19.0001',
      comarca: 'Rio de Janeiro',
      competencia: 'Criminal',
      dataAutuacao: '22/06/2022',
      vara: '5ª Vara de Execuções Penais',
      dataSentenca: '14/09/2022',
      juiz: 'Dr. Henrique Moraes',
      assuntos: 'Estelionato — Art. 171 CP',
    },
  ],
  mandadosBnmp: [
    {
      numero: 'BNMP-2024-RJ-00871',
      dataValidade: '31/12/2025',
      biometria: 'Disponível',
      orgaoExpedidor: 'TJRJ — 3ª Vara Criminal',
      especiePrisao: 'Preventiva',
      tipificacoesPenais: 'Art. 171 CP — Estelionato; Art. 288 CP — Associação Criminosa',
      pena: '4 anos e 6 meses',
      regimePrisional: 'Fechado',
    },
  ],
  diariosEscavador: [
    {
      data: '07/11/2023',
      local: 'Rio de Janeiro',
      descricao: 'Nomeação para cargo comissionado — Secretaria Municipal de Obras',
      link: 'https://diario.rio.rj.gov.br/2023/11/07',
    },
    {
      data: '15/04/2022',
      local: 'Rio de Janeiro',
      descricao: 'Contrato de prestação de serviços — Fonseca & Mendes Construções Ltda',
      link: 'https://diario.rio.rj.gov.br/2022/04/15',
    },
  ],
  diariosQueridoDiario: [
    {
      data: '12/08/2023',
      local: 'Rio de Janeiro',
      link: 'https://queridodiario.ok.org.br/2023/08/12',
      uf: 'RJ',
      edicaoExtra: false,
      frases: ['Carlos Eduardo Fonseca — designado para comissão de licitação'],
    },
  ],
  perfisDigitais: [
    {
      plataforma: 'twitter',
      url: 'https://twitter.com/carlosedfonseca',
      alias: '@carlosedfonseca',
      idPerfil: '1234567890',
    },
    {
      plataforma: 'linkedin',
      url: 'https://linkedin.com/in/carlos-fonseca-rj',
      alias: 'Carlos Eduardo Fonseca',
      idPerfil: 'carlos-fonseca-rj',
    },
  ],
  filiacaoPartidaria: [
    {
      sigla: 'MDB',
      uf: 'RJ',
      dataRegistro: '12/03/2010',
      situacao: 'Regular',
      tipo: 'Filiado',
      dataCancelamento: undefined,
      motivoCancelamento: undefined,
    },
  ],
  candidaturas: [
    {
      anoEleicao: '2020',
      tipoEleicao: 'Municipal',
      descricaoEleicao: 'Eleições Municipais 2020',
      unidadeEleitoral: 'Rio de Janeiro/RJ',
      turno: '1º Turno',
      cargoEleitoral: 'Vereador',
      numeroCandidato: '15123',
      partidoEleitoral: 'MDB',
    },
  ],
  vinculosEleitorais: [
    {
      valor: 'R$ 5.000,00',
      descricao: 'Doação a candidato a deputado estadual',
      data: '15/08/2022',
      tipo: 'Doação',
      rotulo: 'Doador',
    },
  ],
  servidoresPublicos: [
    {
      fonte: 'transparencia-manaus',
      instituicao: 'Prefeitura Municipal do Rio de Janeiro',
      matricula: 'RJ-2023-00871',
      orgao: 'Secretaria Municipal de Obras',
      tempoServico: '1 ano e 4 meses',
    },
  ],
  despesasPublicas: [
    {
      fonte: 'transparencia-am',
      data: '10/09/2023',
      credor: 'Fonseca & Mendes Construções Ltda',
      numeroEmpenho: '2023NE004521',
      fonteRecurso: 'Tesouro Municipal',
      classificacao: 'Obras e Instalações',
      valor: 487500.0,
      nomeOrgao: 'Secretaria Municipal de Obras',
    },
  ],
  monitoramento: { monitorado: true, alvo: false },
  alertaContextual: 'Mandado de prisão ativo (BNMP). Verificar localização.',
  dataUltimoEnriquecimento: '2024-01-12T08:30:00',
  fontesDisponiveis: [
    'piplcpf',
    'bnmp',
    'escavador',
    'seeu',
    'tse-filiacao',
    'tse-doadores',
    'transparencia-manaus',
    'transparencia-am',
    'querido-diario',
  ],
  perfis: [{ tipo: 'alvo', ativo: true, dataInicio: '2023-01-15', detalhes: { motivo: 'Mandado de prisão ativo' } }],
};
