import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, DecimalPipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { map, switchMap, catchError, tap } from 'rxjs';
import { of } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import * as L from 'leaflet';
import { PersonServiceClient } from '../../../snap/services/person-service-client';
import { mapApiResponseToPersonRecord } from './profile-mapper';
import { environment } from '../../../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';

// ── Interfaces ───────────────────────────────────────────────

interface PersonTag {
  t: string;
  tone: 'pillar' | 'danger' | 'neutral' | 'faction';
}

interface Situation {
  status: string;
  unidade: string;
  localAtual: string;
  regime: string;
  risco: string;
  entradaSistema: string;
  ultimaAtualizacao: string;
}

interface CriticalAlert {
  kind: string;
  severity: string;
  time: string;
  title: string;
  body: string;
  actions: string[];
}

interface LastUpdateAlert {
  text: string;
  href: string;
}

interface AiSummary {
  paragraphs: string[];
  sources: string[];
}

interface SourceConflict {
  otherSource: string;
  otherValue: string;
}

interface SourcedField {
  label: string;
  value: string;
  source: string;
  conflict?: SourceConflict;
}

interface PersonPhoto {
  label: string;
  url: string;
  date: string;
}

interface PersonMark {
  type: string;
  area: string;
  desc: string;
}

interface Phone {
  n: string;
  kind: string;
  op: string;
  source: string;
  updated: string;
}

interface Email {
  e: string;
  kind: string;
  source: string;
  updated: string;
}

interface Contacts {
  phones: Phone[];
  emails: Email[];
}

interface Address {
  line: string;
  label: string;
  source: string;
  updated: string;
  conflict?: SourceConflict;
  lat?: number;
  lng?: number;
}

interface SourceInfo {
  sources: string[];
  lastSyncSipen: string;
  lastSyncSnap: string;
  conflicts: number;
  confidence: string;
}

interface PersonDocument {
  type: string;
  title: string;
  number: string;
  origin: string;
  date: string;
  status: string;
  excerpt: string;
}

interface CustodyTimelineEvent {
  date: string;
  label: string;
  unit: string;
  kind: 'arrest' | 'sentence' | 'transfer' | 'incident' | 'operation' | 'hearing';
  status: string;
}

interface Transfer {
  date: string;
  route: string;
  reason: string;
  status: string;
}

interface LocationHistory {
  from: string;
  to: string;
  unit: string;
  detail: string;
  current?: boolean;
}

interface Incident {
  date: string;
  type: string;
  unit: string;
  status: string;
  desc: string;
}

interface LaborActivity {
  role: string;
  program: string;
  since: string;
  status: string;
}

interface EducationActivity {
  course: string;
  period: string;
  status: string;
}

interface Remission {
  kind: string;
  days: number;
  since: string;
  ratio: number;
  status: string;
}

interface MapLocation {
  unit: string;
  address: string;
}

interface Custody {
  timeline: CustodyTimelineEvent[];
  transfers: Transfer[];
  locationHistory: LocationHistory[];
  incidents: Incident[];
  activities: {
    labor: LaborActivity[];
    education: EducationActivity[];
  };
  remissions: Remission[];
  mapLocation: MapLocation;
}

interface PenaSummary {
  dataPrisao: string;
  ingressoSeap: string;
  terminoPena: string;
  totalSentenca: { years: number; months: number };
  tempoCumprido: { years: number; months: number };
  tempoACumprir: { years: number; months: number };
  diasTrabalhados: number;
  percentCumprido: number;
}

interface BenefitMark {
  mark: string;
  date: string;
}

interface LegalProcess {
  number: string;
  court: string;
  status: string;
  crimes: string;
  filed: string;
  source: string;
}

interface Warrant {
  n: string;
  validity: string;
  kind: string;
  regime: string;
  pena: string;
  typifications: string;
  status: string;
  issuer?: string;
}

interface CrimeTypification {
  code: string;
  label: string;
}

interface Legal {
  penaSummary: PenaSummary;
  benefits: BenefitMark[];
  processes: LegalProcess[];
  warrants: Warrant[];
  crimes: CrimeTypification[];
}

interface SocialProfile {
  net: string;
  icon: 'facebook' | 'twitter' | 'linkedin' | 'instagram';
  alias: string;
  url: string;
  id: string | null;
}

interface Gazette {
  kind: string;
  place: string;
  origin: string;
  date: string;
  detail: string;
}

interface ElectoralParty {
  name: string;
  uf: string;
  registration: string;
  status: string;
  kind: string;
}

interface Candidacy {
  year: number;
  type?: string;
  unit: string;
  turno?: string;
  role: string;
  number: number;
  party: string;
}

interface ElectoralTie {
  kind: string;
  role: string;
  value: string;
  date: string;
  desc: string;
}

interface Servant {
  entity: string;
  body: string;
  matricula: string;
  tenure: string;
  source: string;
}

interface Expense {
  entity: string;
  source?: string;
  date: string;
  creditor: string;
  ref: string;
  fund?: string;
  classification: string;
  value: string;
}

interface PublicLife {
  profiles: SocialProfile[];
  gazettes: Gazette[];
  electoral: {
    party: ElectoralParty;
    candidacies: Candidacy[];
    ties: ElectoralTie[];
  };
  transparency: {
    servants: Servant[];
    expenses: Expense[];
  };
}

interface RelationItem {
  id: string;
  name: string;
  alias: string | null;
  type: 'pessoa' | 'empresa';
  role: string;
  status: string;
  confirmed: boolean;
  faction?: string;
  kind?: 'familiar' | 'advogado' | 'visitante';
  photo: string | null;
}

interface Relations {
  items: RelationItem[];
  graphTotal: number;
}

