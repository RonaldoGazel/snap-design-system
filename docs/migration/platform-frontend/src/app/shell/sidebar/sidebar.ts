import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { SidebarService } from './sidebar.service';
import type { NavSection } from './sidebar.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, ButtonModule, Tooltip, TranslateModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  protected readonly sidebar = inject(SidebarService);

  private openSubItems = new Set<string>();

  protected onMouseEnter(): void {
    if (this.sidebar.mode() === 'auto') {
      this.sidebar.setHovered(true);
    }
  }

  protected onMouseLeave(): void {
    if (this.sidebar.mode() === 'auto') {
      this.sidebar.setHovered(false);
    }
  }

  protected toggleSection(section: NavSection): void {
    if (this.sidebar.isExpanded()) {
      this.sidebar.toggleSection(section.id);
    }
  }

  protected isSectionOpen(sectionId: string): boolean {
    return this.sidebar.openSections().has(sectionId);
  }

  protected toggleSubItem(route: string): void {
    if (this.openSubItems.has(route)) {
      this.openSubItems.delete(route);
    } else {
      this.openSubItems.add(route);
    }
  }

  protected isSubItemOpen(route: string): boolean {
    return this.openSubItems.has(route);
  }

  protected expandSidebar(): void {
    this.sidebar.cycleMode();
  }

  /** Convert a route path to a data-testid fragment: '/admin/organizations' → 'admin-organizations' */
  protected toTestId(route: string): string {
    return route.replace(/^\//, '').replace(/\//g, '-');
  }
}
