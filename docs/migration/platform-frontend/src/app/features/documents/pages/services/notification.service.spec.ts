import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { NotificationService, GetNotificationsParams } from './notification.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API_BASE_URL } from '../../../../shared/utils/constants';
import { Notification } from '../models/document.models';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    service = TestBed.inject(NotificationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- getNotifications ---------------------------------------------------

  describe('getNotifications()', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'TRAMITATION_RECEIVED',
        entityType: 'PROCESS',
        entityId: 'proc-1',
        title: 'Tramitação recebida',
        message: 'Processo 00001.000001/2025-01 foi tramitado para seu setor',
        isRead: false,
        createdAt: '2025-06-01T12:00:00Z',
      },
      {
        id: 'notif-2',
        userId: 'user-1',
        type: 'REVIEW_REQUESTED',
        entityType: 'DOCUMENT',
        entityId: 'doc-5',
        title: 'Revisão solicitada',
        message: 'Documento "Ofício 123" aguarda sua revisão',
        isRead: true,
        createdAt: '2025-05-30T09:00:00Z',
      },
    ];

    it('should GET /notifications with no params', () => {
      const mockResponse = {
        success: true,
        data: { items: mockNotifications, total: 2, page: 1, limit: 10 },
      };

      service.getNotifications().subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.items.length).toBe(2);
      });

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/notifications`));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should append query params for pagination', () => {
      const params: GetNotificationsParams = { page: 2, limit: 5 };

      const mockResponse = {
        success: true,
        data: { items: [], total: 2, page: 2, limit: 5 },
      };

      service.getNotifications(params).subscribe();

      const req = httpTesting.expectOne((r) => r.url.startsWith(`${API_BASE_URL}/notifications`));
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toContain('page=2');
      expect(req.request.urlWithParams).toContain('limit=5');
      req.flush(mockResponse);
    });
  });

  // -- getUnreadCount -----------------------------------------------------

  describe('getUnreadCount()', () => {
    it('should GET /notifications/unread-count and return the count', () => {
      const mockResponse = { success: true, data: { count: 7 } };

      service.getUnreadCount().subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.count).toBe(7);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/notifications/unread-count`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return zero when no unread notifications', () => {
      const mockResponse = { success: true, data: { count: 0 } };

      service.getUnreadCount().subscribe((res) => {
        expect(res.data?.count).toBe(0);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/notifications/unread-count`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // -- markAsRead ---------------------------------------------------------

  describe('markAsRead()', () => {
    it('should PUT /notifications/:id/read and return the updated notification', () => {
      const mockNotification: Notification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'TRAMITATION_RECEIVED',
        entityType: 'PROCESS',
        entityId: 'proc-1',
        title: 'Tramitação recebida',
        message: 'Processo 00001.000001/2025-01 foi tramitado para seu setor',
        isRead: true,
        createdAt: '2025-06-01T12:00:00Z',
      };

      const mockResponse = { success: true, data: mockNotification };

      service.markAsRead('notif-1').subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(res.data?.isRead).toBe(true);
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/notifications/notif-1/read`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });
});
