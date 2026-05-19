# Guia de Mapeamento: React/Next.js/Tailwind para Angular/SCSS/BEM

Este documento mapeia os componentes, tokens e padrões do Design System SNAP (React) para a nova stack Angular com SMACSS/BEM.

---

## 1. Mapeamento de Tokens

### 1.1 Cores

| Token React (Tailwind/CSS Var) | Token Angular (styles-pack) | Descrição |
|-------------------------------|----------------------------|-----------|
| `bg-background` / `#0f0f10` | `--snap-surface-1` | Background da aplicacao |
| `bg-card` / `#0f0f10` | `--snap-surface-2` | Background de cards/paineis |
| `bg-muted` / `#1a1a1a` | `--snap-surface-3` | Hover, fills sutis, tags |
| `text-foreground` / `#ffffff` | `--snap-text-primary` | Texto principal |
| `text-text-secondary` / `#b1b3c2` | `--snap-text-secondary` | Texto secundario |
| `text-text-muted` / `#898c9d` | `--snap-text-muted` | Texto desabilitado/hint |
| `border-border` / `#2a2b35` | `--snap-border-default` | Borda padrao |
| `border-subtle` / `#222222` | `--snap-border-subtle` | Borda sutil |
| `bg-error` / `#fe473c` | `--snap-danger` | Cor de erro/perigo |
| `bg-warning` / `#ff9800` | `--snap-warning` | Cor de alerta |
| `bg-success` / `#3f9f76` | `--snap-success` | Cor de sucesso |
| `bg-info` / `#00bcd4` | `--snap-info` | Cor informativa |
| Vertical Inteligencia `#72284b` | `--snap-pillar-color` | Cor da vertical ativa |

### 1.2 Tipografia

| Token React | Token Angular | Valor |
|-------------|---------------|-------|
| `font-title` (Cygnito Mono) | `--font-accent` | Cygnito Mono |
| `font-sans` (Inter Tight) | `--font-ui` | Inter Tight Variable |
| `text-xs` (12px) | `--text-sm` | 0.6875rem (12px) |
| `text-sm` (14px) | `--text-base` | 0.75rem (14px) |
| `text-base` (16px) | `--text-lg` | 0.875rem (16px) |
| `text-lg` (18px) | `--text-xl` | 1rem (18px) |
| `text-xl` (24px) | `--text-3xl` | 1.25rem (23px) |
| `text-2xl` (32px) | `--text-5xl` | 1.875rem (34px) |

**NOTA:** O styles-pack usa `html { font-size: 18px }` como base, entao os valores rem sao diferentes.

### 1.3 Espacamentos

| Token React (Tailwind) | Token Angular | Valor |
|------------------------|---------------|-------|
| `p-1` / `gap-1` (4px) | `--space-1-5` | 0.25rem (4px) |
| `p-2` / `gap-2` (8px) | `--space-2-5` | 0.5rem (8px) |
| `p-3` / `gap-3` (12px) | `--space-3-5` | 0.75rem (12px) |
| `p-4` / `gap-4` (16px) | `--space-5` | 1rem (16px) |
| `p-5` / `gap-5` (20px) | `--space-6` | 1.25rem (20px) |
| `p-6` / `gap-6` (24px) | `--space-7` | 1.5rem (24px) |
| `p-8` / `gap-8` (32px) | `--space-8` | 2rem (32px) |

### 1.4 Layout Shell

| Token React | Token Angular | Valor |
|-------------|---------------|-------|
| Header height | `--shell-header-height` | 64px |
| Sidebar collapsed | `--shell-sidebar-collapsed` | 56px |
| Sidebar expanded | `--shell-sidebar-expanded` | 220px |
| Content padding X | `--shell-content-padding-x` | 32px |
| Content padding Y | `--shell-content-padding-y` | 24px |

---

## 2. Mapeamento de Componentes

### 2.1 Componentes SNAP -> Angular/PrimeNG

