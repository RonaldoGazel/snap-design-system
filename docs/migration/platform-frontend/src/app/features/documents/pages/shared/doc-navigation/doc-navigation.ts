import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-doc-navigation',
  standalone: true,
  imports: [MenuModule, BreadcrumbModule],
  templateUrl: './doc-navigation.html',
  styleUrl: './doc-navigation.css',
})
export class DocNavigationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private routerSub?: Subscription;

  home: MenuItem = { icon: 'pi pi-home', routerLink: '/intelligence/documents' };

  sidebarItems: MenuItem[] = [
    {
      label: 'Visão Operacional',
      icon: 'pi pi-chart-bar',
      command: () => this.router.navigate(['/intelligence', 'documents']),
    },
    {
      label: 'Processos',
      icon: 'pi pi-folder',
      command: () => this.router.navigate(['/intelligence', 'documents', 'processes']),
    },
    {
      label: 'Produção Documental',
      icon: 'pi pi-file-edit',
      command: () => this.router.navigate(['/intelligence', 'documents', 'new']),
    },
    {
      label: 'Tramitação e Difusão',
      icon: 'pi pi-send',
      command: () => this.router.navigate(['/intelligence', 'documents', 'inbox']),
    },
    {
      label: 'Indexação e Apolização',
      icon: 'pi pi-search',
      command: () => this.router.navigate(['/intelligence', 'documents', 'search']),
    },
  ];

  breadcrumbItems = signal<MenuItem[]>([]);
  resourceTitle = signal<string | null>(null);

  ngOnInit(): void {
    this.updateBreadcrumbs();
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateBreadcrumbs());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  setResourceTitle(title: string): void {
    this.resourceTitle.set(title);
    this.updateBreadcrumbs();
  }

  private updateBreadcrumbs(): void {
    const url = this.router.url;
    const items: MenuItem[] = [];

    if (url.includes('/documents/processes/')) {
      items.push({
        label: 'Processos',
        routerLink: '/intelligence/documents/processes',
      });
      const title = this.resourceTitle();
      items.push({ label: title ?? 'Detalhe do Processo' });
    } else if (url.includes('/documents/processes')) {
      items.push({ label: 'Processos' });
    } else if (url.includes('/documents/editor/')) {
      items.push({
        label: 'Documentos',
        routerLink: '/intelligence/documents',
      });
      const title = this.resourceTitle();
      items.push({ label: title ?? 'Editor de Documento' });
    } else if (url.includes('/documents/new')) {
      items.push({ label: 'Novo Documento' });
    } else if (url.includes('/documents/inbox')) {
      items.push({ label: 'Caixa de Entrada' });
    } else if (url.includes('/documents/reviews')) {
      items.push({ label: 'Revisões' });
    } else if (url.includes('/documents/search')) {
      items.push({ label: 'Busca' });
    } else if (url.includes('/documents/formalization/')) {
      items.push({ label: 'Formalização' });
    } else if (url.includes('/documents/dissemination/')) {
      items.push({ label: 'Difusão' });
    } else if (url.includes('/documents/apolization/')) {
      items.push({ label: 'Apolização' });
    } else if (url.includes('/documents')) {
      items.push({ label: 'Visão Operacional' });
    }

    this.breadcrumbItems.set(items);
  }
}
