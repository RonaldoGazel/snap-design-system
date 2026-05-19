import { ChangeDetectionStrategy, Component, computed, inject, model, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { NotificacoesService } from '../../services/notificacoes.service';
import { CategoriaNotificacao, PrioridadeNotificacao } from '../../models/notification.model';

@Component({
  selector: 'app-painel-notificacoes',
  standalone: true,
  imports: [DatePipe, FormsModule, DrawerModule, ButtonModule, SelectModule, TagModule],
  templateUrl: './painel-notificacoes.html',
  styleUrl: './painel-notificacoes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelNotificacoesComponent {
  private readonly notificacoesService = inject(NotificacoesService);

  readonly visible = model.required<boolean>();

  readonly filtroCategoria = signal<CategoriaNotificacao | null>(null);

  readonly categoriasDisponiveis = [
    { label: 'Todas', value: null },
    { label: 'Alertas de Monitoramento', value: 'alerta-monitoramento' as CategoriaNotificacao },
    { label: 'Eventos de Mudança', value: 'evento-mudanca' as CategoriaNotificacao },
    { label: 'Pendências de Análise', value: 'pendencia-analise' as CategoriaNotificacao },
    { label: 'Falhas de Integração', value: 'falha-integracao' as CategoriaNotificacao },
  ];

  readonly notificacoesFiltradas = computed(() => {
    const filtro = this.filtroCategoria();
    const todas = this.notificacoesService.notificacoes();
    if (!filtro) return todas;
    return todas.filter((n) => n.categoria === filtro);
  });

  readonly naoLidas = computed(() => this.notificacoesService.naoLidas());

  readonly severidadeMap: Record<PrioridadeNotificacao, 'danger' | 'warn' | 'info' | 'success'> = {
    CRITICA: 'danger',
    ALTA: 'warn',
    MEDIA: 'info',
    BAIXA: 'success',
  };

  onMarcarComoLida(id: string): void {
    this.notificacoesService.marcarComoLida(id);
  }

  onMarcarTodasComoLidas(): void {
    this.notificacoesService.marcarTodasComoLidas();
  }

  getSeveridade(prioridade: PrioridadeNotificacao): 'danger' | 'warn' | 'info' | 'success' {
    return this.severidadeMap[prioridade] ?? 'info';
  }
}
