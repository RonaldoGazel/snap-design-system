import { UnifiedPerson } from '../models/unified-person.model';

/**
 * UNIFIED_PERSON_MOCK — Maurício Nascimento
 * Merged SIPEN + SNAP data. Identity from SIPEN (MOCK_PRESO_VISAO).
 */
export const UNIFIED_PERSON_MOCK: UnifiedPerson = {
  id: 'd4f5a8b2-3c1e-4f7a-9b2d-6e8f0a1c3d5e',
  name: 'Maurício Nascimento',
  aliases: ['Mauricinho', 'MN', 'Carlos Fonseca', 'C.E. Fonseca', 'Carlão'],
  cpf: '034.567.890-12',
  rg: '23.456.789-0',
  photoUrl: '/images/photos/pessoa-02.png',
  birthDate: '1989-08-15',
  age: 36,
  sex: 'Masculino',
  father: 'Jorge Nascimento',
  mother: 'Cláudia Maria Nascimento',
  birthPlace: 'São Cristóvão - RJ',
  nationality: 'Brasileira',
  maritalStatus: 'Solteiro',
  profession: 'Não declarada',
  education: 'Ensino Fundamental Incompleto',
  religion: 'Não declarada',
  ethnicity: 'Parda',

  profiles: [
    { tipo: 'preso', ativo: true, dataInicio: '2026-08-23', detalhes: { regime: 'Fechado', unidade: 'Instituto Penal Talavera Bruce' } },
    { tipo: 'alvo', ativo: false, dataInicio: '2023-01-15', detalhes: { motivo: 'Mandado de prisão ativo' } },
  ],
  tags: [
    { label: 'CV', category: 'classificacao-criminal', color: '#DC2626' },
    { label: 'Comissão', category: 'classificacao-criminal', color: '#B91C1C' },
    { label: 'Prioritário', category: 'monitoramento', color: '#72284B' },
    { label: 'Estelionato', category: 'criminal', color: '#DC2626' },
    { label: 'Associação Criminosa', category: 'criminal', color: '#B91C1C' },
  ],
  riskLevel: 'critico',
  monitoring: {
    monitored: true,
    target: false,
    startDate: '2023-06-01',
    sector: 'Subsecretaria de Inteligência',
    criticality: 'critica',
  },

  // ── Custody (SIPEN) ──────────────────────────────────────────
  custody: {
    prisonStatus: 'Preso Definitivo',
    securityClassification: 'Segurança Máxima',
    dangerLevel: 'critico',
    crime: 'Homicídio Triplamente Qualificado',
    article: 'Art. 121 §2º, I, III, IV — Código Penal',
    regime: 'Fechado',
    unit: 'Instituto Penal Talavera Bruce',
    pavilion: 'Pavilhão C',
    gallery: 'Galeria 3',
    cell: 'Cela 17',
    lastUpdateDate: '2025-01-15',
    faction: 'CV',
    factionRole: 'Comissão',
    sipenRegistration: 'SIPEN-2018-003412',
    sipenCode: 'CS-2018-003412',
    pic: 'PIC-RJ-00341',
    rji: 'RJI-2018-09876',
    dossierSipen: 'D92826-2',
    processDpj: '0005184-36.2027.8.19.09.0071',
    environment: 'Instituto Penal Talavera Bruce',
    systemEntry: '10/04/2028',
    origin: '17ª DP — São Cristóvão',
  },

  // ── Penal History (SIPEN) ────────────────────────────────────
  penalHistory: {
    events: [
      { type: 'ingresso', title: 'Prisão', description: '17ª DP — São Cristóvão', date: '2026-08-23', status: 'Executado' },
      { type: 'ingresso', title: 'Condenado', description: 'Homicídio Triplamente Qualificado — +26 anos — 20/00 a 38 anos', date: '2027-02-12', status: 'Executado' },
      { type: 'transferencia', title: 'Transferido', description: 'Instituto Penal Vicente Piragibe → Talavera Bruce', date: '2027-12-02' },
      { type: 'falta', title: 'Falta Disciplinar Grave', description: 'Posse de objeto proibido em cela durante revista', date: '2028-03-15', status: 'Confirmada' },
      { type: 'ingresso', title: 'Em Operação PEIS', description: 'Operação Penitenciária Jun/2028', date: '2028-06-10' },
      { type: 'elogio', title: 'Elogio', description: 'Participação em programa educacional com bom desempenho', date: '2028-09-20' },
      { type: 'remicao', title: 'Remição por Estudo', description: '45 dias remidos por participação em curso profissionalizante', date: '2029-01-10', status: 'Deferida' },
    ],
    behaviorIndex: [
      { referenceDate: '2028-12-01', index: 'Regular', observation: 'Falta grave registrada no período' },
      { referenceDate: '2029-06-01', index: 'Bom', observation: 'Sem ocorrências no semestre' },
    ],
    privileges: [{ date: '2029-03-01', type: 'Visita íntima', status: 'Ativa' }],
    benefits: [
      { date: '2029-01-15', type: 'Remição por estudo', status: 'Deferido' },
      { date: '2028-06-01', type: 'Progressão de regime', status: 'Indeferido' },
    ],
    sentenceReduction: [
      { date: '2029-01-10', criterion: 'Estudo', amount: '45 dias', status: 'Deferida' },
      { date: '2028-08-15', criterion: 'Trabalho', amount: '30 dias', status: 'Deferida' },
    ],
  },

  // ── Legal Record (SIPEN) ─────────────────────────────────────
  legalRecord: {
    sentenceCalculation: {
      arrestDate: '23/08/2026',
      seapEntry: '23/08/2026',
      sentenceEnd: '15/03/2052',
      totalSentence: '26 anos',
      timeServed: '8 anos 5 meses',
      timeRemaining: '17 anos 7 meses',
      daysWorked: '180',
    },
    benefitDates: {
      oneSixth: '23/12/2030',
      oneQuarter: '23/10/2032',
      oneThird: '23/08/2034',
      oneHalf: '23/02/2039',
      twoThirds: '23/08/2043',
    },
    processes: [
      {
        number: '0005184-36.2027.8.19.09.0071',
        court: '1ª Vara Criminal — São Cristóvão',
        status: 'Transitado em Julgado',
        crimeDate: '20/08/2026',
        sentences: [{ date: '12/02/2027', crime: 'Homicídio Triplamente Qualificado', conviction: 'Condenado', penalty: '26 anos de reclusão' }],
        charges: [{ article: 'Art. 121 §2º, I, III, IV — CP', description: 'Homicídio qualificado por motivo torpe, meio cruel e recurso que dificultou defesa da vítima' }],
      },
      {
        number: '0012345-78.2028.8.19.01.0001',
        court: '2ª Vara de Execuções Penais',
        status: 'Em andamento',
        crimeDate: '15/03/2028',
        sentences: [{ date: '10/06/2028', crime: 'Associação para o tráfico', conviction: 'Condenado', penalty: '5 anos de reclusão' }],
        charges: [{ article: 'Art. 35 — Lei 11.343/06', description: 'Associação para fins de tráfico de drogas' }],
      },
    ],
    legalOccurrences: [
      { process: '0005184-36.2027.8.19.09.0071', date: '2027-02-12', description: 'Sentença condenatória proferida', type: 'Sentença', result: 'Condenado' },
      { process: '0005184-36.2027.8.19.09.0071', date: '2027-08-20', description: 'Trânsito em julgado', type: 'Trânsito', result: 'Definitivo' },
    ],
    vep: {
      lastCalculationDate: '10/01/2029',
      sentence: '26 anos reclusão + 5 anos reclusão',
      process: '0005184-36.2027.8.19.09.0071',
      charges: 'Art. 121 §2º CP + Art. 35 Lei 11.343/06',
    },
  },

  // ── Visitors (SIPEN) ─────────────────────────────────────────
  visitors: {
    familyVisitors: [
      { rg: '34.567.890-1', name: 'Fernanda Souza Nascimento', photoUrl: '/images/photos/pessoa-08.png', qualification: 'Companheira', cardStatus: 'Ativa', criminalAnalysis: 'Sem antecedentes', prohibited: false },
      { rg: '45.678.901-2', name: 'Jorge Nascimento Filho', qualification: 'Irmão', cardStatus: 'Ativa', prohibited: false },
      { rg: '56.789.012-3', name: 'Cláudia Maria Nascimento', qualification: 'Mãe', cardStatus: 'Ativa', prohibited: false },
      { rg: '67.890.123-4', name: 'Ricardo Alves', qualification: 'Amigo', cardStatus: 'Suspensa', criminalAnalysis: 'Antecedentes por tráfico', prohibited: true },
    ],
    religiousVisitors: [{ name: 'Pastor Marcos Oliveira', institution: 'Igreja Assembleia de Deus', status: 'Ativo' }],
    consularAgents: [],
    intimateVisits: [
      { date: '2029-01-05', status: 'Realizada' },
      { date: '2028-12-15', status: 'Realizada' },
    ],
  },

  // ── Lawyers (SIPEN) ──────────────────────────────────────────
  lawyers: [
    { name: 'Dr. Ricardo Almeida', oab: 'RJ-123456', sectionState: 'RJ', status: 'Regular', clientCount: 4, recurring: true },
    { name: 'Dra. Patrícia Mendes', oab: 'RJ-654321', sectionState: 'RJ', status: 'Regular', clientCount: 1, recurring: false },
  ],
  legalAppointments: [
    { date: '2029-01-08', lawyer: 'Dr. Ricardo Almeida', type: 'Atendimento presencial' },
    { date: '2028-12-20', lawyer: 'Dra. Patrícia Mendes', type: 'Petição de benefício' },
    { date: '2028-11-15', lawyer: 'Dr. Ricardo Almeida', type: 'Atendimento presencial' },
  ],

  // ── Images (SIPEN) ──────────────────────────────────────────
  images: {
    photos: [
      { url: '/images/photos/pessoa-02.png', type: 'Frente', date: '2028-04-10' },
      { url: '/images/photos/pessoa-03.png', type: 'Perfil', date: '2028-04-10' },
      { url: '/images/photos/pessoa-04.png', type: 'Close', date: '2026-08-23' },
    ],
    distinguishingMarks: [
      { slot: 'SINAL_1', description: 'Tatuagem de dragão no braço direito', location: 'Braço direito — antebraço', url: '/images/photos/pessoa-05.png' },
      { slot: 'SINAL_2', description: 'Cicatriz de corte no abdômen lado esquerdo', location: 'Abdômen — lateral esquerda', url: '/images/photos/pessoa-06.png' },
    ],
    civilDocumentation: [
      { type: 'RG', description: 'RG emitido pelo DETRAN-RJ' },
      { type: 'Certidão de Nascimento', description: 'Certidão digitalizada — Cartório 5º Ofício' },
    ],
  },

  // ── Movements (SIPEN) ────────────────────────────────────────
  movements: {
    transfers: [
      { occurrence: 'Prisão em flagrante', event: 'Ingresso', eventDate: '2026-08-23', unit: '17ª DP', destination: 'SEAP', conclusion: 'EXECUTADO' },
      { occurrence: 'Transferência judicial', event: 'Transferência', eventDate: '2026-09-10', unit: 'CDP Bangu', destination: 'Inst. Penal Vicente Piragibe', conclusion: 'EXECUTADO' },
      { occurrence: 'Transferência por segurança', event: 'Transferência', eventDate: '2027-12-02', unit: 'Vicente Piragibe', destination: 'Talavera Bruce', conclusion: 'EXECUTADO' },
      { occurrence: 'Apresentação judicial', event: 'Audiência', eventDate: '2028-03-20', unit: 'Talavera Bruce', destination: 'Fórum São Cristóvão', conclusion: 'EXECUTADO' },
      { occurrence: 'Operação PEIS', event: 'Operação', eventDate: '2028-06-10', unit: 'Talavera Bruce', conclusion: 'EXECUTADO' },
    ],
    locationHistory: [
      { startDate: '2027-12-02', unit: 'Talavera Bruce', pavilion: 'Pavilhão C', gallery: 'Galeria 3', cell: 'Cela 17' },
      { startDate: '2026-09-10', endDate: '2027-12-01', unit: 'Inst. Penal Vicente Piragibe', pavilion: 'Pavilhão A', gallery: 'Galeria 1', cell: 'Cela 05' },
      { startDate: '2026-08-23', endDate: '2026-09-09', unit: 'CDP Bangu', pavilion: 'Triagem' },
    ],
  },

  // ── Contacts (merged SIPEN + SNAP) ───────────────────────────
  contacts: {
    phones: [
      { number: '(21) 98765-4321', type: 'Celular' },
      { number: '(21) 3456-7890', type: 'Residencial' },
      { number: '(21) 99871-4532', countryCode: '+55', type: 'Celular' },
      { number: '(21) 3344-8821', countryCode: '+55', type: 'Residencial' },
    ],
    emails: [
      { address: 'contato.familiar@email.com', type: 'Pessoal (familiar)' },
      { address: 'carlos.fonseca@email.com', type: 'Pessoal', provider: 'Gmail' },
      { address: 'cfonseca@construtora.com.br', type: 'Profissional', provider: 'Corporativo' },
    ],
    addresses: [
      { street: 'Rua São Luiz', number: '245', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20940-070' },
      { street: 'Av. Brasil', number: '1200', city: 'Duque de Caxias', state: 'RJ', zipCode: '25085-000' },
      { street: 'Rua das Acácias', number: '412', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22041-001', country: 'Brasil' },
      { street: 'Av. Brasil', number: '1800', city: 'Niterói', state: 'RJ', zipCode: '24020-002', country: 'Brasil' },
    ],
  },

  // ── Related Persons (merged) ─────────────────────────────────
  relatedPersons: [
    { name: 'Carlos Eduardo Mendes', relationship: 'Associação faccional', classification: 'Preso monitorado' },
    { name: 'Wagner "Bigode"', relationship: 'Articulação externa', classification: 'Alvo prioritário' },
    { name: 'Luciana Martins', relationship: 'Referência cruzada SNAP', classification: 'Pessoa relacionada' },
    { name: 'Roberto Alves Mendes', relationship: 'Sócio', classification: 'Empresarial' },
    { name: 'Patrícia Lima Fonseca', relationship: 'Cônjuge', classification: 'Familiar' },
    { name: 'Marcos Vinícius Souza', relationship: 'Associado', classification: 'Suspeito' },
  ],

  // ── Companies (merged, deduplicated by CNPJ) ────────────────
  companies: [
    {
      name: 'MN Transportes Ltda',
      cnpj: '12.345.678/0001-90',
      status: 'Baixada',
      cnae: '4930-2/02 — Transporte rodoviário de carga',
      partners: [
        { name: 'Maurício Nascimento', cpf: '034.567.890-12', qualification: 'Sócio-Administrador' },
        { name: 'Jorge Nascimento', cpf: '012.345.678-90', qualification: 'Sócio' },
      ],
    },
    {
      name: 'CEF Empreendimentos ME',
      cnpj: '98.765.432/0001-11',
      status: 'Baixada',
      role: 'Titular',
      currentRole: 'Titular',
      startDate: '2019-07-22',
      partners: [
        { name: 'Carlos Eduardo Fonseca', cpf: '321.654.987-00', qualification: 'Titular' },
      ],
    },
  ],

  // ── Judicial Processes (SIPEN) ───────────────────────────────
  judicialProcesses: [
    { number: '0005184-36.2027.8.19.09.0071', court: 'TJ-RJ', instance: '1ª Instância', date: '2027-02-12', lawyers: [{ name: 'Dr. Ricardo Almeida', oab: 'RJ-123456' }] },
    { number: '0012345-78.2028.8.19.01.0001', court: 'TJ-RJ', instance: '1ª Instância', date: '2028-06-10', lawyers: [{ name: 'Dra. Patrícia Mendes', oab: 'RJ-654321' }] },
  ],

  // ── Escavador Processes (SNAP) ───────────────────────────────
  escavadorProcesses: [
    {
      number: '0012345-67.2021.8.19.0001',
      referralDate: '15/03/2021',
      filingDate: '10/03/2021',
      court: 'TJRJ — 3ª Vara Criminal',
      instance: '1ª Instância',
      parties: ['Carlos Eduardo Fonseca', 'Ministério Público do Estado do Rio de Janeiro'],
      lawyers: ['Dr. Antônio Pereira — OAB/RJ 98765'],
    },
    {
      number: '0054321-89.2023.8.19.0042',
      referralDate: '08/11/2023',
      filingDate: '01/11/2023',
      court: 'TJRJ — 7ª Vara Cível',
      instance: '1ª Instância',
      parties: ['Fonseca & Mendes Construções Ltda', 'Banco do Brasil S.A.'],
      lawyers: ['Dra. Fernanda Costa — OAB/RJ 54321'],
    },
  ],

  // ── SEEU Processes (SNAP) ────────────────────────────────────
  seeuProcesses: [
    {
      number: '0098765-43.2022.8.19.0001',
      district: 'Rio de Janeiro',
      jurisdiction: 'Criminal',
      filingDate: '22/06/2022',
      court: '5ª Vara de Execuções Penais',
      sentenceDate: '14/09/2022',
      judge: 'Dr. Henrique Moraes',
      subjects: 'Estelionato — Art. 171 CP',
    },
  ],

  // ── Warrants (merged) ────────────────────────────────────────
  warrants: [
    {
      number: 'MP-2026-00456',
      validityDate: '2031-08-23',
      arrestType: 'Prisão Definitiva',
      charges: 'Art. 121 §2º CP — Homicídio Qualificado',
      penalty: '26 anos reclusão',
      regime: 'Fechado',
    },
    {
      number: 'BNMP-2024-RJ-00871',
      validityDate: '31/12/2025',
      biometrics: 'Disponível',
      issuingCourt: 'TJRJ — 3ª Vara Criminal',
      arrestType: 'Preventiva',
      charges: 'Art. 171 CP — Estelionato; Art. 288 CP — Associação Criminosa',
      penalty: '4 anos e 6 meses',
      regime: 'Fechado',
    },
  ],

  // ── Official Journals (merged) ───────────────────────────────
  officialJournals: [
    { date: '2027-03-15', location: 'Rio de Janeiro', description: 'Publicação de sentença condenatória — Vara Criminal São Cristóvão', link: 'https://diario.tjrj.jus.br/2027/03/15' },
    { date: '07/11/2023', location: 'Rio de Janeiro', description: 'Nomeação para cargo comissionado — Secretaria Municipal de Obras', link: 'https://diario.rio.rj.gov.br/2023/11/07' },
    { date: '15/04/2022', location: 'Rio de Janeiro', description: 'Contrato de prestação de serviços — Fonseca & Mendes Construções Ltda', link: 'https://diario.rio.rj.gov.br/2022/04/15' },
  ],

  // ── Querido Diário Journals (SNAP) ──────────────────────────
  queridoDiarioJournals: [
    {
      date: '12/08/2023',
      location: 'Rio de Janeiro',
      link: 'https://queridodiario.ok.org.br/2023/08/12',
      state: 'RJ',
      extraEdition: false,
      phrases: ['Carlos Eduardo Fonseca — designado para comissão de licitação'],
    },
  ],

  // ── Digital Profiles (merged) ────────────────────────────────
  digitalProfiles: [
    { platform: 'Facebook', url: 'https://facebook.com/mauricio.nascimento.rj', alias: 'mauricio.nascimento.rj' },
    { platform: 'twitter', url: 'https://twitter.com/carlosedfonseca', alias: '@carlosedfonseca', profileId: '1234567890' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/carlos-fonseca-rj', alias: 'Carlos Eduardo Fonseca', profileId: 'carlos-fonseca-rj' },
  ],

  // ── Electoral (SNAP) ─────────────────────────────────────────
  electoral: {
    donations: [{ candidate: 'Candidato a deputado estadual', amount: 'R$ 5.000,00', date: '15/08/2022', party: '' }],
    affiliations: [{ party: 'MDB', state: 'RJ', status: 'Regular', registrationDate: '12/03/2010', type: 'Filiado' }],
    candidacies: [{
      electionYear: '2020',
      electionType: 'Municipal',
      description: 'Eleições Municipais 2020',
      electoralUnit: 'Rio de Janeiro/RJ',
      round: '1º Turno',
      position: 'Vereador',
      candidateNumber: '15123',
      party: 'MDB',
    }],
    electoralLinks: [{ amount: 'R$ 5.000,00', description: 'Doação a candidato a deputado estadual', date: '15/08/2022', type: 'Doação', label: 'Doador' }],
  },

  // ── Transparency (SNAP) ──────────────────────────────────────
  publicServants: [{
    source: 'transparencia-manaus',
    institution: 'Prefeitura Municipal do Rio de Janeiro',
    registration: 'RJ-2023-00871',
    department: 'Secretaria Municipal de Obras',
    serviceTime: '1 ano e 4 meses',
  }],
  publicExpenses: [{
    source: 'transparencia-am',
    date: '10/09/2023',
    creditor: 'Fonseca & Mendes Construções Ltda',
    commitmentNumber: '2023NE004521',
    fundingSource: 'Tesouro Municipal',
    classification: 'Obras e Instalações',
    amount: 487500.00,
    departmentName: 'Secretaria Municipal de Obras',
  }],

  // ── Occurrences (SIPEN) ──────────────────────────────────────
  occurrences: {
    serviceOrders: [
      { number: 'OS-2028-0145', date: '2028-03-16', type: 'Investigação', purpose: 'Apuração de posse de objeto proibido', status: 'Concluída' },
      { number: 'OS-2028-0312', date: '2028-06-11', type: 'Operação', purpose: 'Operação PEIS — varredura', status: 'Concluída' },
    ],
    occurrenceRecords: [
      { date: '2028-03-15', description: 'Objeto proibido encontrado em revista de cela', responsible: 'Insp. Eduardo Brasileiro', sector: 'Segurança' },
      { date: '2028-06-10', description: 'Participação em operação PEIS — sem intercorrências', responsible: 'Insp. Eduardo Brasileiro', sector: 'Segurança' },
    ],
  },

  // ── Activities (SIPEN) ───────────────────────────────────────
  activities: {
    labor: [{ startDate: '2028-07-01', description: 'Auxiliar de limpeza — áreas comuns', program: 'Programa de Trabalho Interno', status: 'Ativa' }],
    educational: [
      { startDate: '2028-09-01', endDate: '2029-01-10', course: 'Curso Profissionalizante — Eletricista Básico', status: 'Concluído' },
      { startDate: '2029-02-01', course: 'Ensino Fundamental — EJA', status: 'Em andamento' },
    ],
  },

  contextualAlert: 'Transferência em negociação: Penal Dr. Serrano Nepomuceno — PEIS',

  availableSources: [
    'sipen',
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
};


/**
 * SNAP_ONLY_PERSON_MOCK — Carlos Eduardo Fonseca
 * SNAP-only person. No SIPEN data (custody, penalHistory, etc. are undefined).
 */
export const SNAP_ONLY_PERSON_MOCK: UnifiedPerson = {
  id: 'a7c2e9f1-5b3d-4a8e-b6f4-2d1c0e9a7b3f',
  name: 'Carlos Eduardo Fonseca',
  aliases: ['Carlos Fonseca', 'C.E. Fonseca', 'Carlão'],
  cpf: '321.654.987-00',
  birthDate: '14-03-1978',
  age: 46,
  sex: 'Masculino',
  language: 'Português',
  cpfStatus: 'Regular',

  profiles: [
    { tipo: 'alvo', ativo: true, dataInicio: '2023-01-15', detalhes: { motivo: 'Mandado de prisão ativo' } },
  ],
  tags: [
    { label: 'Estelionato', category: 'criminal', color: '#DC2626' },
    { label: 'Associação Criminosa', category: 'criminal', color: '#B91C1C' },
  ],
  riskLevel: 'alto',
  monitoring: { monitored: true, target: false },

  // SIPEN sections — undefined
  custody: undefined,
  penalHistory: undefined,
  legalRecord: undefined,
  visitors: undefined,
  images: undefined,
  movements: undefined,
  occurrences: undefined,
  activities: undefined,

  lawyers: [],
  legalAppointments: [],

  contacts: {
    phones: [
      { number: '(21) 99871-4532', countryCode: '+55', type: 'Celular' },
      { number: '(21) 3344-8821', countryCode: '+55', type: 'Residencial' },
    ],
    emails: [
      { address: 'carlos.fonseca@email.com', type: 'Pessoal', provider: 'Gmail' },
      { address: 'cfonseca@construtora.com.br', type: 'Profissional', provider: 'Corporativo' },
    ],
    addresses: [
      { street: 'Rua das Acácias', number: '412', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22041-001', country: 'Brasil' },
      { street: 'Av. Brasil', number: '1800', city: 'Niterói', state: 'RJ', zipCode: '24020-002', country: 'Brasil' },
    ],
  },
  relatedPersons: [
    { name: 'Roberto Alves Mendes', relationship: 'Sócio', classification: 'Empresarial' },
    { name: 'Patrícia Lima Fonseca', relationship: 'Cônjuge', classification: 'Familiar' },
    { name: 'Marcos Vinícius Souza', relationship: 'Associado', classification: 'Suspeito' },
  ],
  companies: [
    {
      name: 'Fonseca & Mendes Construções Ltda',
      cnpj: '12.345.678/0001-90',
      status: 'Ativa',
      role: 'Sócio-Administrador',
      currentRole: 'Sócio-Administrador',
      startDate: '2015-03-10',
      partners: [
        { name: 'Carlos Eduardo Fonseca', cpf: '321.654.987-00', qualification: 'Sócio-Administrador' },
        { name: 'Roberto Alves Mendes', cpf: '456.789.123-00', qualification: 'Sócio' },
      ],
    },
    {
      name: 'CEF Empreendimentos ME',
      cnpj: '98.765.432/0001-11',
      status: 'Baixada',
      role: 'Titular',
      currentRole: 'Titular',
      startDate: '2019-07-22',
      partners: [
        { name: 'Carlos Eduardo Fonseca', cpf: '321.654.987-00', qualification: 'Titular' },
      ],
    },
  ],
  judicialProcesses: [],
  escavadorProcesses: [
    {
      number: '0012345-67.2021.8.19.0001',
      referralDate: '15/03/2021',
      filingDate: '10/03/2021',
      court: 'TJRJ — 3ª Vara Criminal',
      instance: '1ª Instância',
      parties: ['Carlos Eduardo Fonseca', 'Ministério Público do Estado do Rio de Janeiro'],
      lawyers: ['Dr. Antônio Pereira — OAB/RJ 98765'],
    },
    {
      number: '0054321-89.2023.8.19.0042',
      referralDate: '08/11/2023',
      filingDate: '01/11/2023',
      court: 'TJRJ — 7ª Vara Cível',
      instance: '1ª Instância',
      parties: ['Fonseca & Mendes Construções Ltda', 'Banco do Brasil S.A.'],
      lawyers: ['Dra. Fernanda Costa — OAB/RJ 54321'],
    },
  ],
  seeuProcesses: [
    {
      number: '0098765-43.2022.8.19.0001',
      district: 'Rio de Janeiro',
      jurisdiction: 'Criminal',
      filingDate: '22/06/2022',
      court: '5ª Vara de Execuções Penais',
      sentenceDate: '14/09/2022',
      judge: 'Dr. Henrique Moraes',
      subjects: 'Estelionato — Art. 171 CP',
    },
  ],
  warrants: [
    {
      number: 'BNMP-2024-RJ-00871',
      validityDate: '31/12/2025',
      biometrics: 'Disponível',
      issuingCourt: 'TJRJ — 3ª Vara Criminal',
      arrestType: 'Preventiva',
      charges: 'Art. 171 CP — Estelionato; Art. 288 CP — Associação Criminosa',
      penalty: '4 anos e 6 meses',
      regime: 'Fechado',
    },
  ],
  officialJournals: [
    { date: '07/11/2023', location: 'Rio de Janeiro', description: 'Nomeação para cargo comissionado — Secretaria Municipal de Obras', link: 'https://diario.rio.rj.gov.br/2023/11/07' },
    { date: '15/04/2022', location: 'Rio de Janeiro', description: 'Contrato de prestação de serviços — Fonseca & Mendes Construções Ltda', link: 'https://diario.rio.rj.gov.br/2022/04/15' },
  ],
  queridoDiarioJournals: [
    {
      date: '12/08/2023',
      location: 'Rio de Janeiro',
      link: 'https://queridodiario.ok.org.br/2023/08/12',
      state: 'RJ',
      extraEdition: false,
      phrases: ['Carlos Eduardo Fonseca — designado para comissão de licitação'],
    },
  ],
  digitalProfiles: [
    { platform: 'twitter', url: 'https://twitter.com/carlosedfonseca', alias: '@carlosedfonseca', profileId: '1234567890' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/carlos-fonseca-rj', alias: 'Carlos Eduardo Fonseca', profileId: 'carlos-fonseca-rj' },
  ],
  electoral: {
    donations: [{ candidate: 'Candidato a deputado estadual', amount: 'R$ 5.000,00', date: '15/08/2022', party: '' }],
    affiliations: [{ party: 'MDB', state: 'RJ', status: 'Regular', registrationDate: '12/03/2010', type: 'Filiado' }],
    candidacies: [{
      electionYear: '2020',
      electionType: 'Municipal',
      description: 'Eleições Municipais 2020',
      electoralUnit: 'Rio de Janeiro/RJ',
      round: '1º Turno',
      position: 'Vereador',
      candidateNumber: '15123',
      party: 'MDB',
    }],
    electoralLinks: [{ amount: 'R$ 5.000,00', description: 'Doação a candidato a deputado estadual', date: '15/08/2022', type: 'Doação', label: 'Doador' }],
  },
  publicServants: [{
    source: 'transparencia-manaus',
    institution: 'Prefeitura Municipal do Rio de Janeiro',
    registration: 'RJ-2023-00871',
    department: 'Secretaria Municipal de Obras',
    serviceTime: '1 ano e 4 meses',
  }],
  publicExpenses: [{
    source: 'transparencia-am',
    date: '10/09/2023',
    creditor: 'Fonseca & Mendes Construções Ltda',
    commitmentNumber: '2023NE004521',
    fundingSource: 'Tesouro Municipal',
    classification: 'Obras e Instalações',
    amount: 487500.00,
    departmentName: 'Secretaria Municipal de Obras',
  }],

  contextualAlert: 'Mandado de prisão ativo (BNMP). Verificar localização.',

  availableSources: [
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
};


/**
 * SIPEN_ONLY_PERSON_MOCK — João Carlos Pires Ribeiro da Silva
 * SIPEN-only person. Minimal SNAP sections (empty arrays).
 */
export const SIPEN_ONLY_PERSON_MOCK: UnifiedPerson = {
  id: 'f1e2d3c4-b5a6-4789-8901-2345abcdef67',
  name: 'João Carlos Pires Ribeiro da Silva',
  aliases: ['Joãozinho', 'JC'],
  cpf: '987.654.321-00',
  rg: '98.765.432-1',
  photoUrl: '/images/photos/pessoa-03.png',
  birthDate: '1992-11-20',
  age: 33,
  sex: 'Masculino',
  father: 'Jorge Nascimento',
  mother: 'Cláudia Maria Nascimento',
  birthPlace: 'São Cristóvão - RJ',
  nationality: 'Brasileira',
  maritalStatus: 'Solteiro',
  profession: 'Não declarada',
  education: 'Ensino Fundamental Incompleto',
  religion: 'Não declarada',
  ethnicity: 'Parda',

  profiles: [
    { tipo: 'preso', ativo: true, dataInicio: '2026-08-23', detalhes: { regime: 'Fechado', unidade: 'Instituto Penal Talavera Bruce' } },
  ],
  tags: [
    { label: 'CV', category: 'classificacao-criminal', color: '#DC2626' },
    { label: 'Comissão', category: 'classificacao-criminal', color: '#B91C1C' },
    { label: 'Prioritário', category: 'monitoramento', color: '#72284B' },
  ],
  riskLevel: 'critico',
  monitoring: {
    monitored: true,
    target: false,
    startDate: '2023-06-01',
    sector: 'Subsecretaria de Inteligência',
    criticality: 'critica',
  },

  custody: {
    prisonStatus: 'Preso Definitivo',
    securityClassification: 'Segurança Máxima',
    dangerLevel: 'critico',
    crime: 'Homicídio Triplamente Qualificado',
    article: 'Art. 121 §2º, I, III, IV — Código Penal',
    regime: 'Fechado',
    unit: 'Instituto Penal Talavera Bruce',
    pavilion: 'Pavilhão C',
    gallery: 'Galeria 3',
    cell: 'Cela 17',
    lastUpdateDate: '2025-01-15',
    faction: 'CV',
    factionRole: 'Comissão',
    sipenRegistration: 'SIPEN-2019-007823',
    sipenCode: 'CS-2019-007823',
    pic: 'PIC-RJ-00341',
    rji: 'RJI-2018-09876',
    dossierSipen: 'D92826-2',
    processDpj: '0005184-36.2027.8.19.09.0071',
    environment: 'Instituto Penal Talavera Bruce',
    systemEntry: '10/04/2028',
    origin: '17ª DP — São Cristóvão',
  },

  penalHistory: {
    events: [
      { type: 'ingresso', title: 'Prisão', description: '17ª DP — São Cristóvão', date: '2026-08-23', status: 'Executado' },
      { type: 'ingresso', title: 'Condenado', description: 'Homicídio Triplamente Qualificado — +26 anos — 20/00 a 38 anos', date: '2027-02-12', status: 'Executado' },
      { type: 'transferencia', title: 'Transferido', description: 'Instituto Penal Vicente Piragibe → Talavera Bruce', date: '2027-12-02' },
      { type: 'falta', title: 'Falta Disciplinar Grave', description: 'Posse de objeto proibido em cela durante revista', date: '2028-03-15', status: 'Confirmada' },
      { type: 'ingresso', title: 'Em Operação PEIS', description: 'Operação Penitenciária Jun/2028', date: '2028-06-10' },
      { type: 'elogio', title: 'Elogio', description: 'Participação em programa educacional com bom desempenho', date: '2028-09-20' },
      { type: 'remicao', title: 'Remição por Estudo', description: '45 dias remidos por participação em curso profissionalizante', date: '2029-01-10', status: 'Deferida' },
    ],
    behaviorIndex: [
      { referenceDate: '2028-12-01', index: 'Regular', observation: 'Falta grave registrada no período' },
      { referenceDate: '2029-06-01', index: 'Bom', observation: 'Sem ocorrências no semestre' },
    ],
    privileges: [{ date: '2029-03-01', type: 'Visita íntima', status: 'Ativa' }],
    benefits: [
      { date: '2029-01-15', type: 'Remição por estudo', status: 'Deferido' },
      { date: '2028-06-01', type: 'Progressão de regime', status: 'Indeferido' },
    ],
    sentenceReduction: [
      { date: '2029-01-10', criterion: 'Estudo', amount: '45 dias', status: 'Deferida' },
      { date: '2028-08-15', criterion: 'Trabalho', amount: '30 dias', status: 'Deferida' },
    ],
  },

  legalRecord: {
    sentenceCalculation: {
      arrestDate: '23/08/2026',
      seapEntry: '23/08/2026',
      sentenceEnd: '15/03/2052',
      totalSentence: '26 anos',
      timeServed: '8 anos 5 meses',
      timeRemaining: '17 anos 7 meses',
      daysWorked: '180',
    },
    benefitDates: {
      oneSixth: '23/12/2030',
      oneQuarter: '23/10/2032',
      oneThird: '23/08/2034',
      oneHalf: '23/02/2039',
      twoThirds: '23/08/2043',
    },
    processes: [
      {
        number: '0005184-36.2027.8.19.09.0071',
        court: '1ª Vara Criminal — São Cristóvão',
        status: 'Transitado em Julgado',
        crimeDate: '20/08/2026',
        sentences: [{ date: '12/02/2027', crime: 'Homicídio Triplamente Qualificado', conviction: 'Condenado', penalty: '26 anos de reclusão' }],
        charges: [{ article: 'Art. 121 §2º, I, III, IV — CP', description: 'Homicídio qualificado por motivo torpe, meio cruel e recurso que dificultou defesa da vítima' }],
      },
      {
        number: '0012345-78.2028.8.19.01.0001',
        court: '2ª Vara de Execuções Penais',
        status: 'Em andamento',
        crimeDate: '15/03/2028',
        sentences: [{ date: '10/06/2028', crime: 'Associação para o tráfico', conviction: 'Condenado', penalty: '5 anos de reclusão' }],
        charges: [{ article: 'Art. 35 — Lei 11.343/06', description: 'Associação para fins de tráfico de drogas' }],
      },
    ],
    legalOccurrences: [
      { process: '0005184-36.2027.8.19.09.0071', date: '2027-02-12', description: 'Sentença condenatória proferida', type: 'Sentença', result: 'Condenado' },
      { process: '0005184-36.2027.8.19.09.0071', date: '2027-08-20', description: 'Trânsito em julgado', type: 'Trânsito', result: 'Definitivo' },
    ],
    vep: {
      lastCalculationDate: '10/01/2029',
      sentence: '26 anos reclusão + 5 anos reclusão',
      process: '0005184-36.2027.8.19.09.0071',
      charges: 'Art. 121 §2º CP + Art. 35 Lei 11.343/06',
    },
  },

  visitors: {
    familyVisitors: [
      { rg: '34.567.890-1', name: 'Fernanda Souza Nascimento', photoUrl: '/images/photos/pessoa-08.png', qualification: 'Companheira', cardStatus: 'Ativa', criminalAnalysis: 'Sem antecedentes', prohibited: false },
      { rg: '45.678.901-2', name: 'Jorge Nascimento Filho', qualification: 'Irmão', cardStatus: 'Ativa', prohibited: false },
      { rg: '56.789.012-3', name: 'Cláudia Maria Nascimento', qualification: 'Mãe', cardStatus: 'Ativa', prohibited: false },
      { rg: '67.890.123-4', name: 'Ricardo Alves', qualification: 'Amigo', cardStatus: 'Suspensa', criminalAnalysis: 'Antecedentes por tráfico', prohibited: true },
    ],
    religiousVisitors: [{ name: 'Pastor Marcos Oliveira', institution: 'Igreja Assembleia de Deus', status: 'Ativo' }],
    consularAgents: [],
    intimateVisits: [
      { date: '2029-01-05', status: 'Realizada' },
      { date: '2028-12-15', status: 'Realizada' },
    ],
  },

  lawyers: [
    { name: 'Dr. Ricardo Almeida', oab: 'RJ-123456', sectionState: 'RJ', status: 'Regular', clientCount: 4, recurring: true },
    { name: 'Dra. Patrícia Mendes', oab: 'RJ-654321', sectionState: 'RJ', status: 'Regular', clientCount: 1, recurring: false },
  ],
  legalAppointments: [
    { date: '2029-01-08', lawyer: 'Dr. Ricardo Almeida', type: 'Atendimento presencial' },
    { date: '2028-12-20', lawyer: 'Dra. Patrícia Mendes', type: 'Petição de benefício' },
    { date: '2028-11-15', lawyer: 'Dr. Ricardo Almeida', type: 'Atendimento presencial' },
  ],

  images: {
    photos: [
      { url: '/images/photos/pessoa-02.png', type: 'Frente', date: '2028-04-10' },
      { url: '/images/photos/pessoa-03.png', type: 'Perfil', date: '2028-04-10' },
      { url: '/images/photos/pessoa-04.png', type: 'Close', date: '2026-08-23' },
    ],
    distinguishingMarks: [
      { slot: 'SINAL_1', description: 'Tatuagem de dragão no braço direito', location: 'Braço direito — antebraço', url: '/images/photos/pessoa-05.png' },
      { slot: 'SINAL_2', description: 'Cicatriz de corte no abdômen lado esquerdo', location: 'Abdômen — lateral esquerda', url: '/images/photos/pessoa-06.png' },
    ],
    civilDocumentation: [
      { type: 'RG', description: 'RG emitido pelo DETRAN-RJ' },
      { type: 'Certidão de Nascimento', description: 'Certidão digitalizada — Cartório 5º Ofício' },
    ],
  },

  movements: {
    transfers: [
      { occurrence: 'Prisão em flagrante', event: 'Ingresso', eventDate: '2026-08-23', unit: '17ª DP', destination: 'SEAP', conclusion: 'EXECUTADO' },
      { occurrence: 'Transferência judicial', event: 'Transferência', eventDate: '2026-09-10', unit: 'CDP Bangu', destination: 'Inst. Penal Vicente Piragibe', conclusion: 'EXECUTADO' },
      { occurrence: 'Transferência por segurança', event: 'Transferência', eventDate: '2027-12-02', unit: 'Vicente Piragibe', destination: 'Talavera Bruce', conclusion: 'EXECUTADO' },
      { occurrence: 'Apresentação judicial', event: 'Audiência', eventDate: '2028-03-20', unit: 'Talavera Bruce', destination: 'Fórum São Cristóvão', conclusion: 'EXECUTADO' },
      { occurrence: 'Operação PEIS', event: 'Operação', eventDate: '2028-06-10', unit: 'Talavera Bruce', conclusion: 'EXECUTADO' },
    ],
    locationHistory: [
      { startDate: '2027-12-02', unit: 'Talavera Bruce', pavilion: 'Pavilhão C', gallery: 'Galeria 3', cell: 'Cela 17' },
      { startDate: '2026-09-10', endDate: '2027-12-01', unit: 'Inst. Penal Vicente Piragibe', pavilion: 'Pavilhão A', gallery: 'Galeria 1', cell: 'Cela 05' },
      { startDate: '2026-08-23', endDate: '2026-09-09', unit: 'CDP Bangu', pavilion: 'Triagem' },
    ],
  },

  // ── Minimal SNAP sections (empty) ────────────────────────────
  contacts: { phones: [], emails: [], addresses: [] },
  relatedPersons: [],
  companies: [],
  judicialProcesses: [],
  escavadorProcesses: [],
  seeuProcesses: [],
  warrants: [],
  officialJournals: [],
  queridoDiarioJournals: [],
  digitalProfiles: [],
  electoral: { donations: [], affiliations: [], candidacies: [], electoralLinks: [] },
  publicServants: [],
  publicExpenses: [],

  occurrences: {
    serviceOrders: [
      { number: 'OS-2028-0145', date: '2028-03-16', type: 'Investigação', purpose: 'Apuração de posse de objeto proibido', status: 'Concluída' },
      { number: 'OS-2028-0312', date: '2028-06-11', type: 'Operação', purpose: 'Operação PEIS — varredura', status: 'Concluída' },
    ],
    occurrenceRecords: [
      { date: '2028-03-15', description: 'Objeto proibido encontrado em revista de cela', responsible: 'Insp. Eduardo Brasileiro', sector: 'Segurança' },
      { date: '2028-06-10', description: 'Participação em operação PEIS — sem intercorrências', responsible: 'Insp. Eduardo Brasileiro', sector: 'Segurança' },
    ],
  },

  activities: {
    labor: [{ startDate: '2028-07-01', description: 'Auxiliar de limpeza — áreas comuns', program: 'Programa de Trabalho Interno', status: 'Ativa' }],
    educational: [
      { startDate: '2028-09-01', endDate: '2029-01-10', course: 'Curso Profissionalizante — Eletricista Básico', status: 'Concluído' },
      { startDate: '2029-02-01', course: 'Ensino Fundamental — EJA', status: 'Em andamento' },
    ],
  },

  contextualAlert: 'Transferência em negociação: Penal Dr. Serrano Nepomuceno — PEIS',

  availableSources: ['sipen'],
};
