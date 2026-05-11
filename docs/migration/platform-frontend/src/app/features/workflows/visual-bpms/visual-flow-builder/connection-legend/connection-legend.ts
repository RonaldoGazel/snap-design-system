import { Component, signal, output, ChangeDetectionStrategy} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface ConnectionTypeVisibility {
  AVANCO: boolean;
  RETORNO: boolean;
  INTRA_ETAPA: boolean;
  AUTO_REFERENCIA: boolean;
  AUTO_LINK: boolean;
}

@Component({
  selector: 'app-connection-legend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule
  ],
  templateUrl: './connection-legend.html',
  styleUrl: './connection-legend.css',
})
export class ConnectionLegendComponent {
  readonly visibility = signal<ConnectionTypeVisibility>({
    AVANCO: true,
    RETORNO: true,
    INTRA_ETAPA: true,
    AUTO_REFERENCIA: true,
    AUTO_LINK: true,
  });

  readonly visibilityChanged = output<ConnectionTypeVisibility>();

  toggle(key: keyof ConnectionTypeVisibility): void {
    this.visibility.update((v) => ({ ...v, [key]: !v[key] }));
    this.visibilityChanged.emit(this.visibility());
  }
}
