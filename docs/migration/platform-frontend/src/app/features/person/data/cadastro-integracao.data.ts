// Mock data para o Stepper de Cadastro, Integração e Consolidação

export interface CadastroRapidoForm {
  nome: string;
  rg?: string;
  cpf?: string;
  vulgo?: string;
  perfil?: string;
  observacao?: string;
}

export interface IdentidadeIncompletaForm {
  vulgo: string;
  nomeAproximado?: string;
  descricao?: string;
  sexo?: string;
  faixaEtaria?: string;
  perfil?: string;
  unidade?: string;
  origemDado?: string;
  motivo?: string;
  pessoaRelacionada?: string;
}

export interface Hipotese {
  nome: string;
  vulgo?: string;
  perfil: string;
  score: number;
}

export interface ResultadoSipen {
  encontrado: boolean;
  dados?: {
    nome: string;
    rg: string;
    cpf?: string;
    pai: string;
    mae: string;
    nascimento: string;
    unidade: string;
    situacao: string;
    periculosidade: string;
    faccao?: string;
    fotoUrl: string;
    vulgos: string[];
    resumoCustodia: string;
  };
}

export interface DadosSnap {
  contatos: {
    telefones: { numero: string; tipo: string }[];
    emails: { endereco: string; tipo: string }[];
    enderecos: {
      logradouro: string;
      numero: string;
      cidade: string;
      estado: string;
      cep: string;
    }[];
  };
  pessoasRelacionadas: { nome: string; vinculo: string; classificacao: string }[];
  empresas: {
    razaoSocial: string;
    cnpj: string;
    situacao: string;
    socios: { nome: string; qualificacao: string }[];
  }[];
  perfisDigitais: { rede: string; alias: string; url: string }[];
  processos: { numero: string; orgao: string; data: string }[];
  mandados: { numero: string; especie: string; tipificacoes: string }[];
  diariosOficiais: { data: string; local: string; descricao: string }[];
  alertas: string[];
}

export interface CampoConciliacao {
  campo: string;
  sipen?: string;
  snap?: string;
  manual?: string;
  decisao: 'sipen' | 'snap' | 'ambos' | 'revisar';
  divergente?: boolean;
}

export interface ItemDuplicidade {
  nomeA: string;
  nomeB: string;
  score: number;
  motivo: string;
  perfilA: string;
  perfilB: string;
}

export interface ComparacaoDetalhe {
  registroA: {
    nome: string;
    perfil: string;
    fotoUrl?: string;
    rg?: string;
    cpf?: string;
    fontes: string[];
  };
  registroB: {
    nome: string;
    perfil: string;
    fotoUrl?: string;
    rg?: string;
    cpf?: string;
    fontes: string[];
  };
  camposMatch: { campo: string; valor: string }[];
  camposDivergentes: { campo: string; valorA: string; valorB: string }[];
  camposExclusivos: { campo: string; valor: string; lado: 'A' | 'B' }[];
  impactoMerge: { documentos: number; tags: number; vinculos: number; alertas: number };
}

export interface CadastroMock {
  cadastroRapido: CadastroRapidoForm;
  identidadeIncompleta: IdentidadeIncompletaForm;
  hipoteses: Hipotese[];
  resultadoSipen: ResultadoSipen;
  dadosSnap: DadosSnap;
  camposConciliacao: CampoConciliacao[];
  filaDuplicidades: ItemDuplicidade[];
  comparacaoDetalhe: ComparacaoDetalhe;
}

