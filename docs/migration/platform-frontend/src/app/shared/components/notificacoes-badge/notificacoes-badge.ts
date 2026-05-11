import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { NotificacoesService } from '../../services/notificacoes.service';

@Component({
  selector: 'app-notificacoes-badge',
  standalone: true,
  imports: [ButtonModule, BadgeModule],
  templateUrl: './notificacoes-badge.html',
  styleUrl: './notificacoes-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacoesBadgeComponent {
  private readonly notificacoesService = inject(NotificacoesService);

  readonly abrirNotificacoes = output<void>();

  readonly naoLidas = computed(() => this.notificacoesService.naoLidas());
  readonly mostrarBadge = computed(() => this.naoLidas() > 0);
  readonly ariaLabel = computed(() =>
    this.naoLidas() > 0 ? `Notificações: ${this.naoLidas()} não lidas` : 'Notificações',
  );

  onAbrirNotificacoes(): void {
    this.abrirNotificacoes.emit();
  }
}
