import { Injectable, signal, OnDestroy } from '@angular/core';

const TABLET_MIN = 744;
const TABLET_MAX = 1279;
const TABLET_QUERY = `(min-width: ${TABLET_MIN}px) and (max-width: ${TABLET_MAX}px)`;

@Injectable({ providedIn: 'root' })
export class BreakpointService implements OnDestroy {
  /** True when viewport is in the tablet range (744px–1279px) */
  readonly isTablet = signal(false);

  private readonly mql: MediaQueryList | null;
  private readonly listener: ((e: MediaQueryListEvent) => void) | null;

  constructor() {
    if (typeof window === 'undefined' || !window.matchMedia) {
      this.mql = null;
      this.listener = null;
      return;
    }

    this.mql = window.matchMedia(TABLET_QUERY);
    this.isTablet.set(this.mql.matches);

    this.listener = (e: MediaQueryListEvent) => this.isTablet.set(e.matches);
    this.mql.addEventListener('change', this.listener);
  }

  ngOnDestroy(): void {
    if (this.mql && this.listener) {
      this.mql.removeEventListener('change', this.listener);
    }
  }
}
