import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { SourceStatus } from '../../../../models/registration.model';

@Component({
  selector: 'app-registration-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration-overlay.component.html',
  styleUrl: './registration-overlay.component.scss',
})
export class RegistrationOverlayComponent {
  /** Whether the overlay is visible (shown during active queries). */
  readonly isVisible = input<boolean>(false);

  /** Current status for each data source (Base Local, SIPEN, SNAP). */
  readonly sourceStatuses = input<SourceStatus[]>([]);
}
