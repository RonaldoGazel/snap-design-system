# Contexto para Kiro - Migração SNAP Design System

## Resumo Executivo

O SNAP Design System foi originalmente prototipado em **React/Next.js 16 + Tailwind CSS 4 + ShadCN**. Agora precisa ser migrado para **Angular 21 + SCSS + BEM/SMACSS** conforme a stack do `platform-frontend`.

Este documento resume o que foi criado para facilitar essa migração.

---

## Arquivos Criados

### 1. MAPPING-GUIDE.md
**Propósito:** Tradução direta entre as duas stacks.

**Conteúdo:**
- Mapeamento de tokens Tailwind → CSS Variables (`--snap-*`)
- Mapeamento de componentes React → Angular equivalentes
- Conversão de padrões (useState → signals, className → BEM)
- Exemplo completo de migração do SnapButton

### 2. VISUAL-REFERENCE.md
**Propósito:** Especificações visuais exatas para implementação.

**Conteúdo:**
- Layout global com medidas (sidebar 64px, gaps, margens)
- Header com todas as medidas do Figma (gaps de 32px, alturas, posições)
- Especificações de cada componente (SnapButton, SnapModal, SnapSelect)
- Diagramas ASCII das telas (Listagem, Detalhe, Modais)
- Tabelas de cores e verticais com valores hex

### 3. Componentes Angular (em `src/app/shared/components/snap/`)

| Componente | Arquivos | Descrição |
|------------|----------|-----------|
| **SnapButton** | `.ts` + `.scss` | Botão com variantes (primary, solid, outline, ghost) e tamanhos |
| **SnapModal** | `.ts` + `.scss` | Modal com Header, Content, Footer e tamanhos (sm, md, lg, xl, 2xl) |
| **SnapSelect** | `.ts` + `.scss` | Select com ControlValueAccessor para formulários reativos |
| **SnapHeader** | `.ts` + `.scss` | Header global com breadcrumb, notificações, avatar |
| **SnapSidebar** | `.ts` + `.scss` | Sidebar colapsável com itens de navegação |

### 4. Arquivos de Suporte

- **`index.ts`** - Barrel file para imports simplificados
- **`_snap-tokens.scss`** - Tokens SCSS mapeados do styles-pack
- **`USAGE-EXAMPLES.md`** - Exemplos de uso de cada componente

---

## Stack de Destino

```
Angular 21 + Standalone Components + Signals
SCSS + BEM + SMACSS
PrimeNG (componentes base)
CSS Variables (--snap-*)
```

---

## Padrões a Seguir

### Nomenclatura BEM
```scss
.snap-button { }              // Bloco
.snap-button__icon { }        // Elemento
.snap-button--primary { }     // Modificador
.snap-button--size-lg { }     // Modificador de tamanho
```

### Nomenclatura SMACSS
```scss
.l-dashboard { }              // Layout
.is-active { }                // Estado
.snap-button { }              // Componente
```

### Signals (Angular 21)
```typescript
// Estado reativo
isOpen = signal(false);
isExpanded = signal(true);

// Computed
isActive = computed(() => this.isOpen() && this.hasContent());
```

---

## Tokens Principais

### Cores (CSS Variables)
```scss
--snap-surface-1: #000000;      // Fundo principal (dark)
--snap-surface-2: #0a0a0a;      // Fundo secundário
--snap-surface-3: #171717;      // Cards, modais
--snap-text-primary: #fafafa;   // Texto principal
--snap-text-secondary: #a1a1aa; // Texto secundário
--snap-border: #27272a;         // Bordas
--snap-error: #ef4444;          // Erro/Excluir
--snap-warning: #eab308;        // Aviso/Desativar
--snap-success: #22c55e;        // Sucesso
```

### Verticais do Ecossistema SNAP
```scss
--snap-vertical-investigacao: #FE473C;    // Coral
--snap-vertical-inteligencia: #72284B;    // Bordô
--snap-vertical-cooperacao: #889EA3;      // Grey Ahead
--snap-vertical-infraestrutura: #287266;  // Petroleum Blue
--snap-vertical-administracao: #333540;   // Deep Gray Blue
```

---

## Telas Implementadas (Referência Visual)

### Módulo Administração > Usuários

1. **Listagem de Usuários**
   - Tabela com colunas: Nome, Email, Status, Papel, Grupo, Último Acesso, Ações
   - Filtros por status
   - Botão "Novo Usuário"
   - Ações por linha: visualizar, editar, excluir

2. **Detalhe do Usuário**
   - Card com avatar, dados principais, metadados
   - Cards de Papéis e Grupos vinculados
   - Barra de ações: Editar, Redefinir Senha, Desativar, Bloquear, Excluir

3. **Modais Criados**
   - Editar Usuário
   - Redefinir Senha
   - Desativar Usuário (botão amarelo)
   - Bloquear Usuário (botão rosa)
   - Excluir Usuário (botão vermelho - ação crítica)
   - Criar Usuário (layout 2 colunas com seções)

---

## Como Usar os Componentes Angular

### Import
```typescript
import { 
  SnapButtonComponent,
  SnapModalComponent,
  SnapSelectComponent 
} from '@shared/components/snap';
```

### Exemplo SnapButton
```html
<snap-button 
  variant="primary" 
  size="default"
  [icon]="plusIcon"
  (clicked)="onNovoUsuario()">
  Novo Usuário
</snap-button>
```

### Exemplo SnapModal
```html
<snap-modal [open]="showModal()" [size]="'lg'" (closed)="closeModal()">
  <snap-modal-header 
    title="Editar Usuário" 
    [icon]="editIcon"
    (closed)="closeModal()">
  </snap-modal-header>
  
  <snap-modal-content>
    <!-- Conteúdo do formulário -->
  </snap-modal-content>
  
  <snap-modal-footer>
    <snap-button variant="solid">Salvar</snap-button>
    <snap-button variant="outline" (clicked)="closeModal()">Cancelar</snap-button>
  </snap-modal-footer>
</snap-modal>
```

---

## Próximos Passos Sugeridos

1. [ ] Integrar componentes SNAP no `SharedModule` do platform-frontend
2. [ ] Testar componentes isoladamente (Storybook ou página de teste)
3. [ ] Migrar tela de Listagem de Usuários usando os componentes
4. [ ] Migrar tela de Detalhe do Usuário
5. [ ] Implementar modais de ação
6. [ ] Conectar com APIs reais do IAM

---

## Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| `docs/migration/MAPPING-GUIDE.md` | Mapeamento completo de tokens e padrões |
| `docs/migration/VISUAL-REFERENCE.md` | Especificações visuais detalhadas |
| `docs/migration/platform-frontend/src/app/shared/components/snap/` | Componentes Angular |
| `docs/migration/styles-pack/` | Tokens SCSS originais |

---

*Documento criado em: Maio 2026*
*Última atualização: Sessão de migração SNAP Design System*
