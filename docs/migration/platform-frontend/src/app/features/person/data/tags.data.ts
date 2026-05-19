import { Tag } from '../models';

export const MOCK_TAGS: Tag[] = [
  {
    id: 'tag-1',
    rotulo: 'Facção',
    categoria: 'classificacao-criminal',
    cor: '#DC2626',
    dataAplicacao: '2024-01-15',
  },
  {
    id: 'tag-2',
    rotulo: 'Liderança',
    categoria: 'classificacao-criminal',
    cor: '#B91C1C',
    dataAplicacao: '2024-02-10',
  },
  {
    id: 'tag-3',
    rotulo: 'Monitorado',
    categoria: 'monitoramento',
    cor: '#72284B',
    dataAplicacao: '2024-03-01',
  },
  {
    id: 'tag-4',
    rotulo: 'Alvo prioritário',
    categoria: 'monitoramento',
    cor: '#9B4D72',
    dataAplicacao: '2024-04-05',
  },
  {
    id: 'tag-5',
    rotulo: 'Visita sensível',
    categoria: 'sinal-analitico',
    cor: '#F59E0B',
    dataAplicacao: '2024-05-12',
  },
  {
    id: 'tag-6',
    rotulo: 'Divergência de identidade',
    categoria: 'sinal-analitico',
    cor: '#3B82F6',
    dataAplicacao: '2024-06-20',
  },
  {
    id: 'tag-7',
    rotulo: 'Vínculo recorrente',
    categoria: 'sinal-analitico',
    cor: '#8B5CF6',
    dataAplicacao: '2024-07-08',
  },
  {
    id: 'tag-8',
    rotulo: 'Em revisão',
    categoria: 'status-operacional',
    cor: '#697E89',
    dataAplicacao: '2024-08-14',
  },
];