export const MOCK_CADASTRO: CadastroMock = {
  cadastroRapido: {
    nome: 'Wagner Almeida Sobrinho',
    vulgo: 'Bigode',
    perfil: 'alvo',
    observacao:
      'Identificado em relatório de inteligência sobre articulação faccional externa. Sem passagem prisional confirmada.',
  },
  identidadeIncompleta: {
    vulgo: 'Neném da B7',
    nomeAproximado: 'Nelson ou Nélson',
    descricao:
      'Homem, ~30 anos, referenciado em interceptação telefônica como articulador de entregas na Baixada Fluminense',
    sexo: 'Masculino',
    faixaEtaria: '26-35',
    perfil: 'pessoa-relacionada',
    unidade: 'Bangu III',
    origemDado: 'Monitoramento',
    motivo:
      'Citado em 3 interceptações distintas vinculadas a preso monitorado. Identidade civil não confirmada.',
  },
  hipoteses: [
    { nome: 'Nelson Barbosa', vulgo: 'Neném', perfil: 'ex-preso', score: 78 },
    { nome: 'Nélson B. da Silva', perfil: 'pessoa-relacionada', score: 65 },
    { nome: 'Neno Barbosa Filho', vulgo: 'Neném', perfil: 'visitante', score: 52 },
  ],
  resultadoSipen: {
    encontrado: true,
    dados: {
      nome: 'Wagner Almeida Sobrinho',
      rg: '23.456.789-0',
      cpf: '034.567.890-12',
      pai: 'José Almeida',
      mae: 'Cláudia Sobrinho',
      nascimento: '1978-12-05',
      unidade: 'Sem registro prisional ativo',
      situacao: 'Sem custódia',
      periculosidade: 'Não classificado',
      fotoUrl: '/images/photos/pessoa-05.png',
      vulgos: ['Bigode'],
      resumoCustodia:
        'Sem passagem prisional registrada no SIPEN. Identificado apenas por referência cruzada com preso monitorado em Bangu III.',
    },
  },
  dadosSnap: {
    contatos: {
      telefones: [
        { numero: '(21) 98765-4321', tipo: 'Celular' },
        { numero: '(21) 3456-7890', tipo: 'Residencial' },
      ],
      emails: [{ endereco: 'w.almeida.sobrinho@email.com', tipo: 'Pessoal' }],
      enderecos: [
        {
          logradouro: 'Rua das Acácias',
          numero: '112',
          cidade: 'Duque de Caxias',
          estado: 'RJ',
          cep: '25085-000',
        },
        {
          logradouro: 'Av. Brasil',
          numero: '4500',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          cep: '21040-360',
        },
      ],
    },
    pessoasRelacionadas: [
      {
        nome: 'Carla Eduarda Mentes',
        vinculo: 'Associação faccional',
        classificacao: 'Presa monitorada',
      },
      {
        nome: 'Luciana Martins',
        vinculo: 'Referência cruzada SNAP',
        classificacao: 'Pessoa relacionada',
      },
      {
        nome: 'Renato Figueiredo',
        vinculo: 'Articulação externa',
        classificacao: 'Alvo prioritário',
      },
    ],
    empresas: [
      {
        razaoSocial: 'MN Transportes Ltda',
        cnpj: '12.345.678/0001-90',
        situacao: 'Baixada',
        socios: [
          { nome: 'Wagner Almeida Sobrinho', qualificacao: 'Sócio-Administrador' },
          { nome: 'Jorge Nascimento', qualificacao: 'Sócio' },
        ],
      },
    ],
    perfisDigitais: [
      { rede: 'Facebook', alias: 'w.almeida.bigode', url: 'https://facebook.com/w.almeida.bigode' },
    ],
    processos: [{ numero: '0012345-78.2024.8.19.01.0001', orgao: 'TJ-RJ', data: '2024-03-15' }],
    mandados: [],
    diariosOficiais: [
      {
        data: '2023-11-07',
        local: 'Rio de Janeiro',
        descricao: 'Publicação de ato societário — MN Transportes Ltda',
      },
    ],
    alertas: [
      'Possível divergência de filiação (nome da mãe)',
      'Endereço externo em área de interesse operacional',
      'Empresa baixada com sócio preso monitorado',
    ],
  },
  camposConciliacao: [
    {
      campo: 'Nome',
      sipen: 'Wagner Almeida Sobrinho',
      snap: 'Wagner Almeida Sobrinho',
      decisao: 'sipen',
    },
    { campo: 'CPF', sipen: '034.567.890-12', snap: '034.567.890-12', decisao: 'sipen' },
    { campo: 'RG', sipen: '23.456.789-0', decisao: 'sipen' },
    {
      campo: 'Nome da mãe',
      sipen: 'Cláudia Sobrinho',
      snap: 'Cláudia M. Sobrinho Almeida',
      decisao: 'ambos',
      divergente: true,
    },
    { campo: 'Nome do pai', sipen: 'José Almeida', snap: 'José Almeida', decisao: 'sipen' },
    { campo: 'Nascimento', sipen: '05/12/1978', snap: '05/12/1978', decisao: 'sipen' },
    {
      campo: 'Vulgo',
      sipen: 'Bigode',
      snap: 'Bigode, Bigodão',
      decisao: 'ambos',
      divergente: true,
    },
    { campo: 'Unidade', sipen: 'Sem registro prisional', decisao: 'sipen' },
    { campo: 'Periculosidade', sipen: 'Não classificado', decisao: 'sipen' },
    { campo: 'Telefone', snap: '(21) 98765-4321', decisao: 'snap' },
  ],
  filaDuplicidades: [
    {
      nomeA: 'Wagner Almeida Sobrinho',
      nomeB: 'Wagner A. Sobrinho',
      score: 92,
      motivo: 'Mesmo CPF, fontes divergentes',
      perfilA: 'alvo',
      perfilB: 'pessoa-relacionada',
    },
    {
      nomeA: 'Wagner Almeida Sobrinho',
      nomeB: 'Wagner Bigode',
      score: 74,
      motivo: 'Mesmo vulgo, nome parcial',
      perfilA: 'alvo',
      perfilB: 'registro incompleto',
    },
    {
      nomeA: 'Wagner Almeida Sobrinho',
      nomeB: 'W. Almeida',
      score: 58,
      motivo: 'Similaridade fonética e sobrenome',
      perfilA: 'alvo',
      perfilB: 'visitante',
    },
  ],
  comparacaoDetalhe: {
    registroA: {
      nome: 'Wagner Almeida Sobrinho',
      perfil: 'alvo',
      fotoUrl: '/images/photos/pessoa-05.png',
      rg: '23.456.789-0',
      cpf: '034.567.890-12',
      fontes: ['SIPEN', 'SNAP', 'Manual'],
    },
    registroB: {
      nome: 'Wagner A. Sobrinho',
      perfil: 'pessoa-relacionada',
      rg: '23.456.789-0',
      fontes: ['Manual'],
    },
    camposMatch: [
      { campo: 'Nome', valor: 'Wagner Almeida Sobrinho' },
      { campo: 'CPF', valor: '034.567.890-12' },
      { campo: 'Nascimento', valor: '05/12/1978' },
      { campo: 'Pai', valor: 'José Almeida' },
      { campo: 'Naturalidade', valor: 'Baixada Fluminense - RJ' },
    ],
    camposDivergentes: [
      { campo: 'Nome da mãe', valorA: 'Cláudia Sobrinho', valorB: 'Cláudia M. Sobrinho' },
      { campo: 'Vulgo', valorA: 'Bigode', valorB: 'Bigodão' },
      { campo: 'Fonte', valorA: 'SIPEN + SNAP + Manual', valorB: 'Manual apenas' },
    ],
    camposExclusivos: [
      { campo: 'Foto', valor: 'Disponível', lado: 'A' },
      { campo: 'Facção', valor: 'PCC (referência)', lado: 'A' },
      { campo: 'Endereço SNAP', valor: 'Rua das Acácias, 112 — Duque de Caxias', lado: 'A' },
      { campo: 'Observação manual', valor: 'Citado em relatório de inteligência', lado: 'B' },
    ],
    impactoMerge: { documentos: 2, tags: 3, vinculos: 4, alertas: 1 },
  },
};
