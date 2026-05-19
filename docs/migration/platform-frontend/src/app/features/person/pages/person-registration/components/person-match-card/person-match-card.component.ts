import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

import type { PersonMatch } from '../../../../models/registration.model';
import {
  formatMatchType,
  formatProfileType,
  formatConfidenceScore,
  getPersonInitials,
} from '../../../../models/registration.utils';

@Component({
  selector: 'app-person-match-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-match-card.component.html',
  styleUrl: './person-match-card.component.scss',
  imports: [TagModule, ButtonModule, AvatarModule],
})
export class PersonMatchCardComponent {
  /** The person match data to display. */
  readonly person = input.required<PersonMatch>();

  /** Emitted when the card body is clicked (external cards only — opens drawer). */
  readonly cardClicked = output<PersonMatch>();

  /** Emitted when the "Cadastrar" button is clicked (external cards). */
  readonly registerClicked = output<PersonMatch>();

  /** Emitted when the "Abrir prontuário" button is clicked (local cards). */
  readonly openProfileClicked = output<PersonMatch>();

  /** Whether this person is from the local database. */
  readonly isLocal = computed(() => this.person().source === 'BASE_LOCAL');

  /** CSS class for the source badge. */
  readonly sourceBadgeClass = computed(() => {
    const source = this.person().source;
    switch (source) {
      case 'BASE_LOCAL':
        return 'preg-pcard__badge--local';
      case 'SIPEN':
        return 'preg-pcard__badge--sipen';
      case 'SNAP':
        return 'preg-pcard__badge--snap';
      default:
        return '';
    }
  });

  /** Human-readable source label. */
  readonly sourceLabel = computed(() => {
    const source = this.person().source;
    switch (source) {
      case 'BASE_LOCAL':
        return 'Base Local';
      case 'SIPEN':
        return 'SIPEN';
      case 'SNAP':
        return 'SNAP';
      default:
        return source;
    }
  });

  // ── Template helpers ──

  protected readonly formatMatchType = formatMatchType;
  protected readonly formatProfileType = formatProfileType;
  protected readonly formatConfidenceScore = formatConfidenceScore;
  protected readonly getPersonInitials = getPersonInitials;

  protected onCardClick(): void {
    if (!this.isLocal()) {
      this.cardClicked.emit(this.person());
    }
  }

  protected onRegisterClick(event: Event): void {
    event.stopPropagation();
    this.registerClicked.emit(this.person());
  }

  protected onOpenProfileClick(event: Event): void {
    event.stopPropagation();
    this.openProfileClicked.emit(this.person());
  }
}