interface PersonRecord {
  id: string;
  photo: string;
  name: string;
  aliases: string[];
  cpf: string;
  rg: string;
  matriculaSipen: string;
  tags: PersonTag[];
  situation: Situation;
  monitoring: string[];
  criticalAlert: CriticalAlert;
  lastUpdateAlert: LastUpdateAlert;
  aiSummary: AiSummary;
  identification: SourcedField[];
  biography: SourcedField[];
  sipenCodes: SourcedField[];
  photos: PersonPhoto[];
  photosTotal: number;
  marks: PersonMark[];
  contacts: Contacts;
  addresses: Address[];
  sourceInfo: SourceInfo;
  documents: PersonDocument[];
  custody: Custody;
  legal: Legal;
  publicLife: PublicLife;
  relations: Relations;
}

type RelFilterKey = 'all' | 'faction' | 'familiar' | 'advogado' | 'empresa';

// ── Helper ───────────────────────────────────────────────────

const photo = (n: number): string => `images/photos/pessoa-${String(n).padStart(2, '0')}.png`;

// ── Static Data ──────────────────────────────────────────────

const PERSON_RECORD_DATA: PersonRecord = {
  id: 'p-003',
  photo: photo(3),
  name: 'Maurício Fonseca Nascimento',
  aliases: ['Mauricinho', 'Maurição', 'Maurinho', 'MN'],
  cpf: '034.567.890-12',
  rg: '23.456.789-0',
  matriculaSipen: 'SIPEN-2018-003412',

  tags: [
    { t: 'Monitorado', tone: 'pillar' },
    { t: 'Alto risco', tone: 'danger' },
    { t: 'CV', tone: 'faction' },
    { t: 'Custodiado', tone: 'neutral' },
  ],

  situation: {
    status: 'Custodiado',
    unidade: 'Instituto Penal Talavera Bruce',
    localAtual: 'Pavilhão C · Galeria 3 · Cela 17',
    regime: 'Fechado',
    risco: 'Alto',
    entradaSistema: '10/04/2023',
    ultimaAtualizacao: '14/01/2025',
  },

  monitoring: ['Telefonia ativa', 'Visitas monitoradas'],

  criticalAlert: {
    kind: 'transfer-negotiation',
    severity: 'critical',
    time: 'Há 2h · 14/01/2025 17:45',
    title: 'Transferência em negociação — Penal Dr. Serrano Nepomuceno (PBS)',
    body: 'Ordem de transferência em análise pela Superintendência. Aguardando parecer jurídico e logística operacional. Inteligência recomenda acompanhamento.',
    actions: ['Ver documento origem', 'Ver histórico de transferências'],
  },

  lastUpdateAlert: {
    text: 'Novo documento relacionado nas últimas 24h',
    href: '#tab-documents',
  },

  aiSummary: {
    paragraphs: [
      'Maurício Fonseca Nascimento, conhecido como "Mauricinho", encontra-se custodiado no Instituto Penal Talavera Bruce desde 10/04/2023, sob regime fechado, com condenações por homicídio triplamente qualificado e associação para o tráfico. Apresenta vínculo faccional confirmado com o Comando Vermelho (CV) e indícios de atuação em comissão interna do pavilhão.',
      'Documentos recentes indicam movimentação atípica de comunicações externas em vistoria, presença em operação penitenciária (PEIS jun/2028) e um processo de transferência em negociação para a unidade Serrano Nepomuceno. A consolidação combina dados do SIPEN, SNAP, relatórios de inteligência (RELINT) e fontes públicas, com conflitos pendentes em escolaridade e filiação partidária.',
      'Análise de vínculos revela conexões com ao menos quatro integrantes do CV no mesmo pavilhão, incluindo participação em comissão interna. Registros de visitas indicam padrão regular com familiares diretos (companheira e irmão), sem indícios de irregularidades nas comunicações monitoradas durante visitas sociais.',
      'Histórico empresarial aponta vínculos societários com três empresas, sendo duas com situação cadastral "Baixada" e uma ativa com contratos públicos registrados. Dados eleitorais indicam filiação partidária ao MDB-RJ desde 2010 e uma candidatura a vereador em 2020. Fontes de transparência pública revelam passagem por cargo comissionado na Secretaria Municipal de Obras entre 2023 e 2024.',
    ],
    sources: ['SIPEN', 'SNAP', 'RELINT', 'BNMP'],
  },

  identification: [
    { label: 'Nome completo', value: 'Maurício Fonseca Nascimento', source: 'SNAP+SIPEN' },
    { label: 'CPF', value: '034.567.890-12', source: 'SNAP' },
    { label: 'RG', value: '23.456.789-0', source: 'SIPEN' },
    { label: 'Sexo', value: 'Masculino', source: 'SIPEN' },
    { label: 'Data de nascimento', value: '14/08/1989 (35 anos)', source: 'SNAP' },
    { label: 'Nacionalidade', value: 'Brasileira', source: 'SNAP' },
    { label: 'Naturalidade', value: 'São Cristóvão · RJ', source: 'SNAP' },
    { label: 'Estado civil', value: 'Solteiro', source: 'SIPEN' },
    { label: 'Etnia', value: 'Parda', source: 'SIPEN' },
    { label: 'Religião', value: 'Não declarada', source: 'SIPEN' },
  ],

  biography: [
    { label: 'Mãe', value: 'Cláudia Maria Nascimento', source: 'SNAP' },
    { label: 'Pai', value: 'Jorge Nascimento', source: 'SNAP' },
    {
      label: 'Escolaridade',
      value: 'Ensino fundamental incompleto',
      source: 'SIPEN',
      conflict: { otherSource: 'SNAP', otherValue: 'Ensino fundamental completo' },
    },
    { label: 'Profissão declarada', value: 'Auxiliar de serviços gerais', source: 'SIPEN' },
  ],

  sipenCodes: [
    { label: 'Prontuário SIPEN', value: 'D92826-2', source: 'SIPEN' },
    { label: 'Processo DPJ', value: '0005184-36.2027.8.19.09.0071', source: 'SIPEN' },
    { label: 'Ambiente', value: 'Instituto Penal Talavera Bruce', source: 'SIPEN' },
    { label: 'Entrada no sistema', value: '10/04/2028', source: 'SIPEN' },
    { label: 'Origem', value: '17º DP — São Cristóvão', source: 'SIPEN' },
    { label: 'PIC', value: 'PIC-RJ-00341', source: 'SIPEN' },
  ],

  photos: [
    { label: 'Frente', url: photo(3), date: '09/04/2028' },
    { label: 'Perfil E', url: photo(3), date: '09/04/2028' },
    { label: 'Perfil D', url: photo(3), date: '09/04/2028' },
    { label: 'Tórax', url: photo(3), date: '22/08/2028' },
    { label: 'Costas', url: photo(3), date: '22/08/2028' },
    { label: 'Braço D', url: photo(3), date: '15/09/2028' },
    { label: 'Braço E', url: photo(3), date: '15/09/2028' },
    { label: 'Mão D', url: photo(3), date: '15/09/2028' },
    { label: 'Mão E', url: photo(3), date: '15/09/2028' },
    { label: 'Perna D', url: photo(3), date: '03/11/2028' },
    { label: 'Perna E', url: photo(3), date: '03/11/2028' },
    { label: 'Rosto 2', url: photo(3), date: '03/11/2028' },
  ],
  photosTotal: 12,

  marks: [
    { type: 'Tatuagem', area: 'Braço direito', desc: 'Tatuagem de dragão no antebraço' },
    {
      type: 'Cicatriz',
      area: 'Abdômen lateral esq.',
      desc: 'Cicatriz de corte no abdômen — ~8 cm',
    },
    { type: 'Tatuagem', area: 'Peitoral', desc: 'Caveira com asas — centralizada' },
    { type: 'Tatuagem', area: 'Costas', desc: 'Inscrição "Família" — lombar' },
  ],

  contacts: {
    phones: [
      { n: '(21) 98765-4321', kind: 'Celular', op: 'Claro', source: 'SNAP', updated: '28/03/2026' },
      {
        n: '(21) 3456-7890',
        kind: 'Residencial',
        op: 'Fixo',
        source: 'SNAP',
        updated: '25/03/2026',
      },
      { n: '(21) 98871-4532', kind: 'Celular', op: 'Vivo', source: 'SIPEN', updated: '10/02/2026' },
      {
        n: '(21) 3344-8821',
        kind: 'Residencial',
        op: 'Fixo',
        source: 'SIPEN',
        updated: '10/02/2026',
      },
    ],
    emails: [
      {
        e: 'contato.familiar@email.com',
        kind: 'Pessoal (familiar)',
        source: 'SNAP',
        updated: '27/03/2026',
      },
      {
        e: 'carlos.fonseca@email.com',
        kind: 'Pessoal · Gmail',
        source: 'SNAP',
        updated: '12/01/2026',
      },
      {
        e: 'cfonseca@corretora.com.br',
        kind: 'Profissional',
        source: 'SIPEN',
        updated: '08/11/2025',
      },
    ],
  },

  addresses: [
    {
      line: 'Rua São Luiz, 245 — Rio de Janeiro/RJ — 20940-070',
      label: 'Residencial',
      source: 'SNAP',
      updated: '17/03/2026',
      lat: -22.9068,
      lng: -43.1729,
    },
    {
      line: 'Av. Brasil, 1200 — Duque de Caxias/RJ — 25085-000',
      label: 'Familiar',
      source: 'SNAP',
      updated: '23/03/2026',
      conflict: { otherSource: 'SIPEN', otherValue: 'Av. Brasil, 1300' },
      lat: -22.7856,
      lng: -43.3117,
    },
    {
      line: 'Rua das Acácias, 412 — Rio de Janeiro/RJ — 22041-001',
      label: 'Antigo',
      source: 'RELINT',
      updated: '26/03/2026',
      lat: -22.9835,
      lng: -43.2096,
    },
    {
      line: 'Av. Brasil, 1800 — Niterói/RJ — 24020-002',
      label: 'Comercial',
      source: 'SNAP',
      updated: '26/03/2026',
      lat: -22.8833,
      lng: -43.1036,
    },
  ],

  sourceInfo: {
    sources: ['SIPEN', 'SNAP', 'RELINT', 'BNMP', 'Transparência', 'Querido Diário'],
    lastSyncSipen: '28/03/2026 09:12',
    lastSyncSnap: '27/03/2026 21:43',
    conflicts: 2,
    confidence: 'Alta',
  },

  documents: [
    {
      type: 'RELINT',
      title: 'Movimentação de liderança faccional em Duque de Caxias',
      number: 'REL-2026-00412',
      origin: 'Superintendência de Inteligência',
      date: '28/03/2026',
      status: 'Vínculo',
      excerpt:
        '...vínculo com MAURÍCIO FONSECA NASCIMENTO ("Mauricinho"), apontado como integrante da comissão interna do pavilhão C...',
    },
    {
      type: 'PB',
      title: 'Solicitação de verificação de contato externo',
      number: 'PB-2026-00118',
      origin: 'Superintendência de Inteligência',
      date: '27/03/2026',
      status: 'Citação',
      excerpt:
        'Solicita verificação do número (21) 98765-4321 associado ao custodiado Maurício F. Nascimento.',
    },
    {
      type: 'RB',
      title: 'Resultado de busca — Transportes Nova Era Ltda.',
      number: 'RB-2026-00097',
      origin: 'Ações Especializadas',
      date: '26/03/2026',
      status: 'Vínculo',
      excerpt:
        'Empresa com sócio-administrador identificado como Maurício Nascimento, situação cadastral "Baixada" desde 03/2025.',
    },
    {
      type: 'SUMINFO',
      title: 'Sumário sobre núcleo familiar e visitas monitoradas',
      number: 'SUM-2026-00055',
      origin: 'NUCINTGER',
      date: '25/03/2026',
      status: 'Vínculo',
      excerpt:
        'Maurício recebe visitas regulares da companheira Fernanda Souza e do irmão Jorge Nascimento Filho; padrão compatível com rotina familiar.',
    },
    {
      type: 'Ofício',
      title: 'Encaminhamento de informação à agência externa',
      number: 'OF-2026-00310',
      origin: 'Protocolo · SS1',
      date: '24/03/2026',
      status: 'Citação',
      excerpt: 'Encaminha-se relatório preliminar para apreciação do juízo competente.',
    },
    {
      type: 'OB',
      title: 'Ordem de busca — revista em cela 17',
      number: 'OB-2026-00082',
      origin: 'Ações Especializadas',
      date: '22/03/2026',
      status: 'Vínculo',
      excerpt: 'Ordem executada em 22/03 — apreensão de chip e aparelho celular não autorizado.',
    },
    {
      type: 'MSG',
      title: 'Mensagem monitorada em visita social',
      number: 'MSG-2026-00219',
      origin: 'Monitoramento',
      date: '20/03/2026',
      status: 'Citação',
      excerpt: 'Referência indireta a "Mauri" durante conversa monitorada na visita social do dia.',
    },
    {
      type: 'REI',
      title: 'Relatório de Inteligência — Comissão pavilhão C',
      number: 'REI-2026-00044',
      origin: 'NUCINTGER',
      date: '15/03/2026',
      status: 'Vínculo',
      excerpt:
        'Maurício Fonseca aparece como um dos nomes indicados para coordenação de atividades no pavilhão C.',
    },
  ],

  custody: {
    timeline: [
      {
        date: '2023-04-10',
        label: 'Prisão',
        unit: '17º DP · São Cristóvão',
        kind: 'arrest',
        status: 'Executado',
      },
      {
        date: '2024-03-11',
        label: 'Condenado',
        unit: 'Homicídio Qualificado · 26 anos',
        kind: 'sentence',
        status: 'Executado',
      },
      {
        date: '2025-11-03',
        label: 'Transferência',
        unit: 'Pinheiro → Talavera Bruce',
        kind: 'transfer',
        status: 'Executado',
      },
      {
        date: '2026-03-14',
        label: 'Falta Disciplinar',
        unit: 'Objeto proibido em revista',
        kind: 'incident',
        status: 'Confirmada',
      },
      {
        date: '2026-06-09',
        label: 'Operação PEIS',
        unit: 'Talavera Bruce · jun/2028',
        kind: 'operation',
        status: 'Executado',
      },
      {
        date: '2027-02-22',
        label: 'Audiência',
        unit: 'Talavera Bruce → Fórum SC',
        kind: 'hearing',
        status: 'Executado',
      },
    ],
    transfers: [
      {
        date: '22/08/2025',
        route: '17º DP → SEAP',
        reason: 'Ingresso · Prisão em flagrante',
        status: 'Executado',
      },
      {
        date: '09/08/2026',
        route: 'CDP Bangu → Inst. Penal V. Piragibe',
        reason: 'Transferência judicial',
        status: 'Executado',
      },
      {
        date: '01/12/2027',
        route: 'V. Piragibe → Talavera Bruce',
        reason: 'Transferência por segurança',
        status: 'Executado',
      },
      {
        date: '19/03/2028',
        route: 'Talavera Bruce → Fórum São Cristóvão',
        reason: 'Apresentação judicial',
        status: 'Executado',
      },
      {
        date: '09/06/2028',
        route: 'Talavera Bruce · Operação PEIS',
        reason: 'Operação penitenciária',
        status: 'Executado',
      },
    ],
    locationHistory: [
      {
        from: '01/12/2027',
        to: 'Atual',
        unit: 'Talavera Bruce',
        detail: 'Pavilhão C · Galeria 3 · Cela 17',
        current: true,
      },
      {
        from: '09/08/2026',
        to: '30/11/2027',
        unit: 'Inst. V. Piragibe',
        detail: 'Pavilhão A · Galeria 1 · Cela 05',
      },
      { from: '22/08/2025', to: '08/08/2026', unit: 'CDP Bangu', detail: 'Triagem' },
    ],
    incidents: [
      {
        date: '14/03/2026',
        type: 'Objeto proibido',
        unit: 'Insp. Eduardo Brasileiro · Segurança',
        status: 'Confirmada',
        desc: 'Objeto proibido encontrado em revista de cela',
      },
      {
        date: '09/06/2026',
        type: 'Op. PEIS',
        unit: 'Insp. Eduardo Brasileiro · Segurança',
        status: 'Sem intercorrências',
        desc: 'Participação em operação PEIS — sem intercorrências',
      },
    ],
    activities: {
      labor: [
        {
          role: 'Auxiliar de limpeza · áreas comuns',
          program: 'Programa de Trabalho Interno',
          since: '30/07/2025',
          status: 'Ativa',
        },
      ],
      education: [
        {
          course: 'Curso Profissionalizante — Eletricista Básico',
          period: '31/08/2028 → 06/01/2029',
          status: 'Concluído',
        },
        {
          course: 'Ensino Fundamental — EJA',
          period: '31/01/2029 → Atual',
          status: 'Em andamento',
        },
      ],
    },
    remissions: [
      { kind: 'Estudo', days: 45, since: '06/01/2029', ratio: 0.75, status: 'Deferida' },
      { kind: 'Trabalho', days: 30, since: '14/08/2028', ratio: 0.5, status: 'Deferida' },
    ],
    mapLocation: {
      unit: 'Instituto Penal Talavera Bruce',
      address: 'Estrada Guandu do Sena, s/n — Bangu — Rio de Janeiro/RJ',
    },
  },

  legal: {
    penaSummary: {
      dataPrisao: '23/08/2026',
      ingressoSeap: '23/08/2026',
      terminoPena: '15/03/2052',
      totalSentenca: { years: 26, months: 0 },
      tempoCumprido: { years: 8, months: 5 },
      tempoACumprir: { years: 17, months: 7 },
      diasTrabalhados: 180,
      percentCumprido: 32,
    },
    benefits: [
      { mark: '1/6', date: '23/12/2030' },
      { mark: '1/4', date: '23/10/2032' },
      { mark: '1/3', date: '23/08/2034' },
      { mark: '1/2', date: '23/02/2039' },
      { mark: '2/3', date: '23/06/2043' },
    ],
    processes: [
      {
        number: '0005184-36.2027.8.19.09.0071',
        court: '1ª Vara Criminal — São Cristóvão',
        status: 'Transitado em Julgado',
        crimes: 'Homicídio Triplamente Qualificado · 26 anos de reclusão',
        filed: '12/02/2027',
        source: 'SIPEN',
      },
      {
        number: '0012345-70.2028.8.19.01.0001',
        court: '2ª Vara de Execuções Penais',
        status: 'Em andamento',
        crimes: 'Associação para o tráfico · 5 anos de reclusão',
        filed: '15/03/2028',
        source: 'SIPEN',
      },
      {
        number: '0012345-67.2021.8.19.0001',
        court: 'TJRJ · 3ª Vara Criminal',
        status: 'Transitado em Julgado',
        crimes: 'Estelionato · 2 anos',
        filed: '10/03/2021',
        source: 'ESCAVADOR',
      },
      {
        number: '0098765-43.2022.8.19.0001',
        court: '5ª Vara de Execuções Penais',
        status: 'Sentenciado',
        crimes: 'Art. 171 CP — Estelionato',
        filed: '22/06/2022',
        source: 'SEEU',
      },
    ],
    warrants: [
      {
        n: 'MP-2026-00456',
        validity: '2031-08-23',
        kind: 'Prisão Definitiva',
        regime: 'Fechado',
        pena: '26 anos reclusão',
        typifications: 'Art. 121 §2º CP — Homicídio Qualificado',
        status: 'Ativo',
      },
      {
        n: 'BNMP-2024-00071',
        validity: '31/12/2025',
        kind: 'Preventiva',
        regime: 'Fechado',
        pena: '4 anos e 6 meses',
        typifications: 'Art. 171 CP · Art. 288 CP — Associação Criminosa',
        status: 'Ativo',
        issuer: 'TJRJ · 3ª Vara Criminal',
      },
    ],
    crimes: [
      { code: 'Art. 121 §2º CP', label: 'Homicídio Triplamente Qualificado' },
      { code: 'Art. 33 Lei 11.343/06', label: 'Tráfico de drogas' },
      { code: 'Art. 35 Lei 11.343/06', label: 'Associação para o tráfico' },
      { code: 'Lei 12.850/13', label: 'Organização criminosa' },
    ],
  },

  publicLife: {
    profiles: [
      {
        net: 'Facebook',
        icon: 'facebook',
        alias: 'mauricio.nascimento.rj',
        url: 'https://facebook.com/mauricio.nascimento.rj',
        id: null,
      },
      {
        net: 'Twitter',
        icon: 'twitter',
        alias: '@carlosedfonseca',
        url: 'https://twitter.com/carlosedfonseca',
        id: '1234567890',
      },
      {
        net: 'LinkedIn',
        icon: 'linkedin',
        alias: 'Maurício Nascimento',
        url: 'https://linkedin.com/in/mauricio-nascimento-rj',
        id: 'mauricio-nascimento-rj',
      },
      {
        net: 'Instagram',
        icon: 'instagram',
        alias: '@mauri.nas',
        url: 'https://instagram.com/mauri.nas',
        id: null,
      },
    ],
    gazettes: [
      {
        kind: 'Sentença condenatória',
        place: 'Rio de Janeiro',
        origin: 'ESCAVADOR',
        date: '2027-03-15',
        detail: 'Vara Criminal São Cristóvão',
      },
      {
        kind: 'Nomeação — cargo comissionado',
        place: 'Rio de Janeiro',
        origin: 'ESCAVADOR',
        date: '2023-11-07',
        detail: 'Secretaria Municipal de Obras',
      },
      {
        kind: 'Contrato de serviços',
        place: 'Rio de Janeiro',
        origin: 'ESCAVADOR',
        date: '2022-04-15',
        detail: 'Fonseca & Mendes Construções Ltda',
      },
      {
        kind: 'Designação comissão',
        place: 'Rio de Janeiro/RJ',
        origin: 'QUERIDO DIÁRIO',
        date: '2023-08-12',
        detail: 'Designado para comissão de licitação',
      },
    ],
    electoral: {
      party: {
        name: 'MDB',
        uf: 'RJ',
        registration: '12/03/2010',
        status: 'Regular',
        kind: 'Filiado',
      },
      candidacies: [
        {
          year: 2020,
          type: 'Municipal',
          unit: 'Rio de Janeiro/RJ',
          turno: '1º Turno',
          role: 'Vereador',
          number: 15123,
          party: 'MDB',
        },
      ],
      ties: [
        {
          kind: 'Doação',
          role: 'Doador',
          value: 'R$ 5.000,00',
          date: '15/08/2022',
          desc: 'Doação a candidato a deputado estadual',
        },
      ],
    },
    transparency: {
      servants: [
        {
          entity: 'Prefeitura Municipal do Rio de Janeiro',
          body: 'Secretaria Municipal de Obras',
          matricula: 'RJ-2023-00871',
          tenure: '1 ano e 4 meses',
          source: 'TRANSP-RJ',
        },
      ],
      expenses: [
        {
          entity: 'Secretaria Municipal de Obras',
          source: 'TRANSP-RJ',
          date: '10/09/2023',
          creditor: 'Fonseca & Mendes Construções Ltda',
          ref: '2023NE004521',
          fund: 'Tesouro Municipal',
          classification: 'Obras e Instalações',
          value: 'R$ 842.120,00',
        },
      ],
    },
  },

  relations: {
    items: [
      {
        id: 'r-01',
        name: 'Carlos Eduardo Mendes',
        alias: null,
        type: 'pessoa',
        role: 'Associação faccional',
        status: 'Preso monitorado',
        confirmed: true,
        faction: 'CV',
        photo: photo(7),
      },
      {
        id: 'r-02',
        name: 'Wagner Almeida Sobrinho',
        alias: 'Bigode',
        type: 'pessoa',
        role: 'Articulação externa',
        status: 'Alvo prioritário',
        confirmed: true,
        faction: 'CV',
        photo: photo(2),
      },
      {
        id: 'r-03',
        name: 'Fábio Henrique Rocha',
        alias: 'Fabinho',
        type: 'pessoa',
        role: 'Núcleo de apoio',
        status: 'Preso',
        confirmed: true,
        faction: 'CV',
        photo: photo(5),
      },
      {
        id: 'r-04',
        name: 'João Carlos P. R. de Albuquerque',
        alias: 'Joãozinho',
        type: 'pessoa',
        role: 'Comissão CV pavilhão C',
        status: 'Preso monitorado',
        confirmed: true,
        faction: 'CV',
        photo: photo(4),
      },
      {
        id: 'r-05',
        name: 'Cláudia Maria Nascimento',
        alias: null,
        type: 'pessoa',
        role: 'Mãe',
        status: 'Confirmado',
        confirmed: true,
        kind: 'familiar',
        photo: photo(8),
      },
      {
        id: 'r-06',
        name: 'Jorge Nascimento',
        alias: null,
        type: 'pessoa',
        role: 'Pai',
        status: 'Confirmado',
        confirmed: true,
        kind: 'familiar',
        photo: photo(6),
      },
      {
        id: 'r-07',
        name: 'Jorge Nascimento Filho',
        alias: null,
        type: 'pessoa',
        role: 'Irmão',
        status: 'Confirmado',
        confirmed: true,
        kind: 'familiar',
        photo: photo(6),
      },
      {
        id: 'r-08',
        name: 'Fernanda Souza Nascimento',
        alias: null,
        type: 'pessoa',
        role: 'Companheira',
        status: 'Confirmado',
        confirmed: true,
        kind: 'familiar',
        photo: photo(1),
      },
      {
        id: 'r-09',
        name: 'Dr. Ricardo Almeida',
        alias: 'OAB RJ-123456',
        type: 'pessoa',
        role: 'Advogado · 4 clientes na unidade',
        status: 'Recorrente',
        confirmed: true,
        kind: 'advogado',
        photo: null,
      },
      {
        id: 'r-10',
        name: 'Dra. Patrícia Mendes',
        alias: 'OAB RJ-654321',
        type: 'pessoa',
        role: 'Advogada · 1 cliente',
        status: 'Confirmado',
        confirmed: true,
        kind: 'advogado',
        photo: null,
      },
      {
        id: 'r-11',
        name: 'Pastor Marcos Oliveira',
        alias: null,
        type: 'pessoa',
        role: 'Visita religiosa · Assembleia de Deus',
        status: 'Confirmado',
        confirmed: true,
        kind: 'visitante',
        photo: null,
      },
      {
        id: 'r-12',
        name: 'Luciana Martins',
        alias: null,
        type: 'pessoa',
        role: 'Referência cruzada SNAP',
        status: 'Histórico',
        confirmed: false,
        kind: 'visitante',
        photo: photo(5),
      },
      {
        id: 'r-13',
        name: 'MN Transportes Ltda',
        alias: 'CNPJ 12.345.678/0001-90',
        type: 'empresa',
        role: 'Sócio-Administrador',
        status: 'Baixada',
        confirmed: true,
        photo: null,
      },
      {
        id: 'r-14',
        name: 'CEF Empreendimentos ME',
        alias: 'CNPJ 98.765.432/0001-11',
        type: 'empresa',
        role: 'Titular',
        status: 'Baixada',
        confirmed: true,
        photo: null,
      },
      {
        id: 'r-15',
        name: 'Transportes Nova Era Ltda',
        alias: 'CNPJ 77.123.456/0001-45',
        type: 'empresa',
        role: 'Vínculo societário',
        status: 'Histórico',
        confirmed: false,
        photo: null,
      },
      {
        id: 'r-16',
        name: 'Fonseca & Mendes Construções',
        alias: 'CNPJ 55.111.222/0001-33',
        type: 'empresa',
        role: 'Contrato público',
        status: 'Ativa',
        confirmed: true,
        photo: null,
      },
    ],
    graphTotal: 23,
  },
};

