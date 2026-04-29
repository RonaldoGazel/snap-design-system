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
    gap: '16px', // Entre botões
    borderRadius: '6px',
    fontSize: {
      modal: '14px',
      card: '12px',
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