| Componente React | Classe BEM Angular | PrimeNG Equivalente | Notas |
|------------------|-------------------|---------------------|-------|
| `<SnapButton>` | `.btn`, `.btn--primary`, `.btn--outline` | `p-button` | Usar diretivas PrimeNG com classes BEM |
| `<SnapModal>` | `.modal`, `.modal__header`, `.modal__content`, `.modal__footer` | `p-dialog` | Customizar via `styleClass` |
| `<SnapCard>` | `.card`, `.card__header`, `.card__body`, `.card__footer` | `p-card` | Usar slots do PrimeNG |
| `<SnapSelect>` | `.select`, `.select__trigger`, `.select__dropdown` | `p-dropdown` | Customizar aparencia |
| `<SnapTabs>` | `.tabs`, `.tabs__item`, `.tabs__item--active` | `p-tabView` | Usar `styleClass` |
| `<SnapBadge>` | `.badge`, `.badge--success`, `.badge--danger` | `p-tag` | Mapear cores |
| `<SnapHeader>` | `.l-header`, `.l-header__logo`, `.l-header__nav` | - | Layout component |
| `<SnapSidebar>` | `.l-sidebar`, `.l-sidebar__item`, `.l-sidebar__item--active` | `p-menu` | Usar `p-panelMenu` para expansivel |
| `<SnapEntityLink>` | `.entity-link`, `.entity-link--pessoa`, `.entity-link--empresa` | - | Componente customizado |
| `<SnapThemeToggle>` | `.theme-toggle`, `.theme-toggle__icon` | - | Usar `localStorage` + classe `.p-dark` |

### 2.2 Estrutura de Arquivos Angular

```
src/
  app/
    core/
      layout/
        header/
          header.component.ts
          header.component.html
          header.component.scss      # Usa classes .l-header, .l-header__*
        sidebar/
          sidebar.component.ts
          sidebar.component.html
          sidebar.component.scss     # Usa classes .l-sidebar, .l-sidebar__*
    features/
      iam/
        usuarios/
          usuarios-list/
            usuarios-list.component.ts
            usuarios-list.component.html
            usuarios-list.component.scss
          usuarios-detail/
            usuarios-detail.component.ts
            usuarios-detail.component.html
            usuarios-detail.component.scss
          modals/
            criar-usuario/
              criar-usuario.component.ts
              criar-usuario.component.html
              criar-usuario.component.scss
    shared/
      components/
        button/
          button.component.ts
          button.component.scss      # Usa classes .btn, .btn--*
        card/
          card.component.ts
          card.component.scss        # Usa classes .card, .card__*
        modal/
          modal.component.ts
          modal.component.scss       # Usa classes .modal, .modal__*
```

---

## 3. Mapeamento de Classes Tailwind -> BEM

### 3.1 Classes de Layout

| Tailwind | BEM/SMACSS | Descricao |
|----------|------------|-----------|
| `flex` | `.l-flex` | Flexbox container |
| `flex-col` | `.l-flex--column` | Flexbox coluna |
| `items-center` | `.l-flex--align-center` | Alinhamento vertical |
| `justify-between` | `.l-flex--justify-between` | Distribuicao horizontal |
| `gap-4` | `.l-flex--gap-md` ou `gap: var(--space-5)` | Gap entre items |
| `grid` | `.l-grid` | Grid container |
| `grid-cols-2` | `.l-grid--cols-2` | Grid 2 colunas |

### 3.2 Classes de Estado

| Tailwind | BEM/SMACSS | Descricao |
|----------|------------|-----------|
| `hover:bg-muted` | `.card:hover` ou `.is-hovered` | Estado hover |
| `focus:outline-none` | `.is-focused` | Estado foco |
| `disabled:opacity-50` | `.is-disabled` | Estado desabilitado |
| `hidden` | `.is-hidden` | Elemento oculto |
| `active:scale-95` | `.is-active` | Estado ativo/pressionado |

### 3.3 Classes de Componente

| Tailwind (React) | BEM (Angular) |
|------------------|---------------|
| `className="bg-card border border-border rounded-xl p-6"` | `class="card"` |
| `className="text-lg font-semibold text-foreground"` | `class="card__title"` |
| `className="text-sm text-text-muted"` | `class="card__subtitle"` |
| `className="flex items-center gap-2"` | `class="card__header"` |
| `className="border-t border-border pt-4 mt-4"` | `class="card__footer"` |

---

## 4. Mapeamento de Padroes React -> Angular

### 4.1 Estado

| React | Angular |
|-------|---------|
| `useState(false)` | `signal(false)` |
| `setShowModal(true)` | `showModal.set(true)` |
| `const [form, setForm] = useState({...})` | `form = signal({...})` |
| `setForm(prev => ({...prev, name: value}))` | `form.update(f => ({...f, name: value}))` |

### 4.2 Condicional

| React | Angular |
|-------|---------|
| `{showModal && <Modal />}` | `@if (showModal()) { <app-modal /> }` |
| `{items.map(item => <Item key={item.id} />)}` | `@for (item of items(); track item.id) { <app-item /> }` |
| `{condition ? <A /> : <B />}` | `@if (condition()) { <A /> } @else { <B /> }` |

### 4.3 Props/Inputs

