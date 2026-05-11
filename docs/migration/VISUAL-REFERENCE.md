# SNAP Design System - Referência Visual para Angular

Este documento serve como guia visual para implementar os componentes SNAP em Angular.
Todas as medidas são EXATAS do Figma e devem ser respeitadas.

---

## Indice

1. [Layout Global](#1-layout-global)
2. [Header Global](#2-header-global)
3. [Sidebar](#3-sidebar)
4. [Componentes Base](#4-componentes-base)
5. [Tela: Listagem de Usuarios](#5-tela-listagem-de-usuarios)
6. [Tela: Detalhe do Usuario](#6-tela-detalhe-do-usuario)
7. [Modais](#7-modais)
8. [Cores e Verticais](#8-cores-e-verticais)

---

## 1. Layout Global

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER (SnapHeader)                             │
│  ┌──────┐ ┌──────┐     ┌────────────────────────┐    🔔  ☀️  │  Nome  (VD) │
│  │ :::  │ │ SNAP │  |  │ Breadcrumb > Path      │                           │
│  └──────┘ └──────┘     └────────────────────────┘                           │
│  ═══════════════════════════════════════════════════════════════════════════│ ← Faixa colorida 8px
├──────┬──────────────────────────────────────────────────────────────────────┤
│      │                                                                      │
│  S   │                         CONTEUDO                                     │
│  I   │                                                                      │
│  D   │                    (py-8 pr-8 ml-147px)                              │
│  E   │                                                                      │
│  B   │                                                                      │
│  A   │                                                                      │
│  R   │                                                                      │
│      │                                                                      │
└──────┴──────────────────────────────────────────────────────────────────────┘
```

### Especificacoes de Layout

| Elemento | Medida | CSS/SCSS |
|----------|--------|----------|
| Margem esquerda sidebar | 32px | `margin-left: 32px` |
| Largura sidebar fechada | 64px | `width: 64px` |
| Largura sidebar aberta | 280px | `width: 280px` |
| Gap sidebar → conteudo | 51px | `margin-left: 51px` |
| Margem total conteudo | 147px | `margin-left: 147px` (32+64+51) |
| Padding vertical conteudo | 32px | `padding: 32px 0` |
| Padding direita conteudo | 32px | `padding-right: 32px` |

---

## 2. Header Global

### Estrutura Visual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                  26px top   │
│  ┌──────┐           ┌──────┐     │     ┌─────────────────────┐              │
│  │ :::  │   70px    │ SNAP │ 24px│24px │ 🏠 Vertical > Page  │     ...      │
│  └──────┘ ─────────>└──────┘<────┤────>└─────────────────────┘              │
│   51px                                                                      │
│   left                                                          24px bottom │
├─────────────────────────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████████████████████████████████│ ← 8px faixa colorida
│                                                                             │
│ ^144px margem esquerda                                   32px margem direita│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Lado Direito do Header

```
    🔔        ☀️       │        Nome Completo        ┌────┐
   (35)                │        Role/Cargo           │ VD │
    │   32px   │  32px │   32px   │                  └────┘
    └──────────┴───────┴──────────┘                  Avatar
                                                     32x32px
```

### Especificacoes do Header

| Elemento | Medida | Descricao |
|----------|--------|-----------|
| Padding top header | 26px | Compensacao para margem visual de 32px |
| Margem bottom (ate faixa) | 24px | Gap entre elementos e faixa |
| Icone menu verticais | 24x24px | Grid 3x3 de circulos |
| Margem esquerda icone | 51px | Alinhado com sidebar |
| Gap icone → logo | 70px | Espaco entre grid e logo SNAP |
| Altura logo SNAP | 24px | Proporcional |
| Separador vertical | 1x24px | Entre logo e breadcrumb |
| Gaps separadores | 24px | Ambos os lados |
| Faixa colorida | 8px altura | Cor da vertical ativa |
| Margem esquerda faixa | 144px | Alinhada com logo |
| Margem direita faixa | 32px | Ate borda direita |

### Badge de Notificacao

```scss
.header__notification-badge {
  position: absolute;
  top: -6px;
  right: -12px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  font-size: 10px;
  padding: 0 4px;
  background-color: var(--snap-vertical-color);
  color: white;
}
```

### Avatar Header

| Propriedade | Valor |
|-------------|-------|
| Tamanho | 32x32px |
| Border-radius | 50% (circular) |
| Background | Cor da vertical |
| Texto | Iniciais, branco, bold, 12px |

---

## 3. Sidebar

### Estados

```
FECHADA (64px)          ABERTA (280px)
┌──────────┐            ┌──────────────────────────────┐
│          │            │                              │
│   🔍     │            │   🔍  Inteligencia        ∨  │
│          │            │        ├ Pessoas             │
│   🏠     │  ← ativa   │        ├ Documentos          │
│          │            │        └ Analises            │
│   📁     │            │                              │
│          │            │   🏠  Administracao       ∨  │ ← ativa
│   🤝     │            │        ├ Usuarios   ←        │
│          │            │        ├ Grupos              │
│   ⚙️     │            │        └ Papeis              │
│          │            │                              │
├──────────┤            ├──────────────────────────────┤
│   ⚙️     │            │   ⚙️  Configuracoes         │
└──────────┘            └──────────────────────────────┘
```

### Especificacoes da Sidebar

| Elemento | Medida | Descricao |
|----------|--------|-----------|
| Largura fechada | 64px | Apenas icones |
| Largura aberta | 280px | Icones + texto |
| Margem esquerda | 32px | Da borda da tela |
| Background | #0F0F10 | Escuro no dark mode |
| Border | 1px #2A2B35 | Borda sutil |
| Border-radius | 12px | Cantos arredondados |
| Shadow (aberta) | 4px 0 24px rgba(0,0,0,0.5) | Sombra lateral |

### Cores de Estado

| Estado | Cor |
|--------|-----|
| Icone idle | #717171 |
| Icone ativo | Cor da vertical |
| Item selecionado BG | Cor da vertical |
| Item selecionado texto | #FFFFFF |
| Hover | rgba(255,255,255,0.05) |

---

## 4. Componentes Base

### 4.1 SnapButton

```
┌─────────────────────────────┐
│  [icon]         Texto       │
│    ↑              ↑         │
│  esquerda    direita        │
│         gap-12px            │
└─────────────────────────────┘
       border-radius: 6px
```

#### Variantes

| Variante | Background | Border | Texto | Uso |
|----------|------------|--------|-------|-----|
| `primary` | #72284B | none | white | Acao principal |
| `secondary` | transparent | #border | foreground | Cancelar |
| `outline` | transparent | custom | custom | Acoes coloridas |
| `destructive` | #FE473C | none | white | Excluir |
| `success` | #3F9F76 | none | white | Confirmar |
| `ghost` | transparent | none | #B1B3C2 | Discreto |

#### Tamanhos

| Size | min-width | padding | font-size | border-radius |
|------|-----------|---------|-----------|---------------|
| `modal` | 130px | 16px 8px | 14px | 6px |
| `card` | 110px | 12px 8px | 12px | 6px |
| `default` | 130px | 16px 8px | 14px | 6px |
| `sm` | 110px | 12px 6px | 12px | 6px |
| `lg` | auto | 24px 12px | 16px | 8px |
| `icon` | 40px | 0 | - | 6px |

#### Regras de Texto

- **NUNCA** usar UPPERCASE nos botoes
- Usar capitalizacao normal: "Cancelar", "Criar Usuario"
- Fonte: font-sans (Inter Tight) + font-bold

### 4.2 SnapSelect

```
FECHADO:
┌───────────────────────────────────┐
│  Valor selecionado             >  │
└───────────────────────────────────┘

ABERTO:
┌───────────────────────────────────┐
│  Valor selecionado             v  │  ← rotacao 90°
├───────────────────────────────────┤
│  Opcao 1                          │
│  Opcao 2  ← selecionada (bg)      │
│  Opcao 3                          │
│  (max-height: 160px, scroll)      │
└───────────────────────────────────┘
```

#### Especificacoes

| Elemento | Valor |
|----------|-------|
| Border-radius | 8px |
| Padding trigger | 16px 12px |
| Background | muted / #000 (dark) |
| Border | 1px border-color |
| Chevron | 16x16px, rotacao 90° ao abrir |
| Max-height dropdown | 160px |
| Animacao | 200ms ease-out |

### 4.3 SnapModal

```
┌─────────────────────────────────────────────────┐
│  [icon]  TITULO EM UPPERCASE                 ✕  │
├─────────────────────────────────────────────────┤  ← linha separadora
│                                                 │
│  Conteudo do modal                              │
│                                                 │
│                                                 │
│                    ┌─────────┐  ┌─────────────┐ │
│                    │ Acao    │  │  Cancelar   │ │  ← alinhados a direita
│                    └─────────┘  └─────────────┘ │
│                         gap-16px                │
└─────────────────────────────────────────────────┘
```

#### Tamanhos do Modal

| Size | max-width | Uso |
|------|-----------|-----|
| `sm` | 384px | Confirmacoes simples |
| `md` | 448px | Formularios pequenos |
| `lg` | 640px | Formularios medios |
| `xl` | 768px | Formularios grandes |
| `2xl` | 896px | Formularios complexos (2 colunas) |

#### Especificacoes

| Elemento | Valor |
|----------|-------|
| Border-radius | 12px |
| Background | card-bg |
| Border | 1px border-color |
| Overlay | #000000 80% opacidade |
| Z-index overlay | 100 |
| Padding header | 24px 16px |
| Padding content | 24px |
| Gap botoes | 16px |
| Margin-top footer | 36px (quando withTopMargin) |

#### Header do Modal

| Elemento | Valor |
|----------|-------|
| Icone | 20x20px, cor primary |
| Gap icone-titulo | 12px |
| Titulo | font-title, 18px, UPPERCASE |
| Botao fechar | 20x20px, hover:bg-muted |
| Linha separadora | 1px, full-width |

---

## 5. Tela: Listagem de Usuarios

### Layout Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              [HEADER]                                        │
├──────┬──────────────────────────────────────────────────────────────────────┤
│      │  ┌─────────────────────────────────────────────────────────────────┐ │
│  S   │  │  USUARIOS                              [Status ▼] [+ Novo]      │ │
│  I   │  └─────────────────────────────────────────────────────────────────┘ │
│  D   │                                                                      │
│  E   │  ┌─────────────────────────────────────────────────────────────────┐ │
│  B   │  │  Visibilidade  Email              Criado em      Atualiz.  Acoes│ │
│  A   │  ├─────────────────────────────────────────────────────────────────┤ │
│  R   │  │  🏢 Public     admin@snap.local   May 7, 2:17PM  May 7...  👁✏🗑│ │
│      │  │  🏢 Restricted maria@snap.local   May 7, 2:18PM  May 7...  👁✏🗑│ │
│      │  │  ...                                                            │ │
│      │  └─────────────────────────────────────────────────────────────────┘ │
└──────┴──────────────────────────────────────────────────────────────────────┘
```

### Header da Listagem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USUARIOS                                          [Status ▼]  [+ Novo]     │
│  ^                                                 ^            ^           │
│  font-title 24px UPPERCASE                      dropdown    botao primary   │
│                                                 outline     #333540         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tabela de Usuarios

#### Colunas

| Coluna | Largura | Alinhamento | Conteudo |
|--------|---------|-------------|----------|
| Visibilidade | auto | left | Badge colorido |
| Email | flex | left | email@domain |
| Criado em | 160px | left | Data formatada |
| Atualizado em | 160px | left | Data formatada |
| Acoes | 100px | right | Icones |

#### Badges de Visibilidade

| Tipo | Background | Texto |
|------|------------|-------|
| Public | #3F9F76 20% | #3F9F76 |
| Restricted | #F59E0B 20% | #F59E0B |
| Confidential | #EF4444 20% | #EF4444 |

#### Acoes da Tabela

```
[👁]  [✏️]  [🗑️]
 │     │     │
 │     │     └── Excluir (hover: vermelho)
 │     └──────── Editar (hover: azul)
 └────────────── Visualizar (hover: cinza)

Tamanho icones: 16x16px
Gap entre icones: 8px
```

---

## 6. Tela: Detalhe do Usuario

### Layout Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              [HEADER]                                        │
├──────┬──────────────────────────────────────────────────────────────────────┤
│      │                                                                      │
│  S   │  [←] DETALHE DO USUARIO                                              │
│  I   │   ^                                                                  │
│  D   │   botao circular 32x32                                               │
│  E   │                                                                      │
│  B   │  ┌─────────────────────────────────────────────────────────────────┐ │
│  A   │  │ CARD PRINCIPAL (ver detalhe abaixo)                             │ │
│  R   │  └─────────────────────────────────────────────────────────────────┘ │
│      │                                                                      │
│      │  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────┐  │
│      │  │ [✏️] Editar          │  │ [🔑] Redefinir Senha │  │ [⛔] Des..│  │
│      │  └──────────────────────┘  └──────────────────────┘  └───────────┘  │
│      │                                                                      │
│      │  ┌──────────────────────┐  ┌──────────────────────┐                  │
│      │  │ [🔒] Bloquear        │  │ [🗑️] Excluir         │ ← botao solid   │
│      │  └──────────────────────┘  └──────────────────────┘   vermelho       │
│      │                                                                      │
└──────┴──────────────────────────────────────────────────────────────────────┘
```

### Botao Voltar Circular

```
┌────────────────┐
│     ┌────┐     │
│     │ <  │     │  32x32px
│     └────┘     │  border: 1px
│                │  border-radius: 50%
└────────────────┘  icone: ChevronLeft 20x20px
```

### Card de Detalhe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────┐  Nome Completo      │  [Ativo]   │  Nivel  │  Versao │  ID Auth  │
│  │  VD  │  email@domain.com   │   verde    │    1    │    1    │  ac49... 📋│
│  │ 88px │                     │            │   ^     │    ^    │           │
│  └──────┘                     │            │  24px   │   24px  │           │
│     ^                         │            │         │         │           │
│   avatar                      │  separadores verticais 64px altura         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Organizacao        📋   │   Criado em            │   Atualizado em         │
│  96c84e31-xxx-...        │   🕐 May 7, 2:17 PM    │   🕐 May 7, 2:19 PM     │
│                          │                        │                         │
│        separadores verticais 48px altura                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Especificacoes do Card

| Elemento | Valor |
|----------|-------|
| Background | card / #141414 (dark) |
| Border | 1px border-color |
| Border-radius | 12px |
| Padding | 24px |

#### Avatar Grande

| Propriedade | Valor |
|-------------|-------|
| Tamanho | 88x88px |
| Border-radius | 50% |
| Background | muted / #0a0a0a |
| Border | 1px border-color |
| Texto | font-title, 24px, iniciais |

#### Badge de Status

```scss
.user-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  
  &--active {
    background-color: #22c55e;
    color: white;
    
    &::before {
      content: '';
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      margin-right: 8px;
    }
  }
  
  &--inactive {
    background-color: #ef4444;
    color: white;
  }
}
```

### Barra de Acoes

```
┌───────────────┐ ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ ✏️ Editar     │ │ 🔑 Redefinir    │ │ ⛔ Desativar│ │ 🔒 Bloquear │ │ 🗑️ Excluir  │
│   outline     │ │    Senha        │ │   warning   │ │    pink     │ │   SOLID     │
│   default     │ │   info/azul     │ │   amarelo   │ │   #d4789b   │ │   vermelho  │
└───────────────┘ └─────────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                                                                       ^
                                                                    UNICO solid
                                                                    (acao critica)
```

#### Cores dos Botoes de Acao

| Acao | Variante | Border/BG | Texto |
|------|----------|-----------|-------|
| Editar | outline | border-color | foreground |
| Redefinir Senha | outline | #3B82F6 | #3B82F6 |
| Desativar | outline | #F59E0B | #F59E0B |
| Bloquear | outline | #D4789B | #D4789B |
| Excluir | solid | #EF4444 | white |

---

## 7. Modais

### 7.1 Modal Editar Usuario

```
┌─────────────────────────────────────────────────┐
│  [✏️]  EDITAR USUARIO                        ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Email                                          │
│  ┌───────────────────────────────────────────┐  │
│  │ usuario@email.com                         │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Nome de Exibicao                               │
│  ┌───────────────────────────────────────────┐  │
│  │ Nome Completo                             │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Nivel de Acesso                                │
│  ┌───────────────────────────────────────────┐  │
│  │ Restrito                               >  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│                    ┌──────────┐ ┌────────────┐  │
│                    │ ✓ Salvar │ │ ✕ Cancelar │  │
│                    └──────────┘ └────────────┘  │
└─────────────────────────────────────────────────┘
```

### 7.2 Modal Redefinir Senha

```
┌─────────────────────────────────────────────────┐
│  [🔑]  REDEFINIR SENHA                       ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Nova Senha                                     │
│  ┌───────────────────────────────────────────┐  │
│  │ ••••••••••                                │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Esta acao sera registrada no log de auditoria  │
│  ^                                              │
│  text-muted, 14px                               │
│                                                 │
│                 ┌────────────┐ ┌────────────┐   │
│                 │ ✓ Redefinir│ │ ✕ Cancelar │   │
│                 └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────┘
```

### 7.3 Modal Desativar Usuario

```
┌─────────────────────────────────────────────────┐
│  [⛔]  DESATIVAR USUARIO                     ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tem certeza que deseja desativar este usuario? │
│  ^                                              │
│  text-foreground, 16px                          │
│                                                 │
│  Esta acao sera registrada no log de auditoria  │
│  ^                                              │
│  text-muted, 14px                               │
│                                                 │
│               ┌──────────────┐ ┌────────────┐   │
│               │ ⛔ Desativar │ │ ✕ Cancelar │   │
│               └──────────────┘ └────────────┘   │
│                 ^                               │
│               bg-warning text-black             │
│               (amarelo com texto preto          │
│                para contraste WCAG)             │
└─────────────────────────────────────────────────┘
```

### 7.4 Modal Bloquear Usuario

```
┌─────────────────────────────────────────────────┐
│  [🔒]  BLOQUEAR USUARIO                      ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tem certeza que deseja bloquear este usuario?  │
│                                                 │
│  Esta acao sera registrada no log de auditoria  │
│                                                 │
│                ┌────────────┐ ┌────────────┐    │
│                │ 🔒 Bloquear│ │ ✕ Cancelar │    │
│                └────────────┘ └────────────┘    │
│                  ^                              │
│                bg-[#d4789b] text-white          │
└─────────────────────────────────────────────────┘
```

### 7.5 Modal Excluir Usuario

```
┌─────────────────────────────────────────────────┐
│  [🗑️]  EXCLUIR USUARIO                       ✕  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tem certeza que deseja excluir este usuario?   │
│                                                 │
│  Esta acao e irreversivel. O usuario sera       │
│  removido permanentemente. Esta acao sera       │
│  registrada no log de auditoria.                │
│  ^                                              │
│  AVISO MAIS FORTE para acao destrutiva          │
│                                                 │
│                 ┌───────────┐ ┌────────────┐    │
│                 │ 🗑️ Excluir│ │ ✕ Cancelar │    │
│                 └───────────┘ └────────────┘    │
│                   ^                             │
│                 bg-error text-white             │
└─────────────────────────────────────────────────┘
```

### 7.6 Modal Criar Usuario (2 colunas)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [👤+]  CRIAR USUARIO                                                    ✕  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │ 👤 IDENTIFICACAO            │    │ 🔒 SEGURANCA                        │ │
│  │ ─────────────────────────── │    │ ───────────────────────────────────│ │
│  │                             │    │                                     │ │
│  │ Nome de Usuario *           │    │ Senha *                         👁  │ │
│  │ ┌─────────────────────────┐ │    │ ┌─────────────────────────────────┐ │ │
│  │ │                         │ │    │ │ ••••••••                        │ │ │
│  │ └─────────────────────────┘ │    │ └─────────────────────────────────┘ │ │
│  │                             │    └─────────────────────────────────────┘ │
│  │ Nome de Exibicao *          │                                            │
│  │ ┌─────────────────────────┐ │    ┌─────────────────────────────────────┐ │
│  │ │                         │ │    │ 🛡️ ACESSO                           │ │
│  │ └─────────────────────────┘ │    │ ───────────────────────────────────│ │
│  │                             │    │                                     │ │
│  │ Email *                     │    │ Nivel de Acesso    Papel *          │ │
│  │ ┌─────────────────────────┐ │    │ ┌──────────────┐ ┌────────────────┐ │ │
│  │ │                         │ │    │ │ Publico    > │ │ Selecione... > │ │ │
│  │ └─────────────────────────┘ │    │ └──────────────┘ └────────────────┘ │ │
│  │                             │    │                                     │ │
│  └─────────────────────────────┘    │ Grupo *                             │ │
│                                     │ ┌─────────────────────────────────┐ │ │
│                                     │ │ Selecione um grupo            > │ │ │
│                                     │ └─────────────────────────────────┘ │ │
│                                     └─────────────────────────────────────┘ │
│                                                                             │
│                                            ┌──────────┐ ┌────────────┐      │
│                                            │ ✓ Criar  │ │ ✕ Cancelar │      │
│                                            └──────────┘ └────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Secoes com Icones

| Secao | Icone | Campos |
|-------|-------|--------|
| Identificacao | User | Nome de Usuario, Nome de Exibicao, Email |
| Seguranca | Lock | Senha (com toggle visibilidade) |
| Acesso | Shield | Nivel de Acesso, Papel, Grupo |

#### Especificacoes das Secoes

```scss
.modal-section {
  border: 1px solid var(--snap-border);
  border-radius: 8px;
  padding: 16px;
  
  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--snap-border);
    
    &-icon {
      width: 16px;
      height: 16px;
      color: var(--snap-text-muted);
    }
    
    &-title {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--snap-text-muted);
    }
  }
}
```

---

## 8. Cores e Verticais

### Cores das Verticais SNAP

| Vertical | Nome | Hex | Uso |
|----------|------|-----|-----|
| Investigacao | Coral | #FE473C | Borda, badges, avatar |
| Inteligencia | Bordo | #72284B | Borda, badges, avatar |
| Cooperacao | Grey Ahead | #889EA3 | Borda, badges, avatar |
| Infraestrutura | Petroleum Blue | #287266 | Borda, badges, avatar |
| Administracao | Deep Gray Blue | #333540 | Borda, badges, avatar |

### Cores Semanticas

| Nome | Light | Dark | Uso |
|------|-------|------|-----|
| Success | #22C55E | #22C55E | Status ativo, confirmacoes |
| Warning | #F59E0B | #F59E0B | Alertas, desativar |
| Error | #EF4444 | #EF4444 | Erros, excluir |
| Info | #3B82F6 | #3B82F6 | Links, informacoes |
| Pink | #D4789B | #D4789B | Bloquear |

### Cores de Superficie

| Token | Light | Dark |
|-------|-------|------|
| Background | #FFFFFF | #0A0A0A |
| Card | #FFFFFF | #141414 |
| Muted | #F4F4F5 | #27272A |
| Border | #E4E4E7 | #2A2B35 |

---

## Checklist de Implementacao Visual

### Componentes Base
- [ ] Button com todas as variantes e tamanhos
- [ ] Select accordion-style
- [ ] Modal com tamanhos e header padrao
- [ ] Input com estados (focus, error, disabled)
- [ ] Badge/Label com border-radius pill

### Layout
- [ ] Header global com medidas exatas
- [ ] Sidebar com estados (aberta/fechada)
- [ ] Area de conteudo com margens corretas

### Telas
- [ ] Listagem de usuarios com tabela
- [ ] Detalhe do usuario com card
- [ ] Barra de acoes com botoes coloridos

### Modais
- [ ] Editar usuario
- [ ] Redefinir senha
- [ ] Desativar usuario (warning)
- [ ] Bloquear usuario (pink)
- [ ] Excluir usuario (destructive)
- [ ] Criar usuario (2 colunas)

---

## Proximos Passos

Apos implementar os componentes visuais em Angular:

1. Testar em ambos os temas (light/dark)
2. Validar responsividade
3. Verificar acessibilidade (WCAG)
4. Comparar pixel-a-pixel com as telas do Design System React
