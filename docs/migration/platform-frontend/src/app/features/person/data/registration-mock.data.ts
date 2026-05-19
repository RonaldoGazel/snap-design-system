// ─────────────────────────────────────────────────────────────────────────────
// Registration Flow — Mock Data
// Ported from person-creation-flow-ui/prototype/person-registration-data.js
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DataSource,
  FullProfile,
  MockConfig,
  NormalizedFormData,
  PersonMatch,
  Scenario,
} from '../models/registration.model';

// ── Helper ──────────────────────────────────────────────────────────────────

/** Build a photo URL for a mock person. Photos live in `src/assets/photos/`. */
const photo = (n: number): string => `/assets/photos/pessoa-${String(n).padStart(2, '0')}.png`;

// ── Mock Configuration ──────────────────────────────────────────────────────

export const MOCK_CONFIG: MockConfig = {
  latencyMs: {
    localSearch: 800,
    sipenBasicSearch: 1400,
    snapBasicSearch: 1600,
    sipenFullProfile: 6000,
    snapFullProfile: 6500,
  },
  manualRegistrationRedirectUrl: '/intelligence/person/registration',
  reservedSector: {
    id: 'SI',
    name: 'Superintendência de Inteligência',
  },
  defaultVisibilityOptions: [
    {
      id: 'PUBLICO',
      label: 'Público',
      description: 'Visível para toda a organização, conforme permissões aplicáveis.',
    },
    {
      id: 'RESERVADO',
      label: 'Reservado',
      description: 'Visível apenas para o setor do usuário.',
    },
  ],
  confidenceThresholds: {
    high: 0.9,
    medium: 0.7,
    low: 0.0,
  },
};

// ── Scenario Matrix (CEN-001 through CEN-010) ──────────────────────────────