| React | Angular |
|-------|---------|
| `<Button variant="primary" />` | `<app-button variant="primary" />` com `@Input() variant` |
| `<Modal onClose={() => setOpen(false)} />` | `<app-modal (onClose)="open.set(false)" />` com `@Output() onClose` |
| `<Button>{children}</Button>` | `<app-button><ng-content /></app-button>` |

### 4.4 Eventos

| React | Angular |
|-------|---------|
| `onClick={() => handleClick()}` | `(click)="handleClick()"` |
| `onChange={(e) => setValue(e.target.value)}` | `(ngModelChange)="setValue($event)"` |
| `onSubmit={(e) => { e.preventDefault(); submit() }}` | `(ngSubmit)="submit()"` |

---

## 5. Exemplo de Conversao Completa

### 5.1 React (SnapButton)

```tsx
// components/snap/snap-button.tsx
interface SnapButtonProps {
  variant?: 'primary' | 'outline' | 'solid'
  size?: 'default' | 'modal' | 'card'
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}

export function SnapButton({ variant = 'primary', size = 'default', icon, children, onClick }: SnapButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-between gap-3 rounded-[6px] font-sans font-bold transition-colors",
        variant === 'primary' && "bg-foreground text-background hover:opacity-90",
        variant === 'outline' && "border border-border bg-transparent text-foreground hover:bg-muted",
        size === 'modal' && "min-w-[130px] px-4 py-2 text-sm",
      )}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
```

### 5.2 Angular (Convertido)

```typescript
// shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'outline' | 'solid' = 'primary';
  @Input() size: 'default' | 'modal' | 'card' = 'default';
  @Output() onClick = new EventEmitter<void>();
}
```

```html
<!-- button.component.html -->
<button 
  class="btn"
  [class.btn--primary]="variant === 'primary'"
  [class.btn--outline]="variant === 'outline'"
  [class.btn--solid]="variant === 'solid'"
  [class.btn--modal]="size === 'modal'"
  [class.btn--card]="size === 'card'"
  (click)="onClick.emit()"
>
  <span class="btn__icon" *ngIf="hasIcon">
    <ng-content select="[icon]"></ng-content>
  </span>
  <span class="btn__text">
    <ng-content></ng-content>
  </span>
</button>
```

```scss
// button.component.scss
@use '../../../styles/tokens' as *;

.btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3-5);
  border-radius: 6px;
  font-family: var(--font-ui);
  font-weight: 700;
  transition: opacity 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
  border: none;

  // Variants
  &--primary {
    background-color: var(--snap-text-primary);
    color: var(--snap-surface-1);

    &:hover {
      opacity: 0.9;
    }
  }

  &--outline {
    background-color: transparent;
    border: 1px solid var(--snap-border-default);
    color: var(--snap-text-primary);

    &:hover {
      background-color: var(--snap-surface-3);
    }
  }

  // Sizes
  &--modal {
    min-width: 130px;
    padding: var(--space-2-5) var(--space-5);
    font-size: var(--text-base);
  }

  &--card {
    min-width: 110px;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
  }

  // Elements
  &__icon {
    display: flex;
    align-items: center;
  }

  &__text {
    flex: 1;
    text-align: right;
  }
}
```

---

## 6. Checklist de Migracao por Componente

- [ ] **SnapButton** -> `app-button` (`.btn`)
- [ ] **SnapModal** -> `app-modal` (`.modal`) + PrimeNG `p-dialog`
- [ ] **SnapCard** -> `app-card` (`.card`)
- [ ] **SnapSelect** -> `app-select` (`.select`) + PrimeNG `p-dropdown`
- [ ] **SnapTabs** -> `app-tabs` (`.tabs`) + PrimeNG `p-tabView`
- [ ] **SnapBadge** -> `app-badge` (`.badge`) + PrimeNG `p-tag`
- [ ] **SnapHeader** -> `app-header` (`.l-header`)
- [ ] **SnapSidebar** -> `app-sidebar` (`.l-sidebar`)
- [ ] **SnapEntityLink** -> `app-entity-link` (`.entity-link`)
- [ ] **SnapThemeToggle** -> `app-theme-toggle` (`.theme-toggle`)
- [ ] **SnapLogo** -> `app-logo` (`.logo`)

---

## 7. Referencias

- **Tokens de Cores:** `docs/migration/styles-pack/styles/tokens/_colors.scss`
- **Tokens de Tipografia:** `docs/migration/styles-pack/styles/tokens/_typography.scss`
- **Tokens de Espacamento:** `docs/migration/styles-pack/styles/tokens/_spacing.scss`
- **Regras BEM/SMACSS:** `docs/migration/styles-pack/smacss-rules/smacss-bem.md`
- **Spec IAM Admin Panel:** `docs/migration/platform-frontend/.kiro/specs/iam-admin-panel-v2/`
