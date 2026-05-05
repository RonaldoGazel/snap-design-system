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
    width: '256px', // Largura fixa OBRIGATÓRIA
    // Altura: automática (cresce conforme conteúdo)
    background: '#2c2c2c',
    borderRadius: '8px',
    accentWidth: '4px', // Barra de destaque à esquerda
    padding: '16px', // REGRA: padding interno de 16px
    gapNameToLabel: '16px', // REGRA: gap entre nome e label de 16px
    
    // Ícone circular (à direita) - POSIÇÃO FIXA
    icon: {
      size: '44px',
      strokeWidth: '3px', // REGRA: stroke de 3px para melhor visibilidade
      strokeColor: '#696969',
      background: 'transparent', // Sem preenchimento, só stroke
      position: 'fixed-right', // REGRA: ícone SEMPRE no canto superior direito, não se move
      // Para Person: usar foto/thumbnail ao invés de ícone
    },

    // Tipografia do nome
    name: {
      fontSize: '16px', // REGRA: 16px
      fontWeight: '500',
      color: '#ffffff',
      lineHeight: '1.3',
      maxLines: 2, // REGRA: máximo 2 linhas, mesmo estilo
      overflow: 'ellipsis', // Reticências se não couber
      wordBreak: 'break-word', // REGRA: quebra palavras longas (emails, URLs) automaticamente
      showTooltip: true, // Mostrar hint com nome completo no hover
    },
    // NOTA: NÃO há subtítulo separado - o nome ocupa até 2 linhas
    // NOTA: O texto DEVE quebrar automaticamente, o ícone NÃO pode mudar de posição
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

  // Labels de categoria de entidade
  // Segue o padrão de badges/tags do design system (border-radius grande)
  // Paleta própria com cores menos saturadas (não conflita com verticais)
  categoryLabels: {
    borderRadius: '12px', // REGRA: Tags e badges sempre usam border-radius 12px
    paddingX: '10px',
    paddingY: '4px',
    fontSize: '11px',
    fontWeight: '500',
    
    // Cores por categoria/fonte de dados (tons dessaturados)
    sources: {
      'Company SNAP': {
        background: '#4a5568', // Cinza azulado
        text: '#e2e8f0',
        accent: '#7c8db0', // Para barra lateral do node
        description: 'Empresa cadastrada no SNAP',
      },
      'Person SNAP': {
        background: '#5c4a6b', // Roxo dessaturado
        text: '#e8e0f0',
        accent: '#9b7fb8', // Para barra lateral do node
        description: 'Pessoa física cadastrada no SNAP',
      },
      'TrueCallerID': {
        background: '#3d5a58', // Verde-azulado dessaturado
        text: '#d8ebe9',
        accent: '#6b9490', // Para barra lateral do node
        description: 'Telefone identificado via TrueCaller',
      },
      'Receita Federal': {
        background: '#6b4a4a', // Vermelho dessaturado
        text: '#f0e0e0',
        accent: '#a87070', // Para barra lateral do node
        description: 'Dados da Receita Federal',
      },
      'DETRAN': {
        background: '#4a5a60', // Cinza esverdeado
        text: '#e0e8eb',
        accent: '#7a9098', // Para barra lateral do node
        description: 'Dados do DETRAN',
      },
      'INFOSEG': {
        background: '#605540', // Âmbar dessaturado
        text: '#f0e8d8',
        accent: '#a89870', // Para barra lateral do node
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

  // Sidebar (Menu Principal)
  sidebar: {
    width: '64px',
    height: '144px',
    padding: '20px',
    borderRadius: '12px',
    gapBetweenIcons: '24px',
    marginFromEdge: '32px', // Margem das bordas da tela
    
    icons: {
      eye: { width: '25px', height: '20px' }, // Recomendações
      plus: { width: '22px', height: '22px' }, // Adicionar
      sliders: { width: '22px', height: '21px' }, // Configurações
      color: '#ffffff',
      colorInactive: '#696969',
      hoverOpacity: '0.8',
    },
    
    // Badge numérico (notificações)
    badge: {
      size: '32px',
      fontSize: '14px',
      fontWeight: '700',
      color: '#ffffff',
      // backgroundColor: cor da vertical ativa
      positionTop: '-20px',
      positionRight: '-18px',
      maxDisplay: '99+', // Se maior que 99
    },
  },

  // Zoom Controls (Controles de Navegação)
  zoomControls: {
    width: '64px', // Mesma largura da sidebar para alinhamento
    gapFromSidebar: '36px', // Distância vertical da sidebar
    gapBetweenIcons: '24px',
    
    icons: {
      size: '20px',
      color: '#696969',
      colorHover: '#ffffff',
    },
  },

  // Painel de Recomendações
  recommendationsPanel: {
    width: '451px',
    borderRadius: '12px',
    marginFromEdge: '32px', // Margem das bordas da tela
    padding: '24px',
    
    // Header
    header: {
      gapIconText: '16px',
      icon: { width: '24px', height: '18.45px' },
      titleFontSize: '18px',
    },
    
    // Itens accordion
    accordion: {
      gapBetweenItems: '8px',
      borderRadius: '8px',
      
      // Badge numérico pequeno (22x22) - padrão menor
      badgeSmall: {
        size: '22px',
        fontSize: '11px',
        fontWeight: '600',
        background: '#2a2b35',
        color: '#ffffff',
      },
      
      // Ícone de tipo (pessoa/empresa)
      typeIcon: { width: '22px', height: '15.37px' },
      
      // Backgrounds
      background: {
        collapsed: '#1e2122',
        expanded: '#16191A',
        itemHover: '#373c3f',
      },
    },
    
    // Ações dentro do accordion expandido
    actions: {
      gap: '15px',
      playIcon: {
        size: '24px',
        color: '#00FF73', // Accent verde (novo token)
      },
      deleteIcon: {
        width: '16px',
        height: '18px',
        color: '#5D5B5B',
        colorHover: '#ff6b6b',
      },
    },
  },

  // Cores de Accent (novas)
  accent: {
    green: '#00FF73', // Super accent - ações positivas/play
    greenHover: '#00cc5c',
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

  // Badges e Tags (REGRA GLOBAL)
  // Sempre usam border-radius grande (12px)
  badge: {
    borderRadius: '12px', // OBRIGATÓRIO para todos badges/tags
    paddingX: '10px',
    paddingY: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },

  // Tabs
  tabs: {
    underlineHeight: '8px',
    gap: '24px',
    paddingBottom: '20px',
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
