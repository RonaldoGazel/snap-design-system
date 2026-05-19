import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map } from 'rxjs/operators';

import { BreadcrumbService } from './breadcrumb.service';

export interface BreadcrumbItem {
  label: string;
  url: string | null;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly isPersonContext = computed(() => this.url().startsWith('/intelligence/person'));

  readonly items = computed<BreadcrumbItem[]>(() => {
    const url = this.url();
    const segments = url.split('?')[0].split('/').filter(Boolean);

    const raw = segments.map((seg, i) => {
      const label = this.breadcrumbService.getLabel(seg);
      const routerLink = '/' + segments.slice(0, i + 1).join('/');
      return { seg, label, routerLink };
    });

    // Collapse consecutive segments that resolve to the same label
    // (e.g. `person` and `pessoas` both map to "Pessoas").
    const deduped: Array<{ seg: string; label: string; routerLink: string }> = [];
    for (const item of raw) {
      const prev = deduped[deduped.length - 1];
      if (prev && prev.label.toLowerCase() === item.label.toLowerCase()) {
        // Keep the deepest route for the collapsed pair.
        prev.routerLink = item.routerLink;
        prev.seg = item.seg;
        continue;
      }
      deduped.push({ ...item });
    }

    return deduped.map((item, i, arr) => {
      const isLast = i === arr.length - 1;
      return {
        label: item.label,
        url: isLast ? null : item.routerLink,
      };
    });
  });
}
