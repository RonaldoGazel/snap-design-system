// Polyfill ResizeObserver for PrimeNG in test environment
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject, of } from 'rxjs';

import { DocNavigationComponent } from './doc-navigation';

describe('DocNavigationComponent', () => {
  let fixture: ComponentFixture<DocNavigationComponent>;
  let component: DocNavigationComponent;
  let routerEvents$: Subject<any>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn>; url: string; events: Subject<any> };

  beforeEach(async () => {
    routerEvents$ = new Subject();
    mockRouter = {
      navigate: vi.fn(),
      url: '/intelligence/documentos',
      events: routerEvents$,
    };

    await TestBed.configureTestingModule({
      imports: [DocNavigationComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { params: of({}), snapshot: { params: {} } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Sidebar menu ---
  // **Validates: Requirement 19.1**

  it('should have 5 navigation areas in sidebar', () => {
    expect(component.sidebarItems.length).toBe(5);
  });

  it('should include Visão Operacional in sidebar', () => {
    expect(component.sidebarItems[0].label).toBe('Visão Operacional');
  });

  it('should include Processos in sidebar', () => {
    expect(component.sidebarItems[1].label).toBe('Processos');
  });

  it('should include Produção Documental in sidebar', () => {
    expect(component.sidebarItems[2].label).toBe('Produção Documental');
  });

  it('should include Tramitação e Difusão in sidebar', () => {
    expect(component.sidebarItems[3].label).toBe('Tramitação e Difusão');
  });

  it('should include Indexação e Apolização in sidebar', () => {
    expect(component.sidebarItems[4].label).toBe('Indexação e Apolização');
  });

  it('should render p-menu in sidebar', () => {
    const menu = fixture.debugElement.query(By.css('p-menu'));
    expect(menu).toBeTruthy();
  });

  // --- Breadcrumb updates on route change ---
  // **Validates: Requirement 19.2**
  // **Property 17: Breadcrumbs reflect current navigation path**

  it('should show Visão Operacional breadcrumb on documentos root', () => {
    mockRouter.url = '/intelligence/documentos';
    routerEvents$.next(new NavigationEnd(1, '/intelligence/documentos', '/intelligence/documentos'));
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Visão Operacional');
  });

  it('should show Processos breadcrumb on processos route', () => {
    mockRouter.url = '/intelligence/documentos/processos';
    routerEvents$.next(new NavigationEnd(2, '/intelligence/documentos/processos', '/intelligence/documentos/processos'));
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Processos');
  });

  it('should show Busca breadcrumb on busca route', () => {
    mockRouter.url = '/intelligence/documentos/busca';
    routerEvents$.next(new NavigationEnd(3, '/intelligence/documentos/busca', '/intelligence/documentos/busca'));
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Busca');
  });

  it('should show Caixa de Entrada breadcrumb on caixa-entrada route', () => {
    mockRouter.url = '/intelligence/documentos/caixa-entrada';
    routerEvents$.next(new NavigationEnd(4, '/intelligence/documentos/caixa-entrada', '/intelligence/documentos/caixa-entrada'));
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Caixa de Entrada');
  });

  // --- Breadcrumb includes resource title for parameterized routes ---
  // **Validates: Requirement 19.3**

  it('should include resource title for process detail route', () => {
    mockRouter.url = '/intelligence/documentos/processos/proc-123';
    component.setResourceTitle('Processo Alpha');
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items.length).toBe(2);
    expect(items[0].label).toBe('Processos');
    expect(items[0].routerLink).toBe('/intelligence/documentos/processos');
    expect(items[1].label).toBe('Processo Alpha');
  });

  it('should include resource title for editor route', () => {
    mockRouter.url = '/intelligence/documentos/editor/doc-456';
    component.setResourceTitle('Relatório Operacional');
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items.length).toBe(2);
    expect(items[0].label).toBe('Documentos');
    expect(items[1].label).toBe('Relatório Operacional');
  });

  it('should show default label when no resource title set for parameterized route', () => {
    mockRouter.url = '/intelligence/documentos/processos/proc-123';
    routerEvents$.next(new NavigationEnd(5, '/intelligence/documentos/processos/proc-123', '/intelligence/documentos/processos/proc-123'));
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items.length).toBe(2);
    expect(items[1].label).toBe('Detalhe do Processo');
  });

  // --- Navigation on breadcrumb click ---
  // **Validates: Requirement 19.4**

  it('should have home breadcrumb pointing to documentos root', () => {
    expect(component.home.routerLink).toBe('/intelligence/documentos');
  });

  it('should have navigable parent breadcrumb for process detail', () => {
    mockRouter.url = '/intelligence/documentos/processos/proc-123';
    component.setResourceTitle('Test');
    fixture.detectChanges();

    const items = component.breadcrumbItems();
    expect(items[0].routerLink).toBe('/intelligence/documentos/processos');
  });

  // --- Render breadcrumb component ---

  it('should render p-breadcrumb', () => {
    const breadcrumb = fixture.debugElement.query(By.css('p-breadcrumb'));
    expect(breadcrumb).toBeTruthy();
  });

  // --- Sidebar navigation ---

  it('should navigate to processos when Processos sidebar item is clicked', () => {
    component.sidebarItems[1].command!({} as any);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'documentos', 'processos']);
  });

  it('should navigate to documentos root when Visão Operacional is clicked', () => {
    component.sidebarItems[0].command!({} as any);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'documentos']);
  });
});
