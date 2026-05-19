// Mock completo para Tela 19 — Visão de Preso
// Consolida dados SIPEN + SNAP para um preso fictício

import { Perfil } from '../models/perfil.model';

export interface PresoVisaoMock {
  // Identificação
  id: string;
  nome: string;
  vulgos: string[];
  cpf: string;
  rg: string;
  matriculaSipen: string;
  codigoSipen: string;
  pic: string;
  rji: string;
  fotoUrl: string;
  nascimento: string;
  idade: number;
  sexo: string;
  pai: string;
  mae: string;
  naturalidade: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  escolaridade: string;
  religiao: string;
  etnia: string;
  tags: { rotulo: string; categoria: string; cor?: string }[];

  // Custódia
  statusPrisional: string;
  classificacaoSeguranca: string;
  periculosidade: 'critico' | 'alto' | 'medio' | 'baixo';
  crime: string;
  artigo: string;
  regime: string;
  unidade: string;
  pavilhao?: string;
  galeria?: string;
  cela?: string;
  dataUltimaAtualizacao: string;

  // Classificação
  faccao?: string;
  papelFaccao?: string;
  monitoramento: {
    monitorado: boolean;
    alvo: boolean;
    dataInicio?: string;
    setor?: string;
    criticidade?: string;
  };

  // Processo
  prontuarioSipen: string;
  processoDpj: string;
  ambiente: string;
  entradaSistema: string;
  origem: string;

  // Histórico penal
  historicoPenal: {
    tipo: string;
    titulo: string;
    descricao: string;
    data: string;
    status?: string;
  }[];
  indiceBehavior: { dataReferencia: string; indice: string; observacao?: string }[];
  regalias: { data: string; tipo: string; status: string }[];
  beneficios: { data: string; tipo: string; status: string }[];
  remicaoPena: { data: string; criterio: string; quantidade: string; status: string }[];

  // Prontuário jurídico
  calculoPena: {
    dataPrisao: string;
    ingressoSeap: string;
    terminoPena: string;
    totalSentenca: string;
    tempoCumprido: string;
    tempoACumprir: string;
    diasTrabalhados: string;
  };
  datasBeneficio: {
    umSexto: string;
    umQuarto: string;
    umTerco: string;
    umMeio: string;
    doisTercos: string;
  };
  processos: {
    numero: string;
    vara: string;
    status: string;
    dataDelito: string;
    sentencas: { data: string; crime: string; condenacao: string; pena: string }[];
    capitulacao: { artigo: string; descricao: string }[];
  }[];
  ocorrenciasJuridicas: {
    processo: string;
    data: string;
    descricao: string;
    tipo: string;
    resultado: string;
  }[];
  vep: {
    dataUltimoCalculo: string;
    sentenca: string;
    processo: string;
    capitulacao: string;
  };

  // Visitantes
  visitantesFamilia: {
    rg: string;
    nome: string;
    fotoUrl?: string;
    qualificacao: string;
    situacaoCarteira: string;
    analiseCriminal?: string;
    proibido: boolean;
  }[];
  visitantesReligiosos: { nome: string; instituicao: string; status: string }[];
  agentesConsulares: { nome: string; pais: string; status: string }[];
  visitasIntimas: { data: string; status: string }[];

  // Advogados
  advogados: {
    nome: string;
    oab: string;
    ufSeccional: string;
    situacao: string;
    qtdClientes: number;
    recorrente: boolean;
  }[];
  atendimentosJuridicos: { data: string; advogado: string; tipo: string }[];

  // Imagens
  fotos: { url: string; tipo: string; data: string }[];
  sinaisCaracteristicos: {
    slot: string;
    descricao: string;
    localizacao: string;
    url: string;
  }[];
  documentacaoCivil: { tipo: string; descricao: string; url?: string }[];

