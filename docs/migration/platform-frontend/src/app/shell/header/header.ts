import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { ThemeService } from '../theme.service';
import { AuthService } from '../../auth/services/auth.service';
import { ActiveOrgService } from '../../features/iam/services/active-org.service';
import { computeInitials } from '../user-menu/user-menu';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, AvatarModule, PopoverModule, TooltipModule, TranslateModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '[class.app-header--person]': 'isPersonContext()',
  },
})
export class HeaderComponent {
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly activeOrg = inject(ActiveOrgService);

  protected readonly orgName = this.activeOrg.userOrganizationName;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly sessionState = toSignal(this.auth.sessionState$, {
    initialValue: {
      status: 'initializing' as const,
      user: null,
      isRefreshing: false,
      isStale: false,
    },
  });

  protected readonly isPersonContext = computed(() =>
    this.currentUrl().startsWith('/intelligence/person'),
  );

  protected readonly userInitials = computed(() => {
    const user = this.sessionState().user;
    return user ? computeInitials(user.name) : 'U';
  });

  protected readonly userName = computed(() => {
    const user = this.sessionState().user;
    return user?.name || user?.preferredUsername || '';
  });

  protected logout(): void {
    this.auth.logout();
  }
}