// ── Component ────────────────────────────────────────────────

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  imports: [
    CommonModule,
    DecimalPipe,
    TagModule,
    ButtonModule,
    AvatarModule,
    TooltipModule,
    TranslateModule,
  ],
  host: {
    '[class.pr-hide-sources]': '!showSources()',
  },
})
export class ProfileComponent implements AfterViewInit, OnDestroy {
  // ── Injections ──
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly personClient = inject(PersonServiceClient);
  private readonly useMocks = environment.useMocks;

  // ── Build-time flags ──
  /** True only in production builds — gates the Graph CTA */
  protected readonly isProduction = environment.production;

  // ── Permission signals ──
  /** Always true in standalone mode — graph viewer is available to all authenticated users */
  protected readonly hasGraphPermission = computed(() => true);

  // ── Section IDs for scroll-spy ──
  readonly sectionIds = [
    'sec-ai',
    'sec-id',
    'sec-sipen',
    'sec-aliases',
    'sec-photos',
    'sec-marks',
    'sec-contacts',
    'sec-addr',
    'sec-source',
  ];

  // ── Data signals ──
  readonly isLoading = signal<boolean>(true);
  readonly errorSignal = signal<string | null>(null);
  readonly httpStatus = signal<number | null>(null);
  readonly person = signal<PersonRecord>(PERSON_RECORD_DATA);