  // Movimentação
  movimentacoes: {
    ocorrencia: string;
    evento: string;
    dataEvento: string;
    unidade: string;
    destino?: string;
    conclusao: string;
  }[];
  historicoLocalizacao: {
    dataInicio: string;
    dataFim?: string;
    unidade: string;
    pavilhao?: string;
    galeria?: string;
    cela?: string;
  }[];

  // SNAP
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
    cnae?: string;
    socios: { nome: string; cpf: string; qualificacao: string }[];
  }[];
  perfisDigitais: { rede: string; alias: string; url: string }[];
  antecedentesCriminais: { descricao: string; extensao: string }[];
  mandadosPrisao: {
    numero: string;
    validade: string;
    especie: string;
    tipificacoes: string;
    pena: string;
    regime: string;
  }[];
  processosJudiciais: {
    numero: string;
    orgao: string;
    instancia: string;
    data: string;
    advogados: { nome: string; oab: string }[];
  }[];
  diariosOficiais: { data: string; local: string; descricao: string; link: string }[];
  informacoesEleitorais: {
    doacoes: { candidato: string; valor: string; data: string; partido: string }[];
    filiacao: { partido: string; uf: string; situacao: string; dataRegistro: string }[];
  };

  // SOE / Ocorrências
  ordensServico: {
    numero: string;
    data: string;
    tipo: string;
    finalidade: string;
    situacao: string;
  }[];
  registroOcorrencias: {
    data: string;
    descricao: string;
    responsavel: string;
    setor: string;
  }[];

  // Patrimônio
  atividadesLaborativas: {
    dataInicio: string;
    dataFim?: string;
    descricao: string;
    programa: string;
    status: string;
  }[];
  atividadesEducacionais: {
    dataInicio: string;
    dataFim?: string;
    curso: string;
    status: string;
  }[];

  // Alerta contextual
  alertaContextual?: string;

  // Perfis
  perfis: Perfil[];
}

