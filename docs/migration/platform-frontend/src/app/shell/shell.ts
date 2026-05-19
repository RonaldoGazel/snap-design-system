import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { SidebarComponent } from './sidebar/sidebar';
import { HeaderComponent } from './header/header';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb';
import { SidebarService } from './sidebar/sidebar.service';
import { ActiveOrgService } from '../features/iam/services/active-org.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    Toast,
    ConfirmDialog,
    SidebarComponent,
    HeaderComponent,
    BreadcrumbComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent implements OnInit {
  private readonly sidebarService = inject(SidebarService);
  private readonly activeOrg = inject(ActiveOrgService);
  private readonly router = inject(Router);

  /**
   * Left margin of the main content area.
   * Matches the prototype: sidebar rail (56px) + left inset (16px) + right gap (16px) = 88px.
   */
  protected readonly contentMargin = computed(() => 88);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Hide the breadcrumb strip on auth routes (login / callback). */
  protected readonly showBreadcrumb = computed(() => {
    const url = this.currentUrl();
    return !url.startsWith('/auth');
  });

  async ngOnInit(): Promise<void> {
    // ensureInitialized() is idempotent and deduplicates concurrent calls,
    // so it's safe to call here even if OrgContextGuard already triggered it.
    await this.activeOrg.ensureInitialized();
  }
}
