import { TestBed } from '@angular/core/testing';
import { NotificacoesService } from './notificacoes.service';
import { NotificacaoCompleta } from '../models/notification.model';

describe('NotificacoesService', () => {
  let service: NotificacoesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacoesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('notificacoes signal', () => {
    it('should start with empty array', () => {
      expect(service.notificacoes()).toEqual([]);
    });
  });

  describe('naoLidas computed', () => {
    it('should return 0 when no notifications', () => {
      expect(service.naoLidas()).toBe(0);
    });

    it('should count unread notifications', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Test 2',
          message: 'Message 2',
          type: 'test',
          is_read: true,
          categoria: 'evento-mudanca',
          prioridade: 'BAIXA',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: 'user1',
          title: 'Test 3',
          message: 'Message 3',
          type: 'test',
          is_read: false,
          categoria: 'pendencia-analise',
          prioridade: 'ALTA',
          created_at: new Date().toISOString(),
        },
      ];

      // Manually set notifications for testing
      (service as any)._notificacoes.set(notificacoes);

      expect(service.naoLidas()).toBe(2);
    });
  });

  describe('marcarComoLida', () => {
    it('should mark a notification as read', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test',
          message: 'Message',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      service.marcarComoLida('1');

      expect(service.notificacoes()[0].is_read).toBe(true);
    });

    it('should not affect other notifications', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Test 2',
          message: 'Message 2',
          type: 'test',
          is_read: false,
          categoria: 'evento-mudanca',
          prioridade: 'BAIXA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      service.marcarComoLida('1');

      expect(service.notificacoes()[0].is_read).toBe(true);
      expect(service.notificacoes()[1].is_read).toBe(false);
    });

    it('should do nothing if notification not found', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test',
          message: 'Message',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      service.marcarComoLida('nonexistent');

      expect(service.notificacoes()[0].is_read).toBe(false);
    });

    it('should decrement naoLidas by 1', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Test 2',
          message: 'Message 2',
          type: 'test',
          is_read: false,
          categoria: 'evento-mudanca',
          prioridade: 'BAIXA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      const initialCount = service.naoLidas();

      service.marcarComoLida('1');

      expect(service.naoLidas()).toBe(initialCount - 1);
    });
  });

  describe('marcarTodasComoLidas', () => {
    it('should mark all notifications as read', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Test 2',
          message: 'Message 2',
          type: 'test',
          is_read: false,
          categoria: 'evento-mudanca',
          prioridade: 'BAIXA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      service.marcarTodasComoLidas();

      expect(service.notificacoes().every((n) => n.is_read)).toBe(true);
    });

    it('should result in naoLidas === 0', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Test 2',
          message: 'Message 2',
          type: 'test',
          is_read: false,
          categoria: 'evento-mudanca',
          prioridade: 'BAIXA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      service.marcarTodasComoLidas();

      expect(service.naoLidas()).toBe(0);
    });

    it('should be idempotent', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test',
          message: 'Message',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      service.marcarTodasComoLidas();
      const firstCall = service.naoLidas();

      service.marcarTodasComoLidas();
      const secondCall = service.naoLidas();

      expect(firstCall).toBe(secondCall);
      expect(secondCall).toBe(0);
    });
  });

  describe('filtrarPorCategoria', () => {
    it('should return notifications matching category', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Test 2',
          message: 'Message 2',
          type: 'test',
          is_read: false,
          categoria: 'evento-mudanca',
          prioridade: 'BAIXA',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: 'user1',
          title: 'Test 3',
          message: 'Message 3',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'ALTA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      const filtered = service.filtrarPorCategoria('alerta-monitoramento');

      expect(filtered).toHaveLength(2);
      expect(filtered.every((n) => n.categoria === 'alerta-monitoramento')).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test',
          message: 'Message',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);
      const filtered = service.filtrarPorCategoria('evento-mudanca');

      expect(filtered).toHaveLength(0);
    });

    it('should return all categories when filtering', () => {
      const notificacoes: NotificacaoCompleta[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'test',
          is_read: false,
          categoria: 'alerta-monitoramento',
          prioridade: 'MEDIA',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Test 2',
          message: 'Message 2',
          type: 'test',
          is_read: false,
          categoria: 'evento-mudanca',
          prioridade: 'BAIXA',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: 'user1',
          title: 'Test 3',
          message: 'Message 3',
          type: 'test',
          is_read: false,
          categoria: 'pendencia-analise',
          prioridade: 'ALTA',
          created_at: new Date().toISOString(),
        },
        {
          id: '4',
          user_id: 'user1',
          title: 'Test 4',
          message: 'Message 4',
          type: 'test',
          is_read: false,
          categoria: 'falha-integracao',
          prioridade: 'CRITICA',
          created_at: new Date().toISOString(),
        },
      ];

      (service as any)._notificacoes.set(notificacoes);

      const alertas = service.filtrarPorCategoria('alerta-monitoramento');
      const eventos = service.filtrarPorCategoria('evento-mudanca');
      const pendencias = service.filtrarPorCategoria('pendencia-analise');
      const falhas = service.filtrarPorCategoria('falha-integracao');

      expect(alertas).toHaveLength(1);
      expect(eventos).toHaveLength(1);
      expect(pendencias).toHaveLength(1);
      expect(falhas).toHaveLength(1);
    });
  });
});
