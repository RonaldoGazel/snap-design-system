import { ProcessDistribution, ProcessDocType } from './enums';

export interface TemplateOption {
  key: string;
  abbreviation: string;
  fullName: string;
}

export const DISTRIBUTION_DOCTYPE_MAP: Record<ProcessDistribution, ProcessDocType[]> = {
  [ProcessDistribution.EXTERNO]: [
    ProcessDocType.RELATORIO,
    ProcessDocType.PEDIDO,
    ProcessDocType.ENCAMINHAMENTO,
    ProcessDocType.MENSAGEM,
    ProcessDocType.OFICIO,
  ],
  [ProcessDistribution.INTERNO]: [
    ProcessDocType.RELATORIO,
    ProcessDocType.PEDIDO,
    ProcessDocType.ORDEM,
    ProcessDocType.INFORME,
    ProcessDocType.FORMULARIO,
    ProcessDocType.CORRESPONDENCIA,
    ProcessDocType.DENUNCIA,
  ],
  [ProcessDistribution.INTERNO_EXTERNO]: [
    ProcessDocType.RELATORIO,
    ProcessDocType.SUMARIO,
  ],
};

export const DOCTYPE_TEMPLATE_MAP: Record<string, TemplateOption[]> = {
  'EXTERNO:RELATORIO': [
    { key: 'RELINT', abbreviation: 'RELINT', fullName: 'Relatório de Inteligência' },
    { key: 'RT', abbreviation: 'RT', fullName: 'Relatório Técnico' },
    { key: 'RQS', abbreviation: 'RQS', fullName: 'Relatório de Quebra de Sigilo' },
  ],
  'EXTERNO:PEDIDO': [
    { key: 'PB', abbreviation: 'PB', fullName: 'Pedido de Busca' },
  ],
  'EXTERNO:ENCAMINHAMENTO': [
    { key: 'ENCA', abbreviation: 'ENCA', fullName: 'Encaminhamento' },
  ],
  'EXTERNO:MENSAGEM': [
    { key: 'MSG', abbreviation: 'MSG', fullName: 'Mensagem' },
  ],
  'EXTERNO:OFICIO': [
    { key: 'OFICIO', abbreviation: 'Ofício', fullName: 'Ofício' },
    { key: 'OFIJUS', abbreviation: 'OFIJUS', fullName: 'Ofício Judicial' },
  ],
  'INTERNO:RELATORIO': [
    { key: 'REI', abbreviation: 'REI', fullName: 'Relatório Especial de Inteligência' },
    { key: 'RB', abbreviation: 'RB', fullName: 'Relatório de Busca' },
    { key: 'RBE', abbreviation: 'RBE', fullName: 'Relatório de Busca Eletrônica' },
    { key: 'RIC', abbreviation: 'RIC', fullName: 'Relatório de Inteligência Cibernética' },
  ],
  'INTERNO:PEDIDO': [
    { key: 'PBI', abbreviation: 'PBI', fullName: 'Pedido de Busca Interno' },
    { key: 'PBE', abbreviation: 'PBE', fullName: 'Pedido de Busca Eletrônica' },
  ],
  'INTERNO:ORDEM': [
    { key: 'OB', abbreviation: 'OB', fullName: 'Ordem de Busca' },
    { key: 'OBE', abbreviation: 'OBE', fullName: 'Ordem de Busca Eletrônica' },
  ],
  'INTERNO:INFORME': [
    { key: 'INFIN', abbreviation: 'INFIN', fullName: 'Informe Interno' },
  ],
  'INTERNO:FORMULARIO': [
    { key: 'FIA', abbreviation: 'FIA', fullName: 'Formulário de Ingresso de Aparelho' },
  ],
  'INTERNO:CORRESPONDENCIA': [
    { key: 'CI', abbreviation: 'CI', fullName: 'Correspondência Interna' },
  ],
  'INTERNO:DENUNCIA': [
    { key: 'DI', abbreviation: 'DI', fullName: 'Denúncia Interna' },
  ],
  'INTERNO_EXTERNO:RELATORIO': [
    { key: 'RPI', abbreviation: 'RPI', fullName: 'Relatório Periódico de Inteligência' },
  ],
  'INTERNO_EXTERNO:SUMARIO': [
    { key: 'SUMINFO', abbreviation: 'SUMINFO', fullName: 'Sumário de Informações' },
  ],
};

export const DISTRIBUTION_LABEL_MAP: Record<ProcessDistribution, string> = {
  [ProcessDistribution.INTERNO]: 'Interno',
  [ProcessDistribution.EXTERNO]: 'Externo',
  [ProcessDistribution.INTERNO_EXTERNO]: 'Interno/Externo',
};

export const DOCTYPE_LABEL_MAP: Record<ProcessDocType, string> = {
  [ProcessDocType.RELATORIO]: 'Relatório',
  [ProcessDocType.PEDIDO]: 'Pedido',
  [ProcessDocType.ENCAMINHAMENTO]: 'Encaminhamento',
  [ProcessDocType.MENSAGEM]: 'Mensagem',
  [ProcessDocType.OFICIO]: 'Ofício',
  [ProcessDocType.ORDEM]: 'Ordem',
  [ProcessDocType.INFORME]: 'Informe',
  [ProcessDocType.FORMULARIO]: 'Formulário',
  [ProcessDocType.CORRESPONDENCIA]: 'Correspondência',
  [ProcessDocType.DENUNCIA]: 'Denúncia',
  [ProcessDocType.SUMARIO]: 'Sumário',
};
