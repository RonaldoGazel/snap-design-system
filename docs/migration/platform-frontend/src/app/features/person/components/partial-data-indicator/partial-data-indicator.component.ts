import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-partial-data-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './partial-data-indicator.component.html',
  styleUrl: './partial-data-indicator.component.scss',
})
export class PartialDataIndicatorComponent {
  missingFields = input<string[]>([]);
  message = input<string>('Identificação incompleta');
}
