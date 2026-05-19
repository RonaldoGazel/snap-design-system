import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';

import type {
  FullProfile,
  PersonMatch,
  SecrecyOption,
} from '../../../../models/registration.model';
import {
  formatConfidenceScore,
  formatMatchType,
  formatProfileType,
  getPersonInitials,
} from '../../../../models/registration.utils';
import { SecrecySelectorComponent } from '../secrecy-selector/secrecy-selector.component';

@Component({
  selector: 'app-review-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-drawer.component.html',
  styleUrl: './review-drawer.component.scss',
  imports: [DrawerModule, ButtonModule, SecrecySelectorComponent],
})
export class ReviewDrawerComponent {
  /** The person match being reviewed. */
  readonly person = input<PersonMatch | null>(null);

  /** Full profile data (loaded asynchronously after drawer opens). */
  readonly fullProfile = input<FullProfile | null>(null);

  /** Whether the drawer is open (two-way binding). */
  readonly isOpen = model<boolean>(false);

  /** Emitted when the user confirms registration with a secrecy selection. */
  readonly registerConfirmed = output<{ person: PersonMatch; secrecy: SecrecyOption }>();

  /** Internal secrecy selection state. */
  protected readonly selectedSecrecy = signal<SecrecyOption | null>(null);

  // ── Template helpers ──

  protected readonly formatConfidenceScore = formatConfidenceScore;
  protected readonly formatMatchType = formatMatchType;
  protected readonly formatProfileType = formatProfileType;
  protected readonly getPersonInitials = getPersonInitials;

  /**
   * Confirm registration with the selected person and secrecy option.
   */
  protected onConfirm(): void {
    const p = this.person();
    const s = this.selectedSecrecy();
    if (p && s) {
      this.registerConfirmed.emit({ person: p, secrecy: s });
    }
  }

  /**
   * Close the drawer and reset secrecy selection.
   */
  protected onClose(): void {
    this.isOpen.set(false);
    this.selectedSecrecy.set(null);
  }
}