export const SCENARIO_MATRIX: Scenario[] = [
  {
    id: 'CEN-001',
    title: 'CPF encontrado na base local',
    trigger: { cpfNormalized: '01351197665' },
    localResultSet: 'local-cpf-found',
    sipenResultSet: null,
    snapResultSet: null,
    expectedFlow: 'STOP_OR_USER_ADVANCES_MANUALLY',
  },
  {
    id: 'CEN-002',
    title: 'Homônimos locais por Nome + UF',
    trigger: { nomeNormalized: 'joao carlos', uf: 'MG' },
    localResultSet: 'local-homonyms-mg',
    sipenResultSet: 'sipen-after-local-homonyms',
    snapResultSet: 'snap-after-sipen-empty',
    expectedFlow: 'LOCAL_RESULTS_THEN_OPTION_TO_ADVANCE',
  },
  {
    id: 'CEN-003',
    title: 'Encontrado no SIPEN',
    trigger: { cpfNormalized: '22233344405' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-person-found',
    snapResultSet: 'snap-not-executed-if-sipen-selected',
    expectedFlow: 'SIPEN_SELECTION_INTERRUPTS_FLOW',
  },
  {
    id: 'CEN-004',
    title: 'Encontrado apenas no SNAP',
    trigger: { cpfNormalized: '33344455506' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-empty',
    snapResultSet: 'snap-person-found',
    expectedFlow: 'SNAP_SELECTION_AVAILABLE',
  },
  {
    id: 'CEN-005',
    title: 'Encontrado no SIPEN e no SNAP',
    trigger: { cpfNormalized: '44455566607' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-person-found-also-in-snap',
    snapResultSet: 'snap-person-found-after-sipen-refused',
    expectedFlow: 'USER_CHOOSES_SOURCE',
  },
  {
    id: 'CEN-006',
    title: 'Pessoa não encontrada em nenhuma fonte',
    trigger: { nomeNormalized: 'pessoa inexistente mock', uf: 'RJ' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-empty',
    snapResultSet: 'snap-empty',
    expectedFlow: 'MANUAL_REGISTRATION_OPTION',
  },
  {
    id: 'CEN-007',
    title: 'SNAP não aplicável por falta de dados',
    trigger: { rg: '99999999' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-empty',
    snapApplicable: false,
    snapResultSet: null,
    missingSnapFieldsMessage: 'Para consultar o SNAP, informe um CPF válido ou preencha Nome e UF.',
    expectedFlow: 'SNAP_NOT_APPLICABLE',
  },
  {
    id: 'CEN-007b',
    title: 'SNAP não aplicável — apenas Vulgo',
    trigger: { vulgo: 'baixinho' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-empty',
    snapApplicable: false,
    snapResultSet: null,
    missingSnapFieldsMessage: 'Para consultar o SNAP, informe um CPF válido ou preencha Nome e UF.',
    expectedFlow: 'SNAP_NOT_APPLICABLE',
  },
  {
    id: 'CEN-008',
    title: 'Erro simulado em API externa',
    trigger: { cpfNormalized: '55566677708' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-error',
    snapResultSet: 'snap-person-found-after-sipen-error',
    expectedFlow: 'ERROR_HANDLING_WITH_CONTINUATION',
  },
  {
    id: 'CEN-009',
    title: 'Múltiplas correspondências com scores diferentes',
    trigger: { nomeNormalized: 'marcos paulo', uf: 'RJ' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-multiple-scores',
    snapResultSet: 'snap-multiple-scores',
    expectedFlow: 'SORTED_RESULTS_BY_CONFIDENCE',
  },
  {
    id: 'CEN-010',
    title: 'Pessoa presa ou ex-presa com dados prisionais',
    trigger: { cpfNormalized: '66677788809' },
    localResultSet: 'local-empty',
    sipenResultSet: 'sipen-prison-profile',
    snapResultSet: null,
    expectedFlow: 'PRISON_DATA_VISIBLE_IN_CARD_AND_DRAWER',
  },
];

// ── Local People ────────────────────────────────────────────────────────────

export const LOCAL_PEOPLE: PersonMatch[] = [
  {
    id: 'local-001',
    source: 'BASE_LOCAL',
    profileType: null,
    fullName: 'João Carlos de Souza',
    normalizedName: 'joao carlos de souza',
    uf: 'RJ',
    cpf: '013.511.976-65',
    cpfNormalized: '01351197665',
    rg: '12345678',
    aliases: ['Joãozinho', 'JC'],
    birthDate: '1985-04-12',
    age: 40,
    motherName: 'Maria de Souza',
    fatherName: 'Carlos Alberto de Souza',
    birthplace: 'Rio de Janeiro/RJ',
    photoUrl: photo(4),
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'CPF_EXATO',
    confidenceScore: 0.99,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: true,
    localDuplicateId: null,
    profileUrl: '/intelligence/person/pessoas/prontuario',
    lastUpdatedAt: '2026-03-25T10:30:00Z',
  },
  {
    id: 'local-002',
    source: 'BASE_LOCAL',
    profileType: null,
    fullName: 'João Carlos Pereira',
    normalizedName: 'joao carlos pereira',
    uf: 'MG',
    cpf: '',
    cpfNormalized: '',
    rg: 'MG-4455667',
    aliases: ['João de BH'],
    birthDate: '1991-09-20',
    age: 34,
    motherName: 'Aparecida Pereira',
    fatherName: '',
    birthplace: 'Belo Horizonte/MG',
    photoUrl: photo(6),
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'NOME_SEMELHANTE_UF',
    confidenceScore: 0.86,
    confidenceLabel: 'Média',
    possibleLocalDuplicate: false,
    alreadyRegistered: true,
    localDuplicateId: null,
    profileUrl: '/intelligence/person/pessoas/prontuario',
    lastUpdatedAt: '2026-02-10T14:15:00Z',
  },
  {
    id: 'local-003',
    source: 'BASE_LOCAL',
    profileType: null,
    fullName: 'João Carlos Martins',
    normalizedName: 'joao carlos martins',
    uf: 'MG',
    cpf: '',
    cpfNormalized: '',
    rg: 'MG-9988776',
    aliases: ['Carlinhos'],
    birthDate: '1988-01-05',
    age: 38,
    motherName: 'Lúcia Martins',
    fatherName: 'José Martins',
    birthplace: 'Contagem/MG',
    photoUrl: photo(7),
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'NOME_SEMELHANTE_UF',
    confidenceScore: 0.79,
    confidenceLabel: 'Média',
    possibleLocalDuplicate: false,
    alreadyRegistered: true,
    localDuplicateId: null,
    profileUrl: '/intelligence/person/pessoas/prontuario',
    lastUpdatedAt: '2026-02-12T09:20:00Z',
  },
];

// ── SIPEN Basic Results ─────────────────────────────────────────────────────

export const SIPEN_BASIC_RESULTS: PersonMatch[] = [
  {
    id: 'sipen-001',
    source: 'SIPEN',
    profileType: 'PRESO',
    fullName: 'Rafael Antônio de Almeida',
    normalizedName: 'rafael antonio de almeida',
    uf: 'RJ',
    cpf: '222.333.444-05',
    cpfNormalized: '22233344405',
    rg: '11889977',
    aliases: ['Rafa', 'Tônico'],
    birthDate: '1987-08-14',
    age: 38,
    motherName: 'Eliane de Almeida',
    fatherName: 'Antônio Carlos de Almeida',
    birthplace: 'Duque de Caxias/RJ',
    photoUrl: photo(3),
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: 'Custodiado',
    currentPrisonUnit: 'Penitenciária Industrial Esmeraldino Bandeira',
    matchType: 'CPF_EXATO',
    confidenceScore: 0.97,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-20T11:00:00Z',
  },
  {
    id: 'sipen-002',
    source: 'SIPEN',
    profileType: 'VISITANTE',
    fullName: 'Marcos Paulo da Conceição',
    normalizedName: 'marcos paulo da conceicao',
    uf: 'RJ',
    cpf: '',
    cpfNormalized: '',
    rg: '22554411',
    aliases: ['Marquinho'],
    birthDate: '1994-11-02',
    age: 31,
    motherName: 'Rosa Maria da Conceição',
    fatherName: '',
    birthplace: 'São Gonçalo/RJ',
    photoUrl: photo(5),
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'NOME_SEMELHANTE_UF',
    confidenceScore: 0.83,
    confidenceLabel: 'Média',
    possibleLocalDuplicate: true,
    alreadyRegistered: false,
    localDuplicateId: 'local-010',
    profileUrl: null,
    lastUpdatedAt: '2026-03-18T16:30:00Z',
  },
  {
    id: 'sipen-003',
    source: 'SIPEN',
    profileType: 'EX_PRESO',
    fullName: 'Carlos Eduardo Nogueira',
    normalizedName: 'carlos eduardo nogueira',
    uf: 'RJ',
    cpf: '666.777.888-09',
    cpfNormalized: '66677788809',
    rg: '33778899',
    aliases: ['Cadu'],
    birthDate: '1981-06-30',
    age: 44,
    motherName: 'Neuza Nogueira',
    fatherName: 'Eduardo Nogueira',
    birthplace: 'Niterói/RJ',
    photoUrl: photo(2),
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: 'Egresso',
    currentPrisonUnit: 'Última unidade: Instituto Penal Plácido Sá Carvalho',
    matchType: 'CPF_EXATO',
    confidenceScore: 0.98,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-21T12:45:00Z',
  },
  {
    id: 'sipen-004',
    source: 'SIPEN',
    profileType: 'FAMILIAR',
    fullName: 'Luciana Ferreira da Silva',
    normalizedName: 'luciana ferreira da silva',
    uf: 'RJ',
    cpf: '444.555.666-07',
    cpfNormalized: '44455566607',
    rg: '55667788',
    aliases: ['Lu'],
    birthDate: '1992-07-22',
    age: 33,
    motherName: 'Sandra Ferreira',
    fatherName: 'José da Silva',
    birthplace: 'Nova Iguaçu/RJ',
    photoUrl: photo(6),
    phones: [],
    emails: [],
    addresses: [],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'CPF_EXATO',
    confidenceScore: 0.95,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-22T08:30:00Z',
  },
];

// ── SNAP Basic Results ──────────────────────────────────────────────────────

export const SNAP_BASIC_RESULTS: PersonMatch[] = [
  {
    id: 'snap-001',
    source: 'SNAP',
    profileType: null,
    fullName: 'Fernanda Cristina Lopes',
    normalizedName: 'fernanda cristina lopes',
    uf: 'SP',
    cpf: '333.444.555-06',
    cpfNormalized: '33344455506',
    rg: '44556677',
    aliases: ['Fê Lopes'],
    birthDate: '1990-03-15',
    age: 36,
    motherName: 'Sueli Cristina Lopes',
    fatherName: 'Paulo Roberto Lopes',
    birthplace: 'São Paulo/SP',
    photoUrl: photo(1),
    phones: [{ number: '(11) 97777-2001', type: 'Celular' }],
    emails: [{ email: 'fernanda.lopes.mock@email.com', type: 'Pessoal' }],
    addresses: [
      {
        street: 'Rua das Palmeiras',
        number: '455',
        district: 'Vila Mariana',
        city: 'São Paulo',
        uf: 'SP',
        zipCode: '04000-000',
      },
    ],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'CPF_EXATO',
    confidenceScore: 0.96,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-19T09:10:00Z',
  },
  {
    id: 'snap-002',
    source: 'SNAP',
    profileType: null,
    fullName: 'Marcos Paulo da Conceição',
    normalizedName: 'marcos paulo da conceicao',
    uf: 'RJ',
    cpf: '',
    cpfNormalized: '',
    rg: '',
    aliases: ['Marquinho'],
    birthDate: '1994-11-02',
    age: 31,
    motherName: 'Rosa Maria da Conceição',
    fatherName: '',
    birthplace: 'São Gonçalo/RJ',
    photoUrl: photo(8),
    phones: [{ number: '(21) 96666-3001', type: 'Celular' }],
    emails: [{ email: 'marcos.mock@email.com', type: 'Pessoal' }],
    addresses: [
      {
        street: 'Rua Projetada',
        number: '88',
        district: 'Alcântara',
        city: 'São Gonçalo',
        uf: 'RJ',
        zipCode: '24400-000',
      },
    ],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'NOME_SEMELHANTE_UF',
    confidenceScore: 0.81,
    confidenceLabel: 'Média',
    possibleLocalDuplicate: true,
    alreadyRegistered: false,
    localDuplicateId: 'local-010',
    profileUrl: null,
    lastUpdatedAt: '2026-03-19T09:25:00Z',
  },
  {
    id: 'snap-003',
    source: 'SNAP',
    profileType: null,
    fullName: 'Luciana Ferreira da Silva',
    normalizedName: 'luciana ferreira da silva',
    uf: 'RJ',
    cpf: '444.555.666-07',
    cpfNormalized: '44455566607',
    rg: '55667788',
    aliases: ['Lu'],
    birthDate: '1992-07-22',
    age: 33,
    motherName: 'Sandra Ferreira',
    fatherName: 'José da Silva',
    birthplace: 'Nova Iguaçu/RJ',
    photoUrl: photo(6),
    phones: [{ number: '(21) 99111-4001', type: 'Celular' }],
    emails: [{ email: 'luciana.mock@email.com', type: 'Pessoal' }],
    addresses: [
      {
        street: 'Rua Marechal Floriano',
        number: '310',
        district: 'Centro',
        city: 'Nova Iguaçu',
        uf: 'RJ',
        zipCode: '26200-000',
      },
    ],
    prisonStatus: null,
    currentPrisonUnit: null,
    matchType: 'CPF_EXATO',
    confidenceScore: 0.93,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-22T10:15:00Z',
  },
];

// ── SIPEN Full Profiles ─────────────────────────────────────────────────────

export const SIPEN_FULL_PROFILES: FullProfile[] = [
  {
    // Rafael Antônio de Almeida — PRESO (CEN-003)
    id: 'sipen-001-full',
    source: 'SIPEN',
    profileType: 'PRESO',
    fullName: 'Rafael Antônio de Almeida',
    normalizedName: 'rafael antonio de almeida',
    uf: 'RJ',
    cpf: '222.333.444-05',
    cpfNormalized: '22233344405',
    rg: '11889977',
    aliases: ['Rafa', 'Tônico'],
    birthDate: '1987-08-14',
    age: 38,
    motherName: 'Eliane de Almeida',
    fatherName: 'Antônio Carlos de Almeida',
    birthplace: 'Duque de Caxias/RJ',
    photoUrl: photo(3),
    matchType: 'CPF_EXATO',
    confidenceScore: 0.97,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-20T11:00:00Z',
    prisonStatus: 'Custodiado',
    currentPrisonUnit: 'Penitenciária Industrial Esmeraldino Bandeira',
    prisonData: {
      status: 'Custodiado',
      currentUnit: 'Penitenciária Industrial Esmeraldino Bandeira',
      wing: 'Galeria B7',
      cell: 'Cela 12',
      admissionDate: '2021-05-18',
      lastMovementDate: '2025-12-09',
      riskLevel: 'Alto',
      factionIndication: 'Comando Vermelho',
      factionRole: 'Integrante',
      custodyHistory: [
        {
          unit: 'Presídio Ary Franco',
          startDate: '2021-05-18',
          endDate: '2022-01-10',
        },
        {
          unit: 'Penitenciária Industrial Esmeraldino Bandeira',
          startDate: '2022-01-11',
          endDate: null,
        },
      ],
    },
    phones: [{ number: '(21) 98888-1001', type: 'Celular' }],
    emails: [],
    addresses: [
      {
        street: 'Rua das Acácias',
        number: '120',
        district: 'Centro',
        city: 'Duque de Caxias',
        uf: 'RJ',
        zipCode: '25000-000',
      },
    ],
    relatedPeople: [
      {
        name: 'Eliane de Almeida',
        relationship: 'Mãe',
        document: '',
        source: 'SIPEN',
      },
      {
        name: 'Antônio Carlos de Almeida',
        relationship: 'Pai',
        document: '',
        source: 'SIPEN',
      },
    ],
  },
  {
    // Carlos Eduardo Nogueira — EX_PRESO (CEN-010)
    id: 'sipen-003-full',
    source: 'SIPEN',
    profileType: 'EX_PRESO',
    fullName: 'Carlos Eduardo Nogueira',
    normalizedName: 'carlos eduardo nogueira',
    uf: 'RJ',
    cpf: '666.777.888-09',
    cpfNormalized: '66677788809',
    rg: '33778899',
    aliases: ['Cadu'],
    birthDate: '1981-06-30',
    age: 44,
    motherName: 'Neuza Nogueira',
    fatherName: 'Eduardo Nogueira',
    birthplace: 'Niterói/RJ',
    photoUrl: photo(2),
    matchType: 'CPF_EXATO',
    confidenceScore: 0.98,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-21T12:45:00Z',
    prisonStatus: 'Egresso',
    currentPrisonUnit: 'Última unidade: Instituto Penal Plácido Sá Carvalho',
    prisonData: {
      status: 'Egresso',
      currentUnit: 'Última unidade: Instituto Penal Plácido Sá Carvalho',
      wing: null,
      cell: null,
      admissionDate: '2015-03-10',
      lastMovementDate: '2023-08-15',
      riskLevel: 'Médio',
      factionIndication: null,
      factionRole: null,
      custodyHistory: [
        {
          unit: 'Presídio Evaristo de Moraes',
          startDate: '2015-03-10',
          endDate: '2018-06-20',
        },
        {
          unit: 'Instituto Penal Plácido Sá Carvalho',
          startDate: '2018-06-21',
          endDate: '2023-08-15',
        },
      ],
    },
    phones: [{ number: '(21) 97222-5001', type: 'Celular' }],
    emails: [],
    addresses: [
      {
        street: 'Rua Gavião Peixoto',
        number: '55',
        district: 'Icaraí',
        city: 'Niterói',
        uf: 'RJ',
        zipCode: '24230-100',
      },
    ],
    relatedPeople: [
      {
        name: 'Neuza Nogueira',
        relationship: 'Mãe',
        document: '',
        source: 'SIPEN',
      },
    ],
  },
  {
    // Luciana Ferreira da Silva — FAMILIAR (CEN-005)
    id: 'sipen-004-full',
    source: 'SIPEN',
    profileType: 'FAMILIAR',
    fullName: 'Luciana Ferreira da Silva',
    normalizedName: 'luciana ferreira da silva',
    uf: 'RJ',
    cpf: '444.555.666-07',
    cpfNormalized: '44455566607',
    rg: '55667788',
    aliases: ['Lu'],
    birthDate: '1992-07-22',
    age: 33,
    motherName: 'Sandra Ferreira',
    fatherName: 'José da Silva',
    birthplace: 'Nova Iguaçu/RJ',
    photoUrl: photo(6),
    matchType: 'CPF_EXATO',
    confidenceScore: 0.95,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-22T08:30:00Z',
    prisonStatus: null,
    currentPrisonUnit: null,
    phones: [{ number: '(21) 99111-4001', type: 'Celular' }],
    emails: [],
    addresses: [
      {
        street: 'Rua Marechal Floriano',
        number: '310',
        district: 'Centro',
        city: 'Nova Iguaçu',
        uf: 'RJ',
        zipCode: '26200-000',
      },
    ],
    relatedPeople: [
      {
        name: 'Sandra Ferreira',
        relationship: 'Mãe',
        document: '',
        source: 'SIPEN',
      },
    ],
  },
];

// ── SNAP Full Profiles ──────────────────────────────────────────────────────

export const SNAP_FULL_PROFILES: FullProfile[] = [
  {
    // Fernanda Cristina Lopes (CEN-004)
    id: 'snap-001-full',
    source: 'SNAP',
    profileType: null,
    fullName: 'Fernanda Cristina Lopes',
    normalizedName: 'fernanda cristina lopes',
    uf: 'SP',
    cpf: '333.444.555-06',
    cpfNormalized: '33344455506',
    rg: '44556677',
    aliases: ['Fê Lopes'],
    birthDate: '1990-03-15',
    age: 36,
    motherName: 'Sueli Cristina Lopes',
    fatherName: 'Paulo Roberto Lopes',
    birthplace: 'São Paulo/SP',
    photoUrl: photo(1),
    matchType: 'CPF_EXATO',
    confidenceScore: 0.96,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-19T09:10:00Z',
    prisonStatus: null,
    currentPrisonUnit: null,
    phones: [
      { number: '(11) 97777-2001', type: 'Celular' },
      { number: '(11) 3555-2010', type: 'Fixo' },
    ],
    emails: [{ email: 'fernanda.lopes.mock@email.com', type: 'Pessoal' }],
    addresses: [
      {
        street: 'Rua das Palmeiras',
        number: '455',
        district: 'Vila Mariana',
        city: 'São Paulo',
        uf: 'SP',
        zipCode: '04000-000',
      },
    ],
    relatedPeople: [
      {
        name: 'Sueli Cristina Lopes',
        relationship: 'Mãe',
        document: '',
        source: 'SNAP',
      },
      {
        name: 'Paulo Roberto Lopes',
        relationship: 'Pai',
        document: '',
        source: 'SNAP',
      },
    ],
  },
  {
    // Luciana Ferreira da Silva via SNAP (CEN-005)
    id: 'snap-003-full',
    source: 'SNAP',
    profileType: null,
    fullName: 'Luciana Ferreira da Silva',
    normalizedName: 'luciana ferreira da silva',
    uf: 'RJ',
    cpf: '444.555.666-07',
    cpfNormalized: '44455566607',
    rg: '55667788',
    aliases: ['Lu'],
    birthDate: '1992-07-22',
    age: 33,
    motherName: 'Sandra Ferreira',
    fatherName: 'José da Silva',
    birthplace: 'Nova Iguaçu/RJ',
    photoUrl: photo(6),
    matchType: 'CPF_EXATO',
    confidenceScore: 0.93,
    confidenceLabel: 'Alta',
    possibleLocalDuplicate: false,
    alreadyRegistered: false,
    localDuplicateId: null,
    profileUrl: null,
    lastUpdatedAt: '2026-03-22T10:15:00Z',
    prisonStatus: null,
    currentPrisonUnit: null,
    phones: [{ number: '(21) 99111-4001', type: 'Celular' }],
    emails: [{ email: 'luciana.mock@email.com', type: 'Pessoal' }],
    addresses: [
      {
        street: 'Rua Marechal Floriano',
        number: '310',
        district: 'Centro',
        city: 'Nova Iguaçu',
        uf: 'RJ',
        zipCode: '26200-000',
      },
    ],
    relatedPeople: [
      {
        name: 'Sandra Ferreira',
        relationship: 'Mãe',
        document: '',
        source: 'SNAP',
      },
      {
        name: 'José da Silva',
        relationship: 'Pai',
        document: '',
        source: 'SNAP',
      },
    ],
  },
];

// ── Status Messages ─────────────────────────────────────────────────────────

export const STATUS_MESSAGES: Record<DataSource | 'CADASTRO', Record<string, string>> = {
  BASE_LOCAL: {
    CONSULTANDO: 'Verificando se a pessoa já existe na base local.',
    CONCLUIDA_SEM_RESULTADOS: 'Nenhuma correspondência encontrada na base local.',
    CONCLUIDA_COM_RESULTADOS:
      'Encontramos possíveis correspondências na base local. Verifique se alguma delas é a pessoa buscada antes de continuar.',
    ERRO: 'Não foi possível consultar a base local no protótipo.',
    IGNORADA_POR_PESSOA_LOCAL:
      'Fluxo de cadastro interrompido porque a pessoa já foi localizada na base local.',
  },
  SIPEN: {
    CONSULTANDO: 'Consultando o SIPEN para localizar possíveis correspondências.',
    CONCLUIDA_SEM_RESULTADOS: 'Nenhuma correspondência encontrada no SIPEN.',
    CONCLUIDA_COM_RESULTADOS:
      'O SIPEN retornou possíveis pessoas correspondentes aos dados informados.',
    ERRO: 'Não foi possível consultar o SIPEN neste momento. Você pode tentar novamente ou avançar para a próxima fonte, quando aplicável.',
    CADASTRO_COMPLETO_EM_ANDAMENTO:
      'Cadastro iniciado. A consulta completa ao SIPEN está em andamento em background. Você será informado quando o cadastro for concluído.',
  },
  SNAP: {
    AGUARDANDO_DADOS_SUFICIENTES:
      'Para consultar o SNAP, informe um CPF válido ou preencha Nome e UF.',
    NAO_APLICAVEL:
      'Consulta SNAP não realizada. Os dados informados são insuficientes para esta fonte.',
    CONSULTANDO: 'Consultando o SNAP para complementar a busca por dados cadastrais.',
    CONCLUIDA_SEM_RESULTADOS: 'Nenhuma correspondência encontrada no SNAP.',
    CONCLUIDA_COM_RESULTADOS:
      'O SNAP retornou possíveis pessoas correspondentes aos dados informados.',
    ERRO: 'Não foi possível consultar o SNAP neste momento.',
    CADASTRO_COMPLETO_EM_ANDAMENTO:
      'Cadastro iniciado. A consulta completa ao SNAP está em andamento em background. Você será informado quando o cadastro for concluído.',
  },
  CADASTRO: {
    CADASTRO_COMPLETO_EM_ANDAMENTO:
      'Cadastro iniciado. A consulta completa está em andamento em background. Você será informado quando o cadastro for concluído.',
    CADASTRO_SIMULADO_CONCLUIDO: 'Cadastro concluído no protótipo com dados da fonte selecionada.',
  },
};

// ── Result Sets ─────────────────────────────────────────────────────────────
// Maps scenario result set names to actual data arrays.
// `null` signals a simulated error (distinct from empty results `[]`).

export const RESULT_SETS: Record<string, PersonMatch[] | null> = {
  // Local result sets
  'local-cpf-found': [LOCAL_PEOPLE[0]],
  'local-homonyms-mg': [LOCAL_PEOPLE[1], LOCAL_PEOPLE[2]],
  'local-empty': [],

  // SIPEN result sets
  'sipen-person-found': [SIPEN_BASIC_RESULTS[0]],
  'sipen-person-found-also-in-snap': [SIPEN_BASIC_RESULTS[3]],
  'sipen-after-local-homonyms': [],
  'sipen-empty': [],
  'sipen-error': null,
  'sipen-multiple-scores': [SIPEN_BASIC_RESULTS[1], SIPEN_BASIC_RESULTS[0]],
  'sipen-prison-profile': [SIPEN_BASIC_RESULTS[2]],

  // SNAP result sets
  'snap-person-found': [SNAP_BASIC_RESULTS[0]],
  'snap-person-found-after-sipen-refused': [SNAP_BASIC_RESULTS[2]],
  'snap-person-found-after-sipen-error': [SNAP_BASIC_RESULTS[0]],
  'snap-after-sipen-empty': [SNAP_BASIC_RESULTS[1]],
  'snap-not-executed-if-sipen-selected': [],
  'snap-multiple-scores': [SNAP_BASIC_RESULTS[1], SNAP_BASIC_RESULTS[0]],
  'snap-empty': [],
};

// ── Lookup Functions ────────────────────────────────────────────────────────

/**
 * Resolve a scenario from the scenario matrix based on normalized form data.
 *
 * Matching priority: CPF → Nome+UF → RG → Vulgo.
 * Returns the first matching scenario, or `null` if no scenario matches.
 */
export function resolveScenario(data: NormalizedFormData): Scenario | null {
  // Priority 1: CPF match
  if (data.cpfNormalized) {
    const cpfMatch = SCENARIO_MATRIX.find((s) => s.trigger['cpfNormalized'] === data.cpfNormalized);
    if (cpfMatch) return cpfMatch;
  }

  // Priority 2: Nome + UF match
  if (data.nomeNormalized && data.uf) {
    const nomeUfMatch = SCENARIO_MATRIX.find(
      (s) =>
        s.trigger['nomeNormalized'] !== undefined &&
        s.trigger['uf'] !== undefined &&
        data.nomeNormalized.includes(s.trigger['nomeNormalized']) &&
        s.trigger['uf'] === data.uf,
    );
    if (nomeUfMatch) return nomeUfMatch;
  }

  // Priority 3: RG match
  if (data.rg) {
    const rgMatch = SCENARIO_MATRIX.find(
      (s) => s.trigger['rg'] !== undefined && s.trigger['rg'] === data.rg,
    );
    if (rgMatch) return rgMatch;
  }

  // Priority 4: Vulgo match
  if (data.vulgo) {
    const vulgoNormalized = data.vulgo.toLowerCase();
    const vulgoMatch = SCENARIO_MATRIX.find(
      (s) =>
        s.trigger['vulgo'] !== undefined && s.trigger['vulgo'].toLowerCase() === vulgoNormalized,
    );
    if (vulgoMatch) return vulgoMatch;
  }

  return null;
}

/**
 * Look up a result set by name.
 *
 * @returns The person match array, `null` for error scenarios, or `null` if the set name is not found.
 */
export function getResultSet(setName: string | null): PersonMatch[] | null {
  if (setName === null || setName === undefined) {
    return null;
  }
  return RESULT_SETS[setName] ?? null;
}

/**
 * Find a full profile by the basic result person ID and data source.
 *
 * Searches SIPEN and SNAP full profile arrays for a profile whose
 * `id` starts with the basic result ID (e.g. `sipen-001` matches `sipen-001-full`).
 *
 * @returns The full profile, or `null` if not found.
 */
export function findFullProfile(personId: string, source: DataSource): FullProfile | null {
  const profiles = source === 'SIPEN' ? SIPEN_FULL_PROFILES : SNAP_FULL_PROFILES;

  return profiles.find((p) => p.id === `${personId}-full`) ?? null;
}
