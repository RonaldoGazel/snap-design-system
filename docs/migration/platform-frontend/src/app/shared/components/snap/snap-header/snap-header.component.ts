import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type SnapVertical = 'investigacao' | 'inteligencia' | 'cooperacao' | 'infraestrutura' | 'administracao';

export interface SnapBreadcrumbItem {
  label: string;
  href?: string;
}

const VERTICAL_COLORS: Record<SnapVertical, string> = {
  investigacao: '#FE473C',
  inteligencia: '#72284B',
  cooperacao: '#889EA3',
  infraestrutura: '#287266',
  administracao: '#333540',
};

@Component({
  selector: 'snap-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="snap-header">
      <!-- Top Row: Logo + User Info -->
      <div class="snap-header__top">
        <div class="snap-header__left">
          <!-- Menu Icon -->
          <button class="snap-header__menu-btn" (click)="menuClicked.emit()">
            <img src="/assets/menu-verticais.svg" alt="Menu" width="24" height="24" />
          </button>
          
          <!-- SNAP Logo -->
          <img 
            class="snap-header__logo"
            [src]="isDarkMode ? '/assets/snap-logo.svg' : '/assets/snap-logo-light.svg'" 
            alt="SNAP" 
            height="24"
          />
        </div>
        
        <div class="snap-header__right">
          <!-- Notifications -->
          <button class="snap-header__icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            @if (notificationCount && notificationCount > 0) {
              <span class="snap-header__badge">{{ notificationCount }}</span>
            }
          </button>
          
          <!-- Theme Toggle -->
          <button class="snap-header__icon-btn" (click)="themeToggled.emit()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (isDarkMode) {
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              } @else {
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              }
            </svg>
          </button>
          
          <!-- Separator -->
          <div class="snap-header__separator"></div>
          
          <!-- User Info -->
          <div class="snap-header__user">
            <div class="snap-header__user-info">
              <span class="snap-header__user-name">{{ userName }}</span>
              <span class="snap-header__user-role">{{ userRole }}</span>
            </div>
            <div class="snap-header__avatar">
              {{ userInitials }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Vertical Color Bar -->
      <div 
        class="snap-header__bar"
        [style.backgroundColor]="verticalColor"
      ></div>
      
      <!-- Breadcrumb -->
      @if (breadcrumb && breadcrumb.length > 0) {
        <nav class="snap-header__breadcrumb">
          @for (item of breadcrumb; track item.label; let i = $index; let last = $last) {
            @if (item.href && !last) {
              <a 
                [routerLink]="item.href"
                class="snap-header__breadcrumb-item"
                [class.snap-header__breadcrumb-item--first]="i === 0"
                [style.color]="i === 0 ? verticalColor : '#696969'"
              >
                {{ item.label }}
              </a>
            } @else {
              <span 
                class="snap-header__breadcrumb-item"
                [class.snap-header__breadcrumb-item--current]="last"
              >
                {{ item.label }}
              </span>
            }
            @if (!last) {
              <span class="snap-header__breadcrumb-separator">/</span>
            }
          }
        </nav>
      }
    </header>
  `,
  styleUrl: './snap-header.component.scss'
})
export class SnapHeaderComponent {
  @Input() vertical: SnapVertical = 'administracao';
  @Input() breadcrumb: SnapBreadcrumbItem[] = [];
  @Input() userName = '';
  @Input() userRole = '';
  @Input() userInitials = '';
  @Input() notificationCount = 0;
  @Input() isDarkMode = true;
  
  @Output() menuClicked = new EventEmitter<void>();
  @Output() themeToggled = new EventEmitter<void>();

  get verticalColor(): string {
    return VERTICAL_COLORS[this.vertical];
  }
}
