import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatusDivergencia } from '../../models';

@Component({
  selector: 'app-divergence-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './divergence-indicator.component.html',
  styleUrl: './divergence-indicator.component.scss',
})
export class DivergenceIndicatorComponent {
  status = input.required<StatusDivergencia>();
  fonteA = input<string>('SIPEN');
  fonteB = input<string>('SNAP');
  valorA = input<string>();
  valorB = input<string>();

  protected statusLabel = computed<string>(() => {
    const labels: Record<StatusDivergencia, string> = {
      'sem-divergencia': 'Sem divergência',
      'divergencia-identificada': 'Divergência identificada',
      'divergencia-resolvida': 'Divergência resolvida',
      'divergencia-mantida-como-sinal': 'Mantida como sinal',
    };
    return labels[this.status()];
  });

  protected statusIcon = computed<string>(() => {
    const icons: Record<StatusDivergencia, string> = {
      'sem-divergencia': 'pi pi-check-circle',
      'divergencia-identificada': 'pi pi-exclamation-triangle',
      'divergencia-resolvida': 'pi pi-check',
      'divergencia-mantida-como-sinal': 'pi pi-info-circle',
    };
    return icons[this.status()];
  });

  protected hasValues = computed(() => !!this.valorA() || !!this.valorB());
}
