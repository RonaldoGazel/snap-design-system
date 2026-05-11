import { Injectable, signal, computed, effect, OnDestroy } from '@angular/core';

const STORAGE_KEY = 'apolo-theme';
const DARK_CLASS = 'p-dark';
const LIGHT_CLASS = 'p-light';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  readonly isDark = signal<boolean>(this.loadPreference());

  readonly currentTheme = computed<'light' | 'dark'>(() => (this.isDark() ? 'dark' : 'light'));
  readonly icon = computed(() => (this.isDark() ? 'pi pi-sun' : 'pi pi-moon'));
  readonly label = computed(() => (this.isDark() ? 'Modo claro' : 'Modo escuro'));

  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;

  constructor() {
    effect(() => {
      const dark = this.isDark();
      // Always set exactly one of p-dark / p-light so the @media
      // prefers-color-scheme block in _colors.scss never fires unexpectedly.
      document.documentElement.classList.toggle(DARK_CLASS, dark);
      document.documentElement.classList.toggle(LIGHT_CLASS, !dark);
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    });
    this.setupMediaQueryListener();
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }

  ngOnDestroy(): void {
    this.removeMediaQueryListener();
  }

  private loadPreference(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private setupMediaQueryListener(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return;
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryListener = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        this.isDark.set(event.matches);
      }
    };
    this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
  }

  private removeMediaQueryListener(): void {
    if (this.mediaQueryList && this.mediaQueryListener) {
      this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
      this.mediaQueryList = null;
      this.mediaQueryListener = null;
    }
  }
}
