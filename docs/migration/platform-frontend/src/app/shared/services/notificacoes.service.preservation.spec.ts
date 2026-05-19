/**
 * Preservation Tests — NotificacoesService.marcarComoLida()
 *
 * These tests MUST PASS on unfixed code — they capture baseline behavior to preserve.
 * Validates: Requirements 3.7
 *
 * Property 2: Preservation — marcarComoLida() decrements naoLidas correctly
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { NotificacoesService } from './notificacoes.service';
import { NotificacaoCompleta } from '../models/notification.model';

function makeNotificacao(id: string, is_read: boolean): NotificacaoCompleta {
  return {
    id,
    user_id: 'user-1',
    title: `Notificação ${id}`,
    message: 'Mensagem de teste',
    type: 'info',
    is_read,
    created_at: '2024-01-01T00:00:00Z',
    categoria: 'alerta-monitoramento',
    prioridade: 'MEDIA',
  };
}

/**
 * Validates: Requirements 3.7
 */
describe('NotificacoesService — marcarComoLida() Preservation Tests', () => {
  let service: NotificacoesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacoesService);
  });

  it('marcarComoLida() decrements naoLidas when marking an unread item as read', () => {
    const items: NotificacaoCompleta[] = [
      makeNotificacao('1', false),
      makeNotificacao('2', false),
      makeNotificacao('3', true),
    ];

    // Set initial state via private signal access (as documented in task instructions)
    (service as any)._notificacoes.set(items);

    const before = service.naoLidas();
    expect(before).toBe(2);

    service.marcarComoLida('1');

    expect(service.naoLidas()).toBe(1);
  });

  it('marcarComoLida() does not change naoLidas when item is already read', () => {
    const items: NotificacaoCompleta[] = [makeNotificacao('1', false), makeNotificacao('2', true)];

    (service as any)._notificacoes.set(items);

    const before = service.naoLidas();
    service.marcarComoLida('2'); // already read
    expect(service.naoLidas()).toBe(before);
  });

  it('marcarComoLida() does not change naoLidas when id does not exist', () => {
    const items: NotificacaoCompleta[] = [makeNotificacao('1', false)];

    (service as any)._notificacoes.set(items);

    const before = service.naoLidas();
    service.marcarComoLida('nonexistent');
    expect(service.naoLidas()).toBe(before);
  });
});
