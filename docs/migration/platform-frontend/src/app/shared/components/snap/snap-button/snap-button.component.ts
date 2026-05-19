import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SnapButtonVariant = 'solid' | 'outline' | 'ghost' | 'primary';
export type SnapButtonSize = 'default' | 'sm' | 'modal' | 'card';

@Component({
  selector: 'snap-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <span class="snap-button__spinner"></span>
      } @else if (iconPosition === 'left') {
        <ng-content select="[icon]"></ng-content>
      }
      <span class="snap-button__text">
        <ng-content></ng-content>
      </span>
      @if (!loading && iconPosition === 'right') {
        <ng-content select="[icon]"></ng-content>
      }
    </button>
  `,
  styleUrl: './snap-button.component.scss'
})
export class SnapButtonComponent {
  @Input() variant: SnapButtonVariant = 'solid';
  @Input() size: SnapButtonSize = 'default';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() customClass = '';
  
  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = [
      'snap-button',
      `snap-button--${this.variant}`,
      `snap-button--${this.size}`,
    ];
    
    if (this.disabled) classes.push('snap-button--disabled');
    if (this.loading) classes.push('snap-button--loading');
    if (this.fullWidth) classes.push('snap-button--full-width');
    if (this.customClass) classes.push(this.customClass);
    
    return classes.join(' ');
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
