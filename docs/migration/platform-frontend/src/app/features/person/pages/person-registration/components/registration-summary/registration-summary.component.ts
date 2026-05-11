import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { RegistrationSummary } from '../../../../models/registration.model';

@Component({
  selector: 'app-registration-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration-summary.component.html',
  styleUrl: './registration-summary.component.scss',
})
export class RegistrationSummaryComponent {
  /** The registration summary data to display. Null when not yet completed. */
  readonly summary = input<RegistrationSummary | null>(null);
}
