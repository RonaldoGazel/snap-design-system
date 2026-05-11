import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface SnapSidebarItem {
  id: string;
  label: string;
  icon: string; // Nome do icone (ex: 'users', 'shield', 'folder')
  href?: string;
  badge?: number;
}

@Component({
  selector: 'snap-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <aside 
      class="snap-sidebar"
      [class.snap-sidebar--expanded]="expanded()"
      [class.snap-sidebar--collapsed]="!expanded()"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <nav class="snap-sidebar__nav">
        @for (item of items; track item.id) {
          @if (item.href) {
            <a
              [routerLink]="item.href"
              routerLinkActive="snap-sidebar__item--active"
              class="snap-sidebar__item"
              [title]="!expanded() ? item.label : ''"
              (click)="itemClicked.emit(item)"
            >
              <span class="snap-sidebar__icon">
                <ng-container [ngSwitch]="item.icon">
                  <ng-container *ngSwitchCase="'users'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </ng-container>
                  <ng-container *ngSwitchCase="'shield'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </ng-container>
                  <ng-container *ngSwitchCase="'key'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                  </ng-container>
                  <ng-container *ngSwitchCase="'mail'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </ng-container>
                  <ng-container *ngSwitchCase="'building'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                      <path d="M9 22v-4h6v4"></path>
                      <path d="M8 6h.01"></path>
                      <path d="M16 6h.01"></path>
                      <path d="M12 6h.01"></path>
                      <path d="M12 10h.01"></path>
                      <path d="M12 14h.01"></path>
                      <path d="M16 10h.01"></path>
                      <path d="M16 14h.01"></path>
                      <path d="M8 10h.01"></path>
                      <path d="M8 14h.01"></path>
                    </svg>
                  </ng-container>
                  <ng-container *ngSwitchCase="'scroll'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"></path>
                      <path d="M19 17V5a2 2 0 0 0-2-2H4"></path>
                    </svg>
                  </ng-container>
                  <ng-container *ngSwitchCase="'folder'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16Z"></path>
                    </svg>
                  </ng-container>
                  <ng-container *ngSwitchDefault>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </ng-container>
                </ng-container>
              </span>
              @if (expanded()) {
                <span class="snap-sidebar__label">{{ item.label }}</span>
                @if (item.badge && item.badge > 0) {
                  <span class="snap-sidebar__badge">{{ item.badge }}</span>
                }
              }
            </a>
          } @else {
            <button
              class="snap-sidebar__item"
              [title]="!expanded() ? item.label : ''"
              (click)="itemClicked.emit(item)"
            >
              <span class="snap-sidebar__icon">
                <!-- Same icon switch as above -->
              </span>
              @if (expanded()) {
                <span class="snap-sidebar__label">{{ item.label }}</span>
              }
            </button>
          }
        }
      </nav>
    </aside>
  `,
  styleUrl: './snap-sidebar.component.scss'
})
export class SnapSidebarComponent {
  @Input() items: SnapSidebarItem[] = [];
  @Input() activeId = '';
  
  @Output() itemClicked = new EventEmitter<SnapSidebarItem>();
  @Output() expandedChange = new EventEmitter<boolean>();

  expanded = signal(false);

  onMouseEnter(): void {
    this.expanded.set(true);
    this.expandedChange.emit(true);
  }

  onMouseLeave(): void {
    this.expanded.set(false);
    this.expandedChange.emit(false);
  }
}
