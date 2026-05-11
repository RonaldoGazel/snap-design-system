import { Component, input, output, ChangeDetectionStrategy} from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { VisualFlowValidationError } from '../../../models/visual-bpms.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-validation-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    TranslateModule
  ],
  templateUrl: './validation-panel.html',
  styleUrl: './validation-panel.css',
})
export class ValidationPanelComponent {
  readonly errors = input.required<VisualFlowValidationError[]>();
  readonly count = input<number>(0);
  readonly close = output<void>();

  getIcon(error: VisualFlowValidationError): string {
    switch (error.entity_type) {
      case 'STAGE':
        return 'pi pi-th-large';
      case 'PROFILE':
        return 'pi pi-user';
      default:
        return 'pi pi-exclamation-triangle';
    }
  }
}
