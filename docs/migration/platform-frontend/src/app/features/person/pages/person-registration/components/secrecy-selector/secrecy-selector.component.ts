import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import type { SecrecyOption, SecrecyOptionConfig } from '../../../../models/registration.model';
import { MOCK_CONFIG } from '../../../../data/registration-mock.data';

@Component({
  selector: 'app-secrecy-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './secrecy-selector.component.html',
  styleUrl: './secrecy-selector.component.scss',
})
export class SecrecySelectorComponent {
  /** The currently selected secrecy option (two-way binding). */
  readonly selectedSecrecy = model<SecrecyOption | null>(null);

  /** Available secrecy options. Defaults to MOCK_CONFIG values. */
  readonly options = input<SecrecyOptionConfig[]>(MOCK_CONFIG.defaultVisibilityOptions);

  /** Reserved sector name shown when "Reservado" is selected. */
  protected readonly reservedSectorName = MOCK_CONFIG.reservedSector.name;

  /**
   * Select a secrecy option.
   */
  protected selectOption(option: SecrecyOptionConfig): void {
    this.selectedSecrecy.set(option.id);
  }
}
