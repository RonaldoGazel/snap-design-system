import { Pessoa } from '../models';

export const MOCK_PESSOAS: Pessoa[] = [
  // Pessoa 1 — Carlos Eduardo Mendes (preso monitorado, alto risco, facção)
  {
    id: 'p1',
    nome: 'Carla Eduarda Mentes',
    vulgos: ['Carlota'],
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    matricula: 'SIPEN-2019-004521',
    dataNascimento: '1985-03-12',
    sexo: 'Masculino',
    fotoUrl: '/images/photos/pessoa-01.png',
    pai: 'José Eduardo Mendes',
    mae: 'Sônia Maria Mendes',
    naturalidade: 'Rio de Janeiro - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'preso',
        ativo: true,
        dataInicio: '2019-08-15',
        detalhes: {
          regime: 'Fechado',
          unidade: 'Unidade Prisional Bangu III',
          artigoCondenacao: 'Art. 33 c/c Art. 35 — Lei 11.343/06',
        },
      },
    ],
    fontes: [
      { tipo: 'sipen', prioridade: 1, dataConsulta: '2025-01-10', status: 'ativa' },
      { tipo: 'snap', prioridade: 2, dataConsulta: '2025-01-08', status: 'ativa' },
    ],
    resumoAnalitico:
      'Preso de alta periculosidade com vínculo faccional confirmado. Monitorado desde 2023 por inteligência. Recebe visitas de ex-companheiro de cela e familiar com perfil sensível. Advogado constituído atua em múltiplos presos da mesma facção.',
    statusReconciliacao: 'sem-divergencia',
    indicadoresAnaliticos: {
      nivelRisco: 'critico',
      relevancia: 95,
      periculosidade: 'Máxima',
      qtdAlertas: 3,
      qtdVinculos: 5,
      qtdDocumentosCitantes: 7,
    },
    monitoramento: {
      monitorado: true,
      alvo: false,
      dataInicioMonitoramento: '2023-04-01',
      setorResponsavel: 'Subsecretaria de Inteligência',
      criticidade: 'critica',
    },
    situacaoPrisionalAtual: {
      unidade: 'Unidade Prisional Bangu III',
      regime: 'Fechado',
      status: 'Custodiado',
      dataUltimaAtualizacao: '2025-01-10',
    },
    tagsRelevantes: [
      {
        id: 'tag-1',
        rotulo: 'CV',
        categoria: 'classificacao-criminal',
        cor: '#DC2626',
        dataAplicacao: '2024-01-15',
      },
      {
        id: 'tag-2',
        rotulo: 'Comissão',
        categoria: 'classificacao-criminal',
        cor: '#B91C1C',
        dataAplicacao: '2024-02-10',
      },
      {
        id: 'tag-3',
        rotulo: 'Influente',
        categoria: 'monitoramento',
        cor: '#72284B',
        dataAplicacao: '2024-03-01',
      },
    ],
  },

  // Pessoa 2 — Marcos Vinícius da Silva (ex-preso + visitante, multipapel)
  {
    id: 'p2',
    nome: 'Marcos Vinícius da Silva',
    vulgos: ['Marquinhos'],
    cpf: '987.654.321-00',
    rg: '98.765.432-1',
    dataNascimento: '1990-07-25',
    sexo: 'Masculino',
    pai: 'Antônio Carlos da Silva',
    mae: 'Regina Célia da Silva',
    naturalidade: 'São Gonçalo - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'ex-preso',
        ativo: true,
        dataInicio: '2018-02-10',
        dataFim: '2022-06-30',
        detalhes: {
          regime: 'Semiaberto',
          unidadeOrigem: 'Unidade Prisional Bangu III',
          motivoSaida: 'Progressão de regime e alvará de soltura',
        },
      },
      {
        tipo: 'visitante',
        ativo: true,
        dataInicio: '2022-09-15',
        detalhes: {
          internoVisitado: 'Carlos Eduardo Mendes',
          frequencia: 'Quinzenal',
          unidadeVisita: 'Unidade Prisional Bangu III',
        },
      },
    ],
    fontes: [
      { tipo: 'sipen', prioridade: 1, dataConsulta: '2025-01-06', status: 'ativa' },
      { tipo: 'snap', prioridade: 2, dataConsulta: '2025-01-04', status: 'ativa' },
    ],
    resumoAnalitico:
      'Ex-preso com passagem por Bangu III que mantém vínculo ativo como visitante de interno monitorado. Perfil multipapel relevante para análise de rede relacional do custodiado.',
    statusReconciliacao: 'sem-divergencia',
    indicadoresAnaliticos: {
      nivelRisco: 'alto',
      relevancia: 72,
      qtdAlertas: 1,
      qtdVinculos: 2,
      qtdDocumentosCitantes: 3,
    },
    monitoramento: {
      monitorado: false,
      alvo: false,
    },
    tagsRelevantes: [
      {
        id: 'tag-5',
        rotulo: 'Visita sensível',
        categoria: 'sinal-analitico',
        cor: '#F59E0B',
        dataAplicacao: '2024-05-12',
      },
      {
        id: 'tag-7',
        rotulo: 'Vínculo recorrente',
        categoria: 'sinal-analitico',
        cor: '#8B5CF6',
        dataAplicacao: '2024-07-08',
      },
    ],
  },

  // Pessoa 3 — Ana Beatriz Souza (visitante + familiar, multipapel)
  {
    id: 'p3',
    nome: 'Ana Beatriz Souza',
    vulgos: [],
    cpf: '456.789.123-00',
    rg: '45.678.912-3',
    dataNascimento: '1992-11-03',
    sexo: 'Feminino',
    pai: 'Jorge Luís Souza',
    mae: 'Cláudia Regina Souza',
    naturalidade: 'Duque de Caxias - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'visitante',
        ativo: true,
        dataInicio: '2020-03-10',
        detalhes: {
          internoVisitado: 'Carlos Eduardo Mendes',
          frequencia: 'Semanal',
          unidadeVisita: 'Unidade Prisional Bangu III',
        },
      },
      {
        tipo: 'familiar',
        ativo: true,
        dataInicio: '2019-08-15',
        detalhes: {
          grauParentesco: 'Companheira',
          internoRelacionado: 'Carlos Eduardo Mendes',
        },
      },
    ],
    fontes: [{ tipo: 'sipen', prioridade: 1, dataConsulta: '2025-01-08', status: 'ativa' }],
    resumoAnalitico:
      'Visitante ativa de dois internos monitorados e companheira de preso de alta periculosidade. Padrão de visitas simultâneas em intervalo curto levantou alerta analítico.',
    statusReconciliacao: 'sem-divergencia',
    indicadoresAnaliticos: {
      nivelRisco: 'medio',
      relevancia: 60,
      qtdAlertas: 1,
      qtdVinculos: 1,
      qtdDocumentosCitantes: 2,
    },
    monitoramento: {
      monitorado: false,
      alvo: false,
    },
    tagsRelevantes: [
      {
        id: 'tag-5',
        rotulo: 'Visita sensível',
        categoria: 'sinal-analitico',
        cor: '#F59E0B',
        dataAplicacao: '2024-05-12',
      },
    ],
  },

  // Pessoa 4 — Dr. Ricardo Almeida (advogado)
  {
    id: 'p4',
    nome: 'Dr. Ricardo Almeida',
    vulgos: [],
    cpf: '321.654.987-00',
    rg: '32.165.498-7',
    dataNascimento: '1975-05-18',
    sexo: 'Masculino',
    pai: 'Fernando Almeida',
    mae: 'Teresa Cristina Almeida',
    naturalidade: 'Niterói - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'advogado',
        ativo: true,
        dataInicio: '2021-01-20',
        detalhes: {
          oab: 'RJ-123456',
          atuacao: 'Criminal — Execução Penal',
          qtdClientesAtivos: 4,
        },
      },
    ],
    fontes: [
      { tipo: 'sipen', prioridade: 1, dataConsulta: '2025-01-07', status: 'ativa' },
      { tipo: 'snap', prioridade: 2, dataConsulta: '2025-01-05', status: 'ativa' },
    ],
    resumoAnalitico:
      'Advogado com atuação recorrente em presos da mesma facção na Unidade Prisional Bangu III. Padrão de representação concentrada levanta sinal analítico sobre possível articulação jurídica coordenada.',
    statusReconciliacao: 'sem-divergencia',
    indicadoresAnaliticos: {
      nivelRisco: 'medio',
      relevancia: 55,
      qtdAlertas: 0,
      qtdVinculos: 1,
      qtdDocumentosCitantes: 4,
    },
    monitoramento: {
      monitorado: false,
      alvo: false,
    },
    tagsRelevantes: [
      {
        id: 'tag-7',
        rotulo: 'Vínculo recorrente',
        categoria: 'sinal-analitico',
        cor: '#8B5CF6',
        dataAplicacao: '2024-07-08',
      },
    ],
  },

  // Pessoa 5 — Tenente Paulo Ferreira (servidor)
  {
    id: 'p5',
    nome: 'Tenente Paulo Ferreira',
    vulgos: [],
    cpf: '654.321.987-00',
    rg: '65.432.198-7',
    dataNascimento: '1980-09-22',
    sexo: 'Masculino',
    pai: 'Sebastião Ferreira',
    mae: 'Marlene de Souza Ferreira',
    naturalidade: 'Rio de Janeiro - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'servidor',
        ativo: true,
        dataInicio: '2010-03-01',
        detalhes: {
          cargo: 'Inspetor Penitenciário',
          lotacao: 'Unidade Prisional Bangu III',
          matriculaFuncional: 'SEAP-2010-00892',
        },
      },
    ],
    fontes: [
      { tipo: 'sipen', prioridade: 1, dataConsulta: '2025-01-03', status: 'ativa' },
      { tipo: 'snap', prioridade: 2, dataConsulta: '2025-01-02', status: 'ativa' },
    ],
    resumoAnalitico:
      'Servidor lotado em unidade sensível e citado em relatório de inteligência sobre movimentação irregular. Presença em documento analítico requer acompanhamento.',
    statusReconciliacao: 'sem-divergencia',
    indicadoresAnaliticos: {
      nivelRisco: 'medio',
      relevancia: 50,
      qtdAlertas: 1,
      qtdVinculos: 1,
      qtdDocumentosCitantes: 2,
    },
    monitoramento: {
      monitorado: false,
      alvo: false,
    },
    tagsRelevantes: [
      {
        id: 'tag-8',
        rotulo: 'Em revisão',
        categoria: 'status-operacional',
        cor: '#697E89',
        dataAplicacao: '2024-08-14',
      },
    ],
  },

  // Pessoa 6 — Wagner "Bigode" (alvo + pessoa-relacionada, identidade incompleta)
  {
    id: 'p6',
    nome: 'Wagner Almeida Sobrinho',
    nomeSocial: 'Wagner "Bigode"',
    vulgos: ['Bigode'],
    // Sem CPF, sem RG — identidade incompleta
    dataNascimento: '1978-12-05',
    sexo: 'Masculino',
    fotoUrl: '/images/photos/pessoa-05.png',
    naturalidade: 'Baixada Fluminense - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'alvo',
        ativo: true,
        dataInicio: '2024-06-01',
        detalhes: {
          motivoMarcacao: 'Associação faccional e articulação externa',
          criticidade: 'Alta',
        },
      },
      {
        tipo: 'pessoa-relacionada',
        ativo: true,
        dataInicio: '2024-03-15',
        detalhes: {
          origemVinculo: 'Relatório de inteligência e interceptação',
          pessoaRelacionada: 'Carlos Eduardo Mendes',
        },
      },
    ],
    fontes: [
      { tipo: 'manual', prioridade: 3, dataConsulta: '2025-01-12', status: 'ativa' },
      { tipo: 'snap', prioridade: 2, dataConsulta: '2025-01-10', status: 'ativa' },
    ],
    resumoAnalitico:
      'Alvo prioritário com identidade incompleta. Conhecido apenas pelo vulgo "Bigode". Sem CPF ou RG confirmados. Vínculo faccional com preso monitorado em Bangu III identificado por inteligência.',
    statusReconciliacao: 'sem-divergencia',
    indicadoresAnaliticos: {
      nivelRisco: 'alto',
      relevancia: 85,
      qtdAlertas: 1,
      qtdVinculos: 2,
      qtdDocumentosCitantes: 3,
    },
    monitoramento: {
      monitorado: true,
      alvo: true,
      dataInicioMonitoramento: '2024-06-01',
      setorResponsavel: 'Subsecretaria de Inteligência',
      criticidade: 'alta',
    },
    tagsRelevantes: [
      {
        id: 'tag-4',
        rotulo: 'PCC',
        categoria: 'classificacao-criminal',
        cor: '#DC2626',
        dataAplicacao: '2024-04-05',
      },
      {
        id: 'tag-1b',
        rotulo: 'Liderança',
        categoria: 'classificacao-criminal',
        cor: '#B91C1C',
        dataAplicacao: '2024-01-15',
      },
      {
        id: 'tag-9',
        rotulo: 'Pena Máxima',
        categoria: 'monitoramento',
        dataAplicacao: '2024-06-01',
      },
    ],
  },

  // Pessoa 7 — Luciana Martins (pessoa-relacionada)
  {
    id: 'p7',
    nome: 'Luciana Martins',
    vulgos: [],
    cpf: '789.123.456-00',
    rg: '78.912.345-6',
    dataNascimento: '1988-04-17',
    sexo: 'Feminino',
    pai: 'Roberto Martins',
    mae: 'Sandra Helena Martins',
    naturalidade: 'Nova Iguaçu - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'pessoa-relacionada',
        ativo: true,
        dataInicio: '2024-08-20',
        detalhes: {
          origemVinculo: 'Enriquecimento SNAP — múltiplas referências cruzadas',
          pessoasRelacionadas: 'Wagner "Bigode", Carlos Eduardo Mendes',
        },
      },
    ],
    fontes: [{ tipo: 'snap', prioridade: 2, dataConsulta: '2025-01-11', status: 'ativa' }],
    resumoAnalitico:
      'Pessoa relacionada com múltiplos vínculos a alvos monitorados. Identificada via enriquecimento SNAP com referências cruzadas a Wagner "Bigode" e rede faccional.',
    statusReconciliacao: 'sem-divergencia',
    indicadoresAnaliticos: {
      nivelRisco: 'medio',
      relevancia: 45,
      qtdAlertas: 0,
      qtdVinculos: 1,
      qtdDocumentosCitantes: 1,
    },
    monitoramento: {
      monitorado: false,
      alvo: false,
    },
    tagsRelevantes: [
      {
        id: 'tag-7',
        rotulo: 'Vínculo recorrente',
        categoria: 'sinal-analitico',
        cor: '#8B5CF6',
        dataAplicacao: '2024-07-08',
      },
    ],
  },

  // Pessoa 8 — Roberto Carlos Nascimento (preso, divergência SIPEN vs SNAP)
  {
    id: 'p8',
    nome: 'Roberto Carlos Nascimento',
    vulgos: ['Betinho'],
    cpf: '111.222.333-44',
    rg: '11.222.333-4',
    matricula: 'SIPEN-2020-007834',
    dataNascimento: '1982-01-30',
    sexo: 'Masculino',
    pai: 'Carlos Alberto Nascimento',
    mae: 'Maria das Graças Nascimento',
    naturalidade: 'Belford Roxo - RJ',
    nacionalidade: 'Brasileira',
    perfis: [
      {
        tipo: 'preso',
        ativo: true,
        dataInicio: '2020-05-12',
        detalhes: {
          regime: 'Fechado',
          unidade: 'Penitenciária Laércio da Costa Pellegrino (Bangu I)',
          artigoCondenacao: 'Art. 157 §2º — Código Penal',
        },
      },
    ],
    fontes: [
      { tipo: 'sipen', prioridade: 1, dataConsulta: '2025-01-05', status: 'divergente' },
      { tipo: 'snap', prioridade: 2, dataConsulta: '2025-01-04', status: 'divergente' },
    ],
    resumoAnalitico:
      'Preso com divergência identificada entre SIPEN e SNAP no nome da mãe. SIPEN registra "Maria das Graças Nascimento"; SNAP retorna "Maria da Graça Nascimento Santos". Divergência mantida como sinal analítico para revisão.',
    statusReconciliacao: 'divergencia-mantida-como-sinal',
    indicadoresAnaliticos: {
      nivelRisco: 'medio',
      relevancia: 40,
      qtdAlertas: 1,
      qtdVinculos: 0,
      qtdDocumentosCitantes: 1,
    },
    monitoramento: {
      monitorado: false,
      alvo: false,
    },
    situacaoPrisionalAtual: {
      unidade: 'Penitenciária Laércio da Costa Pellegrino (Bangu I)',
      regime: 'Fechado',
      status: 'Custodiado',
      dataUltimaAtualizacao: '2025-01-05',
    },
    tagsRelevantes: [
      {
        id: 'tag-6',
        rotulo: 'Divergência de identidade',
        categoria: 'sinal-analitico',
        cor: '#3B82F6',
        dataAplicacao: '2024-06-20',
      },
      {
        id: 'tag-8',
        rotulo: 'Em revisão',
        categoria: 'status-operacional',
        cor: '#697E89',
        dataAplicacao: '2024-08-14',
      },
    ],
  },
];
