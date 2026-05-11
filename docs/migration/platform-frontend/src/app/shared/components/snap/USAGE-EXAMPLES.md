# SNAP Angular Components - Exemplos de Uso

## Importacao

```typescript
// Em um componente standalone
import { 
  SnapButtonComponent,
  SnapModalComponent,
  SnapModalHeaderComponent,
  SnapModalContentComponent,
  SnapModalFooterComponent,
  SnapSelectComponent,
  SnapHeaderComponent,
  SnapSidebarComponent
} from '@shared/components/snap';

@Component({
  standalone: true,
  imports: [
    SnapButtonComponent,
    SnapModalComponent,
    SnapModalHeaderComponent,
    // ...
  ],
})
```

---

## SnapButton

### Variantes

```html
<!-- Solid (default) -->
<snap-button>Salvar</snap-button>

<!-- Outline -->
<snap-button variant="outline">Cancelar</snap-button>

<!-- Ghost -->
<snap-button variant="ghost">Mais opcoes</snap-button>

<!-- Primary (invertido) -->
<snap-button variant="primary">Criar</snap-button>
```

### Com Icone

```html
<snap-button>
  <svg icon width="16" height="16">...</svg>
  Novo Usuario
</snap-button>

<!-- Icone a direita -->
<snap-button iconPosition="right">
  Proximo
  <svg icon width="16" height="16">...</svg>
</snap-button>
```

### Tamanhos

```html
<snap-button size="sm">Pequeno</snap-button>
<snap-button size="default">Normal</snap-button>
<snap-button size="modal">Para Modais</snap-button>
<snap-button size="card">Para Cards</snap-button>
```

### Estados

```html
<!-- Desabilitado -->
<snap-button [disabled]="true">Desabilitado</snap-button>

<!-- Loading -->
<snap-button [loading]="isLoading">Salvando...</snap-button>

<!-- Full width -->
<snap-button [fullWidth]="true">Largura Total</snap-button>
```

### Cores Customizadas (acoes criticas)

```html
<!-- Erro/Excluir (vermelho) -->
<snap-button customClass="snap-button--error">
  <svg icon>...</svg>
  Excluir
</snap-button>

<!-- Warning/Desativar (amarelo) -->
<snap-button customClass="snap-button--warning">
  <svg icon>...</svg>
  Desativar
</snap-button>

<!-- Outline Error -->
<snap-button variant="outline" customClass="snap-button--outline-error">
  <svg icon>...</svg>
  Excluir
</snap-button>
```

---

## SnapModal

### Modal Simples

```html
<snap-modal [open]="showModal" (closed)="showModal = false">
  <snap-modal-header 
    title="Titulo do Modal"
    (closed)="showModal = false"
  >
    <svg icon width="20" height="20">...</svg>
  </snap-modal-header>
  
  <snap-modal-content>
    <p>Conteudo do modal aqui...</p>
  </snap-modal-content>
</snap-modal>
```

### Modal com Footer

```html
<snap-modal [open]="showModal" (closed)="showModal = false" size="lg">
  <snap-modal-header title="Editar Usuario" (closed)="showModal = false">
    <svg icon>...</svg>
  </snap-modal-header>
  
  <snap-modal-content>
    <!-- Formulario -->
    <div class="form-field">
      <label>Nome</label>
      <input [(ngModel)]="form.nome" />
    </div>
    
    <snap-modal-footer [withTopMargin]="true">
      <snap-button variant="primary" (clicked)="onSave()">
        <svg icon>...</svg>
        Salvar
      </snap-button>
      <snap-button variant="outline" (clicked)="showModal = false">
        <svg icon>...</svg>
        Cancelar
      </snap-button>
    </snap-modal-footer>
  </snap-modal-content>
</snap-modal>
```

### Tamanhos de Modal

```html
<!-- Pequeno (384px) -->
<snap-modal size="sm">...</snap-modal>

<!-- Medio (448px) - default -->
<snap-modal size="md">...</snap-modal>

<!-- Grande (640px) -->
<snap-modal size="lg">...</snap-modal>

<!-- Extra Grande (768px) -->
<snap-modal size="xl">...</snap-modal>

<!-- 2XL (896px) - para formularios complexos -->
<snap-modal size="2xl">...</snap-modal>
```

---

## SnapSelect

### Basico

```html
<snap-select
  [options]="statusOptions"
  [(value)]="selectedStatus"
  placeholder="Selecione um status"
/>
```

### Com Label

```html
<snap-select
  label="Papel do Usuario"
  [options]="roleOptions"
  [(value)]="selectedRole"
  placeholder="Selecione um papel"
/>
```

### Com Reactive Forms

```html
<snap-select
  label="Grupo"
  [options]="groupOptions"
  formControlName="grupo"
  placeholder="Selecione um grupo"
/>
```

### Opcoes

```typescript
// No componente
statusOptions: SnapSelectOption[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'locked', label: 'Bloqueado' },
];
```

---

## SnapHeader

```html
<snap-header
  vertical="administracao"
  [breadcrumb]="breadcrumbItems"
  userName="Analista de Contrainteligencia"
  userRole="Administrador"
  userInitials="AC"
  [notificationCount]="5"
  [isDarkMode]="isDark"
  (menuClicked)="onMenuClick()"
  (themeToggled)="onThemeToggle()"
/>
```

```typescript
// No componente
breadcrumbItems: SnapBreadcrumbItem[] = [
  { label: 'Administracao', href: '/admin' },
  { label: 'Usuarios', href: '/admin/usuarios' },
  { label: 'Detalhe do Usuario' }, // sem href = item atual
];
```

---

## SnapSidebar

```html
<snap-sidebar
  [items]="sidebarItems"
  activeId="usuarios"
  (itemClicked)="onSidebarItemClick($event)"
  (expandedChange)="onSidebarExpand($event)"
/>
```

```typescript
// No componente
sidebarItems: SnapSidebarItem[] = [
  { id: 'usuarios', label: 'Usuarios', icon: 'users', href: '/admin/usuarios' },
  { id: 'grupos', label: 'Grupos', icon: 'folder', href: '/admin/grupos' },
  { id: 'papeis', label: 'Papeis', icon: 'shield', href: '/admin/papeis' },
  { id: 'convites', label: 'Convites', icon: 'mail', href: '/admin/convites', badge: 3 },
  { id: 'auditoria', label: 'Auditoria', icon: 'scroll', href: '/admin/auditoria' },
  { id: 'organizacoes', label: 'Organizacoes', icon: 'building', href: '/admin/organizacoes' },
];
```

---

## Layout Completo (Exemplo)

```html
<!-- app.component.html -->
<div class="l-app">
  <snap-sidebar [items]="sidebarItems" />
  
  <div class="l-app__main">
    <snap-header
      vertical="administracao"
      [breadcrumb]="breadcrumb"
      userName="Usuario"
      userRole="Admin"
      userInitials="UA"
    />
    
    <main class="l-app__content">
      <router-outlet />
    </main>
  </div>
</div>
```

```scss
// app.component.scss
.l-app {
  display: flex;
  min-height: 100vh;
  
  &__main {
    flex: 1;
    margin-left: 64px; // Sidebar collapsed width
    transition: margin-left 0.3s ease;
  }
  
  &__content {
    padding: var(--snap-spacing-8);
    padding-left: calc(var(--snap-spacing-8) + 51px); // Alinhamento com header
  }
}
```
