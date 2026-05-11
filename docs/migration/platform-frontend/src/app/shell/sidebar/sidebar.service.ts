import {
  computed,
  inject,
  Injectable,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import { ActiveOrgService } from '../../features/iam/services/active-org.service';
import type { NavItem, NavSection } from './sidebar.model';

export type SidebarMode = 'pinned' | 'auto' | 'collapsed';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly activeOrg = inject(ActiveOrgService);

  readonly mode: WritableSignal<SidebarMode> = signal<SidebarMode>('auto');
  readonly isHovered: WritableSignal<boolean> = signal(false);
  readonly openSections: WritableSignal<Set<string>> = signal(new Set<string>());

  readonly isExpanded = computed(
    () => this.mode() === 'pinned' || (this.mode() === 'auto' && this.isHovered()),
  );
  readonly isPinned = computed(() => this.mode() === 'pinned');
  readonly effectiveWidth = computed(() => (this.isExpanded() ? 260 : 64));

  readonly sections: Signal<NavSection[]> = computed(() => {
    const isPlatformAdmin = this.activeOrg.isPlatformAdmin();
    const isAdmin = this.activeOrg.isAdmin();
    const initialized = this.activeOrg.initialized();

    const sections: NavSection[] = [
      {
        id: 'intelligence',
        label: 'shell.nav.intelligence',
        icon: 'pi pi-shield',
        items: [
          { label: 'shell.nav.poi', icon: 'pi pi-users', route: '/intelligence/person' },
          {
            label: 'shell.nav.documents',
            icon: 'pi pi-file-edit',
            route: '/intelligence/documents',
          },
          {
            label: 'shell.nav.workflows',
            icon: 'pi pi-sitemap',
            route: '/intelligence/workflows',
            items: [
              {
                label: 'shell.nav.flowBuilder',
                icon: 'pi pi-objects-column',
                route: '/intelligence/workflows/visual-bpms',
              },
              {
                label: 'shell.nav.stepCatalog',
                icon: 'pi pi-list',
                route: '/intelligence/workflows/step-catalog',
              },
              {
                label: 'shell.nav.documentTypes',
                icon: 'pi pi-file',
                route: '/intelligence/workflows/document-types',
              },
              {
                label: 'shell.nav.templates',
                icon: 'pi pi-file-word',
                route: '/intelligence/workflows/templates',
              },
              {
                label: 'shell.nav.processes',
                icon: 'pi pi-folder',
                route: '/intelligence/workflows/processes',
              },
              {
                label: 'shell.nav.pendingTasks',
                icon: 'pi pi-clock',
                route: '/intelligence/workflows/pending-tasks',
              },
            ],
          },
        ],
      },
    ];

    // Only show admin section after identity context is loaded
    // to prevent flickering (admin items appearing/disappearing)
    if (!initialized) return sections;

    if (isAdmin) {
      const adminItems: NavItem[] = [
        { label: 'shell.nav.users', icon: 'pi pi-users', route: '/admin/users' },
        { label: 'shell.nav.groups', icon: 'pi pi-sitemap', route: '/admin/groups' },
        { label: 'shell.nav.roles', icon: 'pi pi-key', route: '/admin/roles' },
        { label: 'shell.nav.invitations', icon: 'pi pi-envelope', route: '/admin/invitations' },
        { label: 'shell.nav.audit', icon: 'pi pi-shield', route: '/admin/audit-logs' },
        { label: 'shell.nav.tasks', icon: 'pi pi-list-check', route: '/admin/tasks' },
      ];

      if (isPlatformAdmin) {
        adminItems.push(
          {
            label: 'shell.nav.organizations',
            icon: 'pi pi-building',
            route: '/admin/organizations',
          },
          { label: 'shell.nav.allUsers', icon: 'pi pi-globe', route: '/admin/all-users' },
        );
      }

      sections.push({
        id: 'administration',
        label: 'shell.nav.administration',
        icon: 'pi pi-lock',
        items: adminItems,
      });
    }

    return sections;
  });

  private static readonly MODE_CYCLE: Record<SidebarMode, SidebarMode> = {
    pinned: 'auto',
    auto: 'collapsed',
    collapsed: 'pinned',
  };

  togglePin(): void {
    this.mode.set(this.mode() === 'pinned' ? 'auto' : 'pinned');
  }

  collapse(): void {
    this.mode.set('collapsed');
  }

  cycleMode(): void {
    this.mode.set(SidebarService.MODE_CYCLE[this.mode()]);
  }

  setHovered(value: boolean): void {
    this.isHovered.set(value);
  }

  toggleSection(sectionId: string): void {
    const current = this.openSections();
    const next = new Set(current);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    this.openSections.set(next);
  }
}
