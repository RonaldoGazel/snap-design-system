import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SnapModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

@Component({
  selector: 'snap-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="snap-modal-overlay" (click)="onOverlayClick($event)">
        <div 
          class="snap-modal" 
          [class]="modalClasses"
          (click)="$event.stopPropagation()"
        >
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
  styleUrl: './snap-modal.component.scss'
})
export class SnapModalComponent {
  @Input() open = false;
  @Input() size: SnapModalSize = 'md';
  @Input() closeOnOverlayClick = true;
  
  @Output() closed = new EventEmitter<void>();

  get modalClasses(): string {
    return `snap-modal--${this.size}`;
  }

  onOverlayClick(event: MouseEvent): void {
    if (this.closeOnOverlayClick) {
      this.closed.emit();
    }
  }
}

// ===========================================
// SNAP MODAL HEADER
// ===========================================

@Component({
  selector: 'snap-modal-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="snap-modal-header">
      <div class="snap-modal-header__left">
        @if (showIcon) {
          <span class="snap-modal-header__icon">
            <ng-content select="[icon]"></ng-content>
          </span>
        }
        <h2 class="snap-modal-header__title">{{ title }}</h2>
      </div>
      <button 
        class="snap-modal-header__close" 
        type="button"
        (click)="onClose()"
        aria-label="Fechar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .snap-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--snap-spacing-4) var(--snap-spacing-6);
      border-bottom: 1px solid var(--snap-border-default);
      
      &__left {
        display: flex;
        align-items: center;
        gap: var(--snap-spacing-3);
      }
      
      &__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--snap-text-secondary);
      }
      
      &__title {
        font-family: var(--snap-font-title);
        font-size: var(--snap-text-lg);
        font-weight: var(--snap-font-semibold);
        color: var(--snap-text-primary);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      &__close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: var(--snap-text-secondary);
        cursor: pointer;
        border-radius: var(--snap-radius-md);
        transition: all 0.2s ease;
        
        &:hover {
          background-color: var(--snap-surface-2);
          color: var(--snap-text-primary);
        }
      }
    }
  `]
})
export class SnapModalHeaderComponent {
  @Input() title = '';
  @Input() showIcon = true;
  
  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }
}

// ===========================================
// SNAP MODAL CONTENT
// ===========================================

@Component({
  selector: 'snap-modal-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="snap-modal-content">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .snap-modal-content {
      padding: var(--snap-spacing-6);
    }
  `]
})
export class SnapModalContentComponent {}

// ===========================================
// SNAP MODAL FOOTER
// ===========================================

@Component({
  selector: 'snap-modal-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="snap-modal-footer" [class.snap-modal-footer--with-margin]="withTopMargin">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .snap-modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--snap-spacing-4);
      
      &--with-margin {
        margin-top: var(--snap-spacing-6);
      }
    }
  `]
})
export class SnapModalFooterComponent {
  @Input() withTopMargin = false;
}
