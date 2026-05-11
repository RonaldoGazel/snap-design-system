import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SnapSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'snap-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SnapSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="snap-select" [class.snap-select--open]="isOpen()">
      @if (label) {
        <label class="snap-select__label">
          {{ label }}
        </label>
      }
      
      <button
        type="button"
        class="snap-select__trigger"
        [disabled]="disabled"
        (click)="toggleDropdown()"
        (blur)="onBlur()"
      >
        <span class="snap-select__value" [class.snap-select__value--placeholder]="!selectedOption">
          {{ selectedOption?.label || placeholder }}
        </span>
        <svg 
          class="snap-select__chevron" 
          [class.snap-select__chevron--open]="isOpen()"
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      @if (isOpen()) {
        <div class="snap-select__dropdown">
          @for (option of options; track option.value) {
            <button
              type="button"
              class="snap-select__option"
              [class.snap-select__option--selected]="option.value === value"
              (click)="selectOption(option)"
            >
              {{ option.label }}
              @if (option.value === value) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './snap-select.component.scss'
})
export class SnapSelectComponent implements ControlValueAccessor {
  @Input() options: SnapSelectOption[] = [];
  @Input() placeholder = 'Selecione uma opção';
  @Input() label = '';
  @Input() disabled = false;
  @Input() value = '';
  
  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);
  
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get selectedOption(): SnapSelectOption | undefined {
    return this.options.find(opt => opt.value === this.value);
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen.update(v => !v);
    }
  }

  selectOption(option: SnapSelectOption): void {
    this.value = option.value;
    this.valueChange.emit(option.value);
    this.onChange(option.value);
    this.isOpen.set(false);
  }

  onBlur(): void {
    // Delay to allow click on option
    setTimeout(() => {
      this.isOpen.set(false);
      this.onTouched();
    }, 150);
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
