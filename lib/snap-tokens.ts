/**
 * SNAP Design System - Tokens
 * Arquivo central de tokens para portabilidade
 * 
 * Ecossistema SNAP - Verticais e suas cores primárias:
 * - Investigação: Coral (#FE473C)
 * - Inteligência: Bordô (#72284B)
 * - Cooperação: Grey Ahead (#889EA3)
 * - Infraestrutura: Petroleum Blue (#287266)
 * - Administração: Deep Gray Blue (#333540)
 */

// ===========================================
// CORES DAS VERTICAIS
// ===========================================

export const verticals = {
  investigacao: {
    name: 'Investigação',
    color: 'Coral',
    hex: '#FE473C',
    hover: '#e53d33',
    light: '#ff8a82', // Versão acessível para texto sobre fundo escuro
  },
  inteligencia: {
    name: 'Inteligência',
    color: 'Bordô',
    hex: '#72284B',
    hover: '#5a1f3c',
    light: '#d4789b', // Versão acessível para texto sobre fundo escuro
  },
  cooperacao: {
    name: 'Cooperação',
    color: 'Grey Ahead',
    hex: '#889EA3',
    hover: '#718a8f',
    light: '#b3c4c8', // Versão acessível para texto sobre fundo escuro
  },
  infraestrutura: {
    name: 'Infraestrutura',
    color: 'Petroleum Blue',
    hex: '#287266',
    hover: '#1f5a50',
    light: '#4da89a', // Versão acessível para texto sobre fundo escuro
  },
  administracao: {
    name: 'Administração',
    color: 'Deep Gray Blue',
    hex: '#333540',
    hover: '#252730',
    light: '#6b6e7a', // Versão acessível para texto sobre fundo escuro
  },
} as const

// Vertical ativa atual (pode ser alterada conforme o contexto)
export const activeVertical = verticals.inteligencia

// ===========================================
// ÁREAS AGNÓSTICAS DO ECOSSISTEMA SNAP
// ===========================================

/**
 * SNAP Graph - Aplicativo de visualização e manipulação de grafos
 * Área agnóstica de vertical, usa cor neutra (#696969)
 */
export const snapGraph = {
  name: 'SNAP Graph',
  description: 'Aplicativo de busca e visualização de entidades em grafo',
  
  // Cor primária (neutra, agnóstica de vertical)
  color: {
    primary: '#696969',
    primaryLight: '#8a8a8a',
    primaryDark: '#4d4d4d',
  },
  
  // Assets
  assets: {
    logo: '/assets/snap-graph-logo.svg',
    logoMain: '/assets/snap-logo.svg',
  },

  // Background do canvas
  canvas: {
    background: '#0a0a0a',
    gridTile: '/assets/snap-graph-grid.png', // Bitmap tiling pattern
  },

  // Header
  header: {
    height: '56px',
    background: 'transparent',
    breadcrumbGap: '8px',
    breadcrumbColor: '#696969',
    breadcrumbActiveColor: '#ffffff',
  },

  // Nós de entidade (Entity Nodes)
  entityNode: {
    background: '#2c2c2c',
    borderRadius: '8px',
    accentWidth: '4px', // Barra de destaque à esquerda
    padding: '12px',
    minWidth: '180px',
    
    // Ícone circular
    icon: {
      size: '44px',
      strokeWidth: '2px',
      strokeColor: '#696969',
      background: 'transparent',
    },

    // Tipografia
    name: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    subtitle: {
      fontSize: '12px',
      color: '#8a8a8a',
    },
  },

  // Linhas de conexão (Edges)
  edges: {
    strokeWidth: '2px',
    strokeColor: '#454545',
    arrowSize: '8px',
    
    // REGRA IMPORTANTE: Roteamento ortogonal
    routing: {
      type: 'orthogonal', // NUNCA diagonal
      avoidOverlap: true, // NUNCA passar por cima de elementos
      waypointsEnabled: true, // Pontos de mudança de direção
    },
  },

  // Labels de categoria (fontes de dados)
  categoryLabels: {
    borderRadius: '4px',
    paddingX: '8px',
    paddingY: '2px',
    fontSize: '11px',
    fontWeight: '500',
    
    // Cores por tipo de fonte
    sources: {
      'Company SNAP': {
        background: '#72284B',
        text: '#ffffff',
        description: 'Empresa cadastrada no SNAP',
      },
      'Person SNAP': {
        background: '#72284B',
        text: '#ffffff',
        description: 'Pessoa física cadastrada no SNAP',
      },
      'TrueCallerID': {
        background: '#287266',
        text: '#ffffff',
        description: 'Telefone identificado via TrueCaller',
      },
      'Receita Federal': {
        background: '#FE473C',
        text: '#ffffff',
        description: 'Dados da Receita Federal',
      },
      'DETRAN': {
        background: '#889EA3',
        text: '#000000',
        description: 'Dados do DETRAN',
      },
      'INFOSEG': {
        background: '#ff9800',
        text: '#000000',
        description: 'Base INFOSEG',
      },
      'Manual': {
        background: '#333540',
        text: '#ffffff',
        description: 'Cadastro manual',
      },
    },
  },

  // Botão pequeno (32px)
  buttonSmall: {
    height: '32px',
    borderRadius: '6px',
    paddingX: '16px',
    fontSize: '13px',
  },
} as const

// ===========================================
// CORES GERAIS
// ===========================================