  // ── Route param signal ──
  readonly personId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  // ── Data loading pipeline ──
  private readonly personFromApi = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('id') ?? ''),
      tap(() => {
        this.isLoading.set(true);
        this.errorSignal.set(null);
        this.httpStatus.set(null);
      }),
      switchMap((id) =>
        id
          ? this.personClient.getPersonById(id).pipe(
              map((data) => mapApiResponseToPersonRecord(data)),
              tap(() => this.isLoading.set(false)),
              catchError((err: HttpErrorResponse | Error) => {
                const status = err instanceof HttpErrorResponse ? err.status : 0;

                if (status === 404) {
                  this.httpStatus.set(404);
                  this.isLoading.set(false);
                  return of(null);
                }

                if (status === 403) {
                  this.httpStatus.set(403);
                  this.isLoading.set(false);
                  return of(null);
                }

                if (this.useMocks) {
                  this.isLoading.set(false);
                  return of(
                    PERSON_RECORD_DATA as unknown as ReturnType<
                      typeof mapApiResponseToPersonRecord
                    >,
                  );
                }

                this.errorSignal.set(err.message || 'Failed to load person data');
                this.isLoading.set(false);
                return of(null);
              }),
            )
          : of(null).pipe(tap(() => this.isLoading.set(false))),
      ),
    ),
    { initialValue: null },
  );

  // ── Sync personFromApi → person signal ──
  private readonly personSyncEffect = effect(() => {
    const val = this.personFromApi();
    if (val !== null) {
      this.person.set(val as unknown as PersonRecord);
    }
  });

  // ── UI State (signals) ──
  readonly activeTab = signal<number>(0);
  readonly drawerOpen = signal<boolean>(false);
  readonly drawerItem = signal<RelationItem | null>(null);
  readonly showSources = signal<boolean>(true);
  readonly relSearch = signal<string>('');
  readonly relFilter = signal<RelFilterKey>('all');
  readonly activeAnchor = signal<string>('sec-ai');
  readonly expandedDocIndex = signal<number>(0);
  readonly photoTooltipVisible = signal<boolean>(false);
  readonly photoTooltipX = signal<number>(0);
  readonly photoTooltipY = signal<number>(0);
  readonly aiExpanded = signal<boolean>(false);
  readonly photosExpanded = signal<boolean>(false);
  readonly lightboxOpen = signal<boolean>(false);
  readonly lightboxIndex = signal<number>(0);

  // ── Computed ──
  readonly toggleSourcesLabel = computed(() =>
    this.showSources() ? 'Ocultar fontes' : 'Mostrar fontes',
  );

  readonly visiblePhotos = computed(() =>
    this.photosExpanded() ? this.person().photos : this.person().photos.slice(0, 5),
  );

  readonly hiddenPhotosCount = computed(() => this.person().photos.length - 5);

  readonly filteredRelations = computed(() => {
    const items = this.person().relations.items;
    const search = this.relSearch().toLowerCase();
    const filter = this.relFilter();

    return items.filter((item) => {
      // Search filter
      if (search) {
        const haystack = `${item.name} ${item.alias ?? ''} ${item.role}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      // Category filter
      if (filter === 'all') return true;
      if (filter === 'faction') return !!item.faction;
      if (filter === 'empresa') return item.type === 'empresa';
      return item.kind === filter;
    });
  });

  readonly groupedRelations = computed(() => {
    const items = this.filteredRelations();
    const groups: { key: string; label: string; icon: string; items: RelationItem[] }[] = [
      { key: 'faction', label: 'Mesma facção (CV)', icon: 'pi-shield', items: [] },
      { key: 'familiar', label: 'Familiares', icon: 'pi-users', items: [] },
      { key: 'advogado', label: 'Advogados', icon: 'pi-balance-scale', items: [] },
      { key: 'visitante', label: 'Visitantes', icon: 'pi-user-plus', items: [] },
      { key: 'empresa', label: 'Empresas e sociedades', icon: 'pi-building', items: [] },
    ];

    for (const item of items) {
      if (item.faction) {
        groups[0].items.push(item);
      } else if (item.type === 'empresa') {
        groups[4].items.push(item);
      } else if (item.kind === 'familiar') {
        groups[1].items.push(item);
      } else if (item.kind === 'advogado') {
        groups[2].items.push(item);
      } else if (item.kind === 'visitante') {
        groups[3].items.push(item);
      }
    }

    return groups.filter((g) => g.items.length > 0);
  });

  // ── IntersectionObserver ──
  private scrollObserver: IntersectionObserver | null = null;

  // ── Leaflet map ──
  readonly addrMapRef = viewChild<ElementRef<HTMLDivElement>>('addrMap');
  private addrMap: L.Map | null = null;
  private readonly ngZone = inject(NgZone);

  private readonly addrMapEffect = effect(() => {
    const ref = this.addrMapRef();
    if (ref) {
      // Use setTimeout to ensure the container has stable layout dimensions.
      // queueMicrotask fires before the browser paints, so the container
      // may still report 0×0 — causing broken tiles and missing markers.
      setTimeout(() => this.initAddrMap(ref.nativeElement), 150);
    } else {
      this.destroyAddrMap();
    }
  });

  // ── Lightbox focus ──
  readonly lightboxEl = viewChild<ElementRef<HTMLDivElement>>('lightboxEl');

  private readonly lightboxFocusEffect = effect(() => {
    const el = this.lightboxEl();
    if (el) {
      queueMicrotask(() => el.nativeElement.focus());
    }
  });

  // ── Lifecycle ──

  ngAfterViewInit(): void {
    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    this.scrollObserver?.disconnect();
    this.destroyAddrMap();
  }

  // ── Methods ──

  selectTab(index: number): void {
    this.activeTab.set(index);
    if (index === 0) {
      setTimeout(() => this.setupScrollSpy(), 50);
    }
  }

  toggleSources(): void {
    this.showSources.update((v) => !v);
  }

  toggleDoc(index: number): void {
    this.expandedDocIndex.set(this.expandedDocIndex() === index ? -1 : index);
  }

  openDrawer(item: RelationItem): void {
    this.drawerItem.set(item);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onRelSearch(event: Event): void {
    this.relSearch.set((event.target as HTMLInputElement).value);
  }

  setRelFilter(key: RelFilterKey): void {
    this.relFilter.set(key);
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      this.activeAnchor.set(sectionId);
      // Scroll within .pr-overview (the scroll container for tab 0 content)
      const overview = document.querySelector('.pr-overview') as HTMLElement | null;
      if (overview) {
        const elTop =
          el.getBoundingClientRect().top +
          overview.scrollTop -
          overview.getBoundingClientRect().top;
        overview.scrollTo({ top: elTop, behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  goToPhotos(): void {
    if (this.activeTab() !== 0) {
      this.activeTab.set(0);
      // Wait for the tab content to render before scrolling
      setTimeout(() => this.scrollToSection('sec-photos'), 100);
    } else {
      this.scrollToSection('sec-photos');
    }
  }

  onPhotoMouseMove(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.photoTooltipX.set(event.clientX - rect.left + 12);
    this.photoTooltipY.set(event.clientY - rect.top + 12);
  }

  toggleAiExpanded(): void {
    this.aiExpanded.update((v) => !v);
  }

  togglePhotos(): void {
    this.photosExpanded.update((v) => !v);
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  lightboxPrev(): void {
    const total = this.person().photos.length;
    this.lightboxIndex.update((i) => (i - 1 + total) % total);
  }

  lightboxNext(): void {
    const total = this.person().photos.length;
    this.lightboxIndex.update((i) => (i + 1) % total);
  }

  onLightboxKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closeLightbox();
    else if (event.key === 'ArrowLeft') this.lightboxPrev();
    else if (event.key === 'ArrowRight') this.lightboxNext();
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length < 2) return parts[0]?.[0]?.toUpperCase() ?? '';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  voltar(): void {
    this.location.back();
  }

  protected openGraph(): void {
    const id = this.personId();
    if (id) {
      this.router.navigate(['/intelligence/person', id, 'graph']);
    }
  }

  // ── Private ──

  private setupScrollSpy(): void {
    this.scrollObserver?.disconnect();

    const sections = this.sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    // .pr-center is the scroll container — use it as the IntersectionObserver root
    const root = document.querySelector('.pr-center') as HTMLElement | null;

    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeAnchor.set(entry.target.id);
          }
        }
      },
      { root, rootMargin: '-60px 0px -70% 0px', threshold: 0 },
    );

    sections.forEach((s) => this.scrollObserver!.observe(s));
  }

  // ── Address Map ──

  private initAddrMap(container: HTMLDivElement): void {
    this.destroyAddrMap();

    // Guard: container must have layout dimensions
    if (!container.offsetWidth || !container.offsetHeight) return;

    const addresses = this.person().addresses.filter(
      (a): a is Address & { lat: number; lng: number } => a.lat != null && a.lng != null,
    );
    if (addresses.length === 0) return;

    // Run Leaflet outside Angular zone to avoid unnecessary change detection on map events
    this.ngZone.runOutsideAngular(() => {
      const map = L.map(container, {
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom SVG marker using pillar color
      const markerSvg = (color: string) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"
                fill="${color}" stroke="#fff" stroke-width="1.5"/>
          <circle cx="14" cy="13" r="5.5" fill="#fff"/>
        </svg>`;

      const pillarColor =
        getComputedStyle(document.documentElement).getPropertyValue('--snap-pillar-color').trim() ||
        '#72284b';

      const icon = L.divIcon({
        html: markerSvg(pillarColor),
        className: 'pr-addr-marker',
        iconSize: [28, 40],
        iconAnchor: [14, 40],
        tooltipAnchor: [14, -20],
      });

      const bounds = L.latLngBounds([]);

      for (const addr of addresses) {
        // Split address into parts: "Logradouro, Nº — Cidade/UF — CEP"
        const parts = addr.line.split(' — ');
        const street = parts[0] || addr.line;
        const cityUf = parts[1] || '';
        const cep = parts[2] || '';
        const tooltipHtml = `<span class="pr-addr-tooltip__type">${addr.label}</span>${street}<br>${cityUf}${cep ? ' — ' + cep : ''}`;

        const marker = L.marker([addr.lat, addr.lng], { icon }).addTo(map);
        marker.bindTooltip(tooltipHtml, { direction: 'right', className: 'pr-addr-tooltip' });
        bounds.extend([addr.lat, addr.lng]);
      }

      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });

      // Force Leaflet to recalculate container size and reload tiles.
      // This fixes tile gaps caused by the container not being fully laid out
      // at the moment L.map() reads its dimensions.
      setTimeout(() => map.invalidateSize(), 0);

      this.addrMap = map;
    });
  }

  private destroyAddrMap(): void {
    if (this.addrMap) {
      this.addrMap.remove();
      this.addrMap = null;
    }
  }
}