export const MOCK_PRESO_VISAO: PresoVisaoMock = {
  id: 'p-visao-1',
  nome: 'Maurício Nascimento',
  vulgos: ['Mauricinho', 'MN'],
  cpf: '034.567.890-12',
  rg: '23.456.789-0',
  matriculaSipen: 'SIPEN-2018-003412',
  codigoSipen: 'CS-2018-003412',
  pic: 'PIC-RJ-00341',
  rji: 'RJI-2018-09876',
  fotoUrl: '/images/photos/pessoa-02.png',
  nascimento: '1989-08-15',
  idade: 36,
  sexo: 'Masculino',
  pai: 'Jorge Nascimento',
  mae: 'Cláudia Maria Nascimento',
  naturalidade: 'São Cristóvão - RJ',
  nacionalidade: 'Brasileira',
  estadoCivil: 'Solteiro',
  profissao: 'Não declarada',
  escolaridade: 'Ensino Fundamental Incompleto',
  religiao: 'Não declarada',
  etnia: 'Parda',
  tags: [
    { rotulo: 'CV', categoria: 'classificacao-criminal', cor: '#DC2626' },
    { rotulo: 'Comissão', categoria: 'classificacao-criminal', cor: '#B91C1C' },
    { rotulo: 'Prioritário', categoria: 'monitoramento', cor: '#72284B' },
  ],

  statusPrisional: 'Preso Definitivo',
  classificacaoSeguranca: 'Segurança Máxima',
  periculosidade: 'critico',
  crime: 'Homicídio Triplamente Qualificado',
  artigo: 'Art. 121 §2º, I, III, IV — Código Penal',
  regime: 'Fechado',
  unidade: 'Instituto Penal Talavera Bruce',
  pavilhao: 'Pavilhão C',
  galeria: 'Galeria 3',
  cela: 'Cela 17',
  dataUltimaAtualizacao: '2025-01-15',

  faccao: 'CV',
  papelFaccao: 'Comissão',
  monitoramento: {
    monitorado: true,
    alvo: false,
    dataInicio: '2023-06-01',
    setor: 'Subsecretaria de Inteligência',
    criticidade: 'critica',
  },

  prontuarioSipen: 'D92826-2',
  processoDpj: '0005184-36.2027.8.19.09.0071',
  ambiente: 'Instituto Penal Talavera Bruce',
  entradaSistema: '10/04/2028',
  origem: '17ª DP — São Cristóvão',

  historicoPenal: [
    {
      tipo: 'ingresso',
      titulo: 'Prisão',
      descricao: '17ª DP — São Cristóvão',
      data: '2026-08-23',
      status: 'Executado',
    },
    {
      tipo: 'ingresso',
      titulo: 'Condenado',
      descricao: 'Homicídio Triplamente Qualificado — +26 anos — 20/00 a 38 anos',
      data: '2027-02-12',
      status: 'Executado',
    },
    {
      tipo: 'transferencia',
      titulo: 'Transferido',
      descricao: 'Instituto Penal Vicente Piragibe → Talavera Bruce',
      data: '2027-12-02',
    },
    {
      tipo: 'falta',
      titulo: 'Falta Disciplinar Grave',
      descricao: 'Posse de objeto proibido em cela durante revista',
      data: '2028-03-15',
      status: 'Confirmada',
    },
    {
      tipo: 'ingresso',
      titulo: 'Em Operação PEIS',
      descricao: 'Operação Penitenciária Jun/2028',
      data: '2028-06-10',
    },
    {
      tipo: 'elogio',
      titulo: 'Elogio',
      descricao: 'Participação em programa educacional com bom desempenho',
      data: '2028-09-20',
    },
    {
      tipo: 'remicao',
      titulo: 'Remição por Estudo',
      descricao: '45 dias remidos por participação em curso profissionalizante',
      data: '2029-01-10',
      status: 'Deferida',
    },
  ],
  indiceBehavior: [
    {
      dataReferencia: '2028-12-01',
      indice: 'Regular',
      observacao: 'Falta grave registrada no período',
    },
    { dataReferencia: '2029-06-01', indice: 'Bom', observacao: 'Sem ocorrências no semestre' },
  ],
  regalias: [{ data: '2029-03-01', tipo: 'Visita íntima', status: 'Ativa' }],
  beneficios: [
    { data: '2029-01-15', tipo: 'Remição por estudo', status: 'Deferido' },
    { data: '2028-06-01', tipo: 'Progressão de regime', status: 'Indeferido' },
  ],
  remicaoPena: [
    { data: '2029-01-10', criterio: 'Estudo', quantidade: '45 dias', status: 'Deferida' },
    { data: '2028-08-15', criterio: 'Trabalho', quantidade: '30 dias', status: 'Deferida' },
  ],

  calculoPena: {
    dataPrisao: '23/08/2026',
    ingressoSeap: '23/08/2026',
    terminoPena: '15/03/2052',
    totalSentenca: '26 anos',
    tempoCumprido: '8 anos 5 meses',
    tempoACumprir: '17 anos 7 meses',
    diasTrabalhados: '180',
  },
  datasBeneficio: {
    umSexto: '23/12/2030',
    umQuarto: '23/10/2032',
    umTerco: '23/08/2034',
    umMeio: '23/02/2039',
    doisTercos: '23/08/2043',
  },
  processos: [
    {
      numero: '0005184-36.2027.8.19.09.0071',
      vara: '1ª Vara Criminal — São Cristóvão',
      status: 'Transitado em Julgado',
      dataDelito: '20/08/2026',
      sentencas: [
        {
          data: '12/02/2027',
          crime: 'Homicídio Triplamente Qualificado',
          condenacao: 'Condenado',
          pena: '26 anos de reclusão',
        },
      ],
      capitulacao: [
        {
          artigo: 'Art. 121 §2º, I, III, IV — CP',
          descricao:
            'Homicídio qualificado por motivo torpe, meio cruel e recurso que dificultou defesa da vítima',
        },
      ],
    },
    {
      numero: '0012345-78.2028.8.19.01.0001',
      vara: '2ª Vara de Execuções Penais',
      status: 'Em andamento',
      dataDelito: '15/03/2028',
      sentencas: [
        {
          data: '10/06/2028',
          crime: 'Associação para o tráfico',
          condenacao: 'Condenado',
          pena: '5 anos de reclusão',
        },
      ],
      capitulacao: [
        {
          artigo: 'Art. 35 — Lei 11.343/06',
          descricao: 'Associação para fins de tráfico de drogas',
        },
      ],
    },
  ],
  ocorrenciasJuridicas: [
    {
      processo: '0005184-36.2027.8.19.09.0071',
      data: '2027-02-12',
      descricao: 'Sentença condenatória proferida',
      tipo: 'Sentença',
      resultado: 'Condenado',
    },
    {
      processo: '0005184-36.2027.8.19.09.0071',
      data: '2027-08-20',
      descricao: 'Trânsito em julgado',
      tipo: 'Trânsito',
      resultado: 'Definitivo',
    },
  ],
  vep: {
    dataUltimoCalculo: '10/01/2029',
    sentenca: '26 anos reclusão + 5 anos reclusão',
    processo: '0005184-36.2027.8.19.09.0071',
    capitulacao: 'Art. 121 §2º CP + Art. 35 Lei 11.343/06',
  },

  visitantesFamilia: [
    {
      rg: '34.567.890-1',
      nome: 'Fernanda Souza Nascimento',
      fotoUrl: '/images/photos/pessoa-08.png',
      qualificacao: 'Companheira',
      situacaoCarteira: 'Ativa',
      analiseCriminal: 'Sem antecedentes',
      proibido: false,
    },
    {
      rg: '45.678.901-2',
      nome: 'Jorge Nascimento Filho',
      qualificacao: 'Irmão',
      situacaoCarteira: 'Ativa',
      proibido: false,
    },
    {
      rg: '56.789.012-3',
      nome: 'Cláudia Maria Nascimento',
      qualificacao: 'Mãe',
      situacaoCarteira: 'Ativa',
      proibido: false,
    },
    {
      rg: '67.890.123-4',
      nome: 'Ricardo Alves',
      qualificacao: 'Amigo',
      situacaoCarteira: 'Suspensa',
      analiseCriminal: 'Antecedentes por tráfico',
      proibido: true,
    },
  ],
  visitantesReligiosos: [
    { nome: 'Pastor Marcos Oliveira', instituicao: 'Igreja Assembleia de Deus', status: 'Ativo' },
  ],
  agentesConsulares: [],
  visitasIntimas: [
    { data: '2029-01-05', status: 'Realizada' },
    { data: '2028-12-15', status: 'Realizada' },
  ],

  advogados: [
    {
      nome: 'Dr. Ricardo Almeida',
      oab: 'RJ-123456',
      ufSeccional: 'RJ',
      situacao: 'Regular',
      qtdClientes: 4,
      recorrente: true,
    },
    {
      nome: 'Dra. Patrícia Mendes',
      oab: 'RJ-654321',
      ufSeccional: 'RJ',
      situacao: 'Regular',
      qtdClientes: 1,
      recorrente: false,
    },
  ],
  atendimentosJuridicos: [
    { data: '2029-01-08', advogado: 'Dr. Ricardo Almeida', tipo: 'Atendimento presencial' },
    { data: '2028-12-20', advogado: 'Dra. Patrícia Mendes', tipo: 'Petição de benefício' },
    { data: '2028-11-15', advogado: 'Dr. Ricardo Almeida', tipo: 'Atendimento presencial' },
  ],

  fotos: [
    { url: '/images/photos/pessoa-02.png', tipo: 'Frente', data: '2028-04-10' },
    { url: '/images/photos/pessoa-03.png', tipo: 'Perfil', data: '2028-04-10' },
    { url: '/images/photos/pessoa-04.png', tipo: 'Close', data: '2026-08-23' },
  ],
  sinaisCaracteristicos: [
    {
      slot: 'SINAL_1',
      descricao: 'Tatuagem de dragão no braço direito',
      localizacao: 'Braço direito — antebraço',
      url: '/images/photos/pessoa-05.png',
    },
    {
      slot: 'SINAL_2',
      descricao: 'Cicatriz de corte no abdômen lado esquerdo',
      localizacao: 'Abdômen — lateral esquerda',
      url: '/images/photos/pessoa-06.png',
    },
  ],
  documentacaoCivil: [
    { tipo: 'RG', descricao: 'RG emitido pelo DETRAN-RJ' },
    { tipo: 'Certidão de Nascimento', descricao: 'Certidão digitalizada — Cartório 5º Ofício' },
  ],

  movimentacoes: [
    {
      ocorrencia: 'Prisão em flagrante',
      evento: 'Ingresso',
      dataEvento: '2026-08-23',
      unidade: '17ª DP',
      destino: 'SEAP',
      conclusao: 'EXECUTADO',
    },
    {
      ocorrencia: 'Transferência judicial',
      evento: 'Transferência',
      dataEvento: '2026-09-10',
      unidade: 'CDP Bangu',
      destino: 'Inst. Penal Vicente Piragibe',
      conclusao: 'EXECUTADO',
    },
    {
      ocorrencia: 'Transferência por segurança',
      evento: 'Transferência',
      dataEvento: '2027-12-02',
      unidade: 'Vicente Piragibe',
      destino: 'Talavera Bruce',
      conclusao: 'EXECUTADO',
    },
    {
      ocorrencia: 'Apresentação judicial',
      evento: 'Audiência',
      dataEvento: '2028-03-20',
      unidade: 'Talavera Bruce',
      destino: 'Fórum São Cristóvão',
      conclusao: 'EXECUTADO',
    },
    {
      ocorrencia: 'Operação PEIS',
      evento: 'Operação',
      dataEvento: '2028-06-10',
      unidade: 'Talavera Bruce',
      conclusao: 'EXECUTADO',
    },
  ],
  historicoLocalizacao: [
    {
      dataInicio: '2027-12-02',
      unidade: 'Talavera Bruce',
      pavilhao: 'Pavilhão C',
      galeria: 'Galeria 3',
      cela: 'Cela 17',
    },
    {
      dataInicio: '2026-09-10',
      dataFim: '2027-12-01',
      unidade: 'Inst. Penal Vicente Piragibe',
      pavilhao: 'Pavilhão A',
      galeria: 'Galeria 1',
      cela: 'Cela 05',
    },
    {
      dataInicio: '2026-08-23',
      dataFim: '2026-09-09',
      unidade: 'CDP Bangu',
      pavilhao: 'Triagem',
    },
  ],

  contatos: {
    telefones: [
      { numero: '(21) 98765-4321', tipo: 'Celular' },
      { numero: '(21) 3456-7890', tipo: 'Residencial' },
    ],
    emails: [{ endereco: 'contato.familiar@email.com', tipo: 'Pessoal (familiar)' }],
    enderecos: [
      {
        logradouro: 'Rua São Luiz',
        numero: '245',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        cep: '20940-070',
      },
      {
        logradouro: 'Av. Brasil',
        numero: '1200',
        cidade: 'Duque de Caxias',
        estado: 'RJ',
        cep: '25085-000',
      },
    ],
  },
  pessoasRelacionadas: [
    {
      nome: 'Carlos Eduardo Mendes',
      vinculo: 'Associação faccional',
      classificacao: 'Preso monitorado',
    },
    { nome: 'Wagner "Bigode"', vinculo: 'Articulação externa', classificacao: 'Alvo prioritário' },
    {
      nome: 'Luciana Martins',
      vinculo: 'Referência cruzada SNAP',
      classificacao: 'Pessoa relacionada',
    },
  ],
  empresas: [
    {
      razaoSocial: 'MN Transportes Ltda',
      cnpj: '12.345.678/0001-90',
      situacao: 'Baixada',
      cnae: '4930-2/02 — Transporte rodoviário de carga',
      socios: [
        { nome: 'Maurício Nascimento', cpf: '034.567.890-12', qualificacao: 'Sócio-Administrador' },
        { nome: 'Jorge Nascimento', cpf: '012.345.678-90', qualificacao: 'Sócio' },
      ],
    },
  ],
  perfisDigitais: [
    {
      rede: 'Facebook',
      alias: 'mauricio.nascimento.rj',
      url: 'https://facebook.com/mauricio.nascimento.rj',
    },
  ],
  antecedentesCriminais: [
    { descricao: 'Certidão de antecedentes criminais — TJ-RJ', extensao: 'PDF' },
  ],
  mandadosPrisao: [
    {
      numero: 'MP-2026-00456',
      validade: '2031-08-23',
      especie: 'Prisão Definitiva',
      tipificacoes: 'Art. 121 §2º CP — Homicídio Qualificado',
      pena: '26 anos reclusão',
      regime: 'Fechado',
    },
  ],
  processosJudiciais: [
    {
      numero: '0005184-36.2027.8.19.09.0071',
      orgao: 'TJ-RJ',
      instancia: '1ª Instância',
      data: '2027-02-12',
      advogados: [{ nome: 'Dr. Ricardo Almeida', oab: 'RJ-123456' }],
    },
    {
      numero: '0012345-78.2028.8.19.01.0001',
      orgao: 'TJ-RJ',
      instancia: '1ª Instância',
      data: '2028-06-10',
      advogados: [{ nome: 'Dra. Patrícia Mendes', oab: 'RJ-654321' }],
    },
  ],
  diariosOficiais: [
    {
      data: '2027-03-15',
      local: 'Rio de Janeiro',
      descricao: 'Publicação de sentença condenatória — Vara Criminal São Cristóvão',
      link: 'https://diario.tjrj.jus.br/2027/03/15',
    },
  ],
  informacoesEleitorais: { doacoes: [], filiacao: [] },

  ordensServico: [
    {
      numero: 'OS-2028-0145',
      data: '2028-03-16',
      tipo: 'Investigação',
      finalidade: 'Apuração de posse de objeto proibido',
      situacao: 'Concluída',
    },
    {
      numero: 'OS-2028-0312',
      data: '2028-06-11',
      tipo: 'Operação',
      finalidade: 'Operação PEIS — varredura',
      situacao: 'Concluída',
    },
  ],
  registroOcorrencias: [
    {
      data: '2028-03-15',
      descricao: 'Objeto proibido encontrado em revista de cela',
      responsavel: 'Insp. Eduardo Brasileiro',
      setor: 'Segurança',
    },
    {
      data: '2028-06-10',
      descricao: 'Participação em operação PEIS — sem intercorrências',
      responsavel: 'Insp. Eduardo Brasileiro',
      setor: 'Segurança',
    },
  ],

  atividadesLaborativas: [
    {
      dataInicio: '2028-07-01',
      descricao: 'Auxiliar de limpeza — áreas comuns',
      programa: 'Programa de Trabalho Interno',
      status: 'Ativa',
    },
  ],
  atividadesEducacionais: [
    {
      dataInicio: '2028-09-01',
      dataFim: '2029-01-10',
      curso: 'Curso Profissionalizante — Eletricista Básico',
      status: 'Concluído',
    },
    { dataInicio: '2029-02-01', curso: 'Ensino Fundamental — EJA', status: 'Em andamento' },
  ],

  alertaContextual: 'Transferência em negociação: Penal Dr. Serrano Nepomuceno — PEIS',

  perfis: [{ tipo: 'preso', ativo: true, dataInicio: '2026-08-23', detalhes: { regime: 'Fechado', unidade: 'Instituto Penal Talavera Bruce' } }],
};
