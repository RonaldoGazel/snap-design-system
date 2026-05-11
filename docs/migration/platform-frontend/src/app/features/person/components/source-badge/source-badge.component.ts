import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TipoFonte } from '../../models';

@Component({
  selector: 'app-source-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-badge.component.html',
  styleUrl: './source-badge.component.scss',
})
export class SourceBadgeComponent {
  fonte = input.required<TipoFonte>();

  protected label = computed<string>(() => {
    const labels: Record<TipoFonte, string> = {
      sipen: 'SIPEN',
      snap: 'SNAP',
      manual: 'Manual',
    };
    return labels[this.fonte()];
  });
}
