import { ChangeDetectionStrategy, Component, computed, inject, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Menu, MenuModule } from 'primeng/menu';
import { Tooltip } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { MenuItem } from 'primeng/api';

import { AuthService } from '../../auth/services/auth.service';
import { SidebarService } from '../sidebar/sidebar.service';

/**
 * Computes user initials from a full name string.
 * Takes the uppercase first character of the first two words.
 * For a single-word name, returns the uppercase first character only.
 * For an empty/whitespace-only name, returns an empty string.
 */
export function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

@Component({
  selector: 'app-user-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MenuModule, Tooltip, TranslateModule, AvatarModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  protected readonly sidebar = inject(SidebarService);

  @ViewChild('menu') menu!: Menu;

  private readonly sessionState = toSignal(this.auth.sessionState$, {
    initialValue: {
      status: 'initializing' as const,
      user: null,
      isRefreshing: false,
      isStale: false,
    },
  });

  protected readonly user = computed(() => this.sessionState().user);
  protected readonly initials = computed(() => {
    const u = this.user();
    return u ? computeInitials(u.name) : '';
  });
  protected readonly displayName = computed(() => {
    const u = this.user();
    return u?.name || u?.preferredUsername || '';
  });
  protected readonly displayRole = computed(() => {
    const u = this.user();
    return u?.preferredUsername || '';
  });

  protected readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: this.translate.instant('shell.userMenu.signOut'),
      icon: 'pi pi-sign-out',
      command: () => this.auth.logout(),
    },
  ]);

  protected toggleMenu(event: Event): void {
    this.menu.toggle(event);
  }
}