export const colors = {
  // Cor primária (herdada da vertical ativa)
  primary: {
    DEFAULT: activeVertical.hex,
    hover: activeVertical.hover,
    light: activeVertical.light,
  },

  // Backgrounds
  background: {
    page: '#0f0f10',
    card: '#0f0f10',
    surface: '#1a1a1a',
    elevated: '#222222',
    input: '#000000',
    highlight: '#2a2b35', // Área de destaque
  },

  // Bordas
  border: {
    DEFAULT: '#2a2b35',
    subtle: '#222222',
  },

  // Texto
  text: {
    primary: '#ffffff',
    secondary: '#b1b3c2',
    muted: '#898c9d',
    disabled: '#676c70',
  },

  // Status e Feedback
  status: {
    error: '#fe473c',
    warning: '#ff9800',
    warningLight: '#ffc563',
    success: '#3f9f76',
    info: '#00bcd4',
  },

  // Cores de entidades (para links por tipo)
  entity: {
    pessoa: {
      text: '#d4789b',
      bg: 'rgba(114, 40, 75, 0.25)',
    },
    endereco: {
      text: '#f0c048',
      bg: 'rgba(212, 160, 23, 0.2)',
    },
    veiculo: {
      text: '#4dd4e8',
      bg: 'rgba(0, 188, 212, 0.2)',
    },
    empresa: {
      text: '#4dd4e8',
      bg: 'rgba(0, 188, 212, 0.2)',
    },
  },

  // Níveis de Risco
  risk: {
    critical: { bg: '#fe473c', text: '#ffffff' },
    high: { bg: '#ff9800', text: '#000000' }, // Texto preto para WCAG
    medium: { bg: '#ffc563', text: '#000000' }, // Texto preto para WCAG
    low: { bg: '#3f9f76', text: '#ffffff' },
  },
} as const

// ===========================================
// TIPOGRAFIA
// ===========================================

export const typography = {
  // Fontes
  fonts: {
    title: 'var(--font-title)', // Cygnito Mono
    body: 'var(--font-sans)', // Inter Tight
  },

  // Tamanhos
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
  },

  // Regras de uso
  rules: {
    // Títulos de Modal: Cygnito, 18px, UPPERCASE
    modalTitle: {
      font: 'title',
      size: '18px',
      transform: 'uppercase',
    },
    // Títulos de Card: Inter, 18px, capitalize
    cardTitle: {
      font: 'body',
      size: '18px',
      transform: 'capitalize',
      weight: '500',
    },
    // Títulos de Seção: Cygnito, 24px+, UPPERCASE
    sectionTitle: {
      font: 'title',
      size: '24px',
      transform: 'uppercase',
    },
  },
} as const

// ===========================================
// ESPAÇAMENTOS
// ===========================================

export const spacing = {
  // Base (4px grid)
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  9: '36px',
  10: '40px',

  // Específicos do Design System
  buttonGap: '16px', // Gap mínimo entre botões
  modalPadding: '24px',
  cardPadding: '20px',
  
  // Margens de botões
  modal: {
    buttonMargin: '36px', // mb-9
  },
  card: {
    buttonMargin: '24px', // mb-6
    headerPaddingTop: '16px',
    headerPaddingBottom: '12px',
    separatorMarginX: '20px',
  },
} as const

// ===========================================
// BORDAS
// ===========================================

export const borders = {
  radius: {
    sm: '4px',
    DEFAULT: '6px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  width: {
    DEFAULT: '1px',
  },
} as const

// ===========================================
// COMPONENTES - Configurações específicas
// ===========================================

export const components = {
  // Botões
  button: {
    width: '130px', // Largura padrão em modais
    widthCompact: '110px', // Largura em cards
    height: '40px',
    heightSmall: '32px', // Botão pequeno (SNAP Graph header, etc.)
    gap: '16px', // Entre botões
    borderRadius: '6px',
    fontSize: {
      modal: '14px',
      card: '12px',
      small: '13px', // Para botões de 32px
    },
  },

  // Modal
  modal: {
    maxWidth: '448px', // max-w-md
    borderRadius: '12px',
    headerSeparator: 'full-width',
    buttonAlign: 'right',
  },

  // Card
  card: {
    width: '340px',
    borderRadius: '12px',
    headerSeparator: 'with-margin', // mx-5
    buttonAlign: 'left',
  },

  // Tabs
  tabs: {
    underlineHeight: '8px',
    gap: '24px',
    paddingBottom: '20px',
  },

  // Badge
  badge: {
    paddingX: '12px',
    paddingY: '4px',
    borderRadius: {
      pill: '9999px', // Para badges de risco
      squared: '6px', // Para tags
    },
    fontSize: '12px',
  },

  // Select (Accordion Style)
  select: {
    borderRadius: '8px',
    maxHeight: '160px',
    animationDuration: '200ms',
  },
} as const

// ===========================================
// ANIMAÇÕES
// ===========================================

export const animations = {
  duration: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
  },
  easing: {
    DEFAULT: 'ease-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// ===========================================
// ACESSIBILIDADE (WCAG)
// ===========================================

export const wcag = {
  // Contraste mínimo
  contrast: {
    normal: 4.5, // AA para texto normal
    large: 3, // AA para texto grande (18px+)
  },
  
  // Guia de cores de texto para badges
  textColor: {
    // Usar texto BRANCO nestas cores de fundo
    white: ['#fe473c', '#72284b', '#3f9f76'],
    // Usar texto PRETO nestas cores de fundo
    black: ['#ff9800', '#ffc563', '#00bcd4'],
  },
} as const

// ===========================================
// EXPORT COMPLETO
// ===========================================

export const snapTokens = {
  verticals,
  activeVertical,
  snapGraph,
  colors,
  typography,
  spacing,
  borders,
  components,
  animations,
  wcag,
} as const

export type SnapTokens = typeof snapTokens
export type Vertical = keyof typeof verticals
export type SnapGraphCategoryLabel = keyof typeof snapGraph.categoryLabels.sources
