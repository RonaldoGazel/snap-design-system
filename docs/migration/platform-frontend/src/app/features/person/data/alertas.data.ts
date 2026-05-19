import { Alerta } from '../models';

export const MOCK_ALERTAS: Alerta[] = [
  {
    id: 'alerta-1',
    tipo: 'alteracao-periculosidade',
    severidade: 'critica',
    descricao:
      'Periculosidade de Carlos Eduardo Mendes reclassificada de alta para máxima após incidente disciplinar na unidade.',
    dataGeracao: '2025-01-10T14:32:00',
    lido: false,
    pessoaId: 'p1',
    fonte: 'sipen',
  },
  {
    id: 'alerta-2',
    tipo: 'nova-visita-relevante',
    severidade: 'alta',
    descricao:
      'Ana Beatriz Souza realizou visita simultânea a dois internos monitorados na mesma unidade em intervalo de 48h.',
    dataGeracao: '2025-01-08T09:15:00',
    lido: false,
    pessoaId: 'p3',
    fonte: 'sipen',
  },
  {
    id: 'alerta-3',
    tipo: 'divergencia-entre-fontes',
    severidade: 'media',
    descricao:
      'Nome da mãe de Roberto Carlos Nascimento diverge entre SIPEN ("Maria das Graças Nascimento") e SNAP ("Maria da Graça Nascimento Santos").',
    dataGeracao: '2025-01-05T11:48:00',
    lido: true,
    pessoaId: 'p8',
    fonte: 'snap',
  },
  {
    id: 'alerta-4',
    tipo: 'novo-vinculo-sensivel',
    severidade: 'alta',
    descricao:
      'Novo vínculo identificado entre Wagner "Bigode" e líder faccional preso em unidade de segurança máxima.',
    dataGeracao: '2025-01-12T16:05:00',
    lido: false,
    pessoaId: 'p6',
    fonte: 'manual',
  },
  {
    id: 'alerta-5',
    tipo: 'nova-citacao-documental',
    severidade: 'media',
    descricao:
      'Tenente Paulo Ferreira citado em relatório de inteligência sobre movimentação irregular na Unidade Prisional Bangu III.',
    dataGeracao: '2025-01-03T08:22:00',
    lido: true,
    pessoaId: 'p5',
    fonte: 'snap',
  },
  {
    id: 'alerta-6',
    tipo: 'novo-dado-snap',
    severidade: 'media',
    descricao:
      'Enriquecimento SNAP retornou novo endereço e contato telefônico para Marcos Vinícius da Silva.',
    dataGeracao: '2025-01-07T10:30:00',
    lido: false,
    pessoaId: 'p2',
    fonte: 'snap',
  },
  {
    id: 'alerta-7',
    tipo: 'mudanca-unidade',
    severidade: 'alta',
    descricao:
      'Roberto Carlos Nascimento transferido da Penitenciária Bangu I para unidade de triagem por decisão judicial.',
    dataGeracao: '2025-01-06T15:45:00',
    lido: false,
    pessoaId: 'p8',
    fonte: 'sipen',
  },
  {
    id: 'alerta-8',
    tipo: 'novo-vinculo-sensivel',
    severidade: 'critica',
    descricao:
      'Luciana Martins identificada em nova referência cruzada com rede faccional via interceptação telefônica.',
    dataGeracao: '2025-01-09T20:10:00',
    lido: false,
    pessoaId: 'p7',
    fonte: 'snap',
  },
];
