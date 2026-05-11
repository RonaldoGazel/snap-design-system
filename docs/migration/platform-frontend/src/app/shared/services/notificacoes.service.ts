import { Injectable, computed, signal } from '@angular/core';
import { CategoriaNotificacao, NotificacaoCompleta } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private readonly _notificacoes = signal<NotificacaoCompleta[]>([]);

  readonly notificacoes = this._notificacoes.asReadonly();

  readonly naoLidas = computed(() => this._notificacoes().filter((n) => !n.is_read).length);

  marcarComoLida(id: string): void {
    const notificacoes = this._notificacoes();
    const index = notificacoes.findIndex((n) => n.id === id);
    if (index !== -1) {
      const atualizada = [...notificacoes];
      atualizada[index] = { ...atualizada[index], is_read: true };
      this._notificacoes.set(atualizada);
    }
  }

  marcarTodasComoLidas(): void {
    const notificacoes = this._notificacoes();
    const atualizadas = notificacoes.map((n) => ({ ...n, is_read: true }));
    this._notificacoes.set(atualizadas);
  }

  setNotificacoes(items: NotificacaoCompleta[]): void {
    this._notificacoes.set(items);
  }

  filtrarPorCategoria(categoria: CategoriaNotificacao): NotificacaoCompleta[] {
    return this._notificacoes().filter((n) => n.categoria === categoria);
  }
}
