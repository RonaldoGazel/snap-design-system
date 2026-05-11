import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { NotificationBadgeComponent } from './notification-badge';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/document.models';
import { ApiResponse } from '../../../../../shared/models/api-response.model';

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'TRAMITATION',
    entityType: 'processes',
    entityId: 'proc-1',
    title: 'Nova tramitação',
    message: 'Processo tramitado para seu setor',
    isRead: false,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'REVIEW',
    entityType: 'documents',
    entityId: 'doc-1',
    title: 'Revisão pendente',
    message: 'Documento aguardando sua revisão',
    isRead: false,
    createdAt: '2025-01-14T08:00:00Z',
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'FORMALIZATION',
    entityType: 'documents',
    entityId: 'doc-2',
    title: 'Documento formalizado',
    message: 'Documento foi formalizado com sucesso',
    isRead: true,
    createdAt: '2025-01-13T16:00:00Z',
  },
];

function createMockNotificationService(unreadCount = 2) {
  return {
    getUnreadCount: vi
      .fn()
      .mockReturnValue(
        of({ success: true, data: { count: unreadCount } } as ApiResponse<{ count: number }>),
      ),
    getNotifications: vi.fn().mockReturnValue(
      of({
        success: true,
        data: { items: mockNotifications, total: 3, page: 1, limit: 5 },
      } as ApiResponse<{ items: Notification[]; total: number; page: number; limit: number }>),
    ),
    markAsRead: vi.fn().mockReturnValue(
      of({
        success: true,
        data: { ...mockNotifications[0], isRead: true },
      } as ApiResponse<Notification>),
    ),
  };
}

@Component({
  standalone: true,
  imports: [NotificationBadgeComponent],
  template: `<app-notification-badge />`,
})
class TestHostComponent {}

describe('NotificationBadgeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockService: ReturnType<typeof createMockNotificationService>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockService = createMockNotificationService();
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: NotificationService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  // --- Property 13: NotificationBadge exibe contagem correta de não lidas ---
  // **Validates: Requirement 16.1**

  it('should display badge with correct unread count', () => {
    const badge = fixture.debugElement.query(By.css('p-badge'));
    expect(badge).toBeTruthy();
    const value = badge.componentInstance.value;
    const resolved = typeof value === 'function' ? value() : value;
    expect(resolved).toBe('2');
  });

  it('should hide badge when unread count is 0', () => {
    mockService.getUnreadCount.mockReturnValue(
      of({ success: true, data: { count: 0 } } as ApiResponse<{ count: number }>),
    );

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('p-badge'));
    expect(badge).toBeNull();
  });

  // --- Dropdown panel ---

  it('should show notification panel on click', () => {
    let panel = fixture.debugElement.query(By.css('.notification-badge__panel'));
    expect(panel).toBeNull();

    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    panel = fixture.debugElement.query(By.css('.notification-badge__panel'));
    expect(panel).toBeTruthy();
  });

  it('should display notifications in the panel', () => {
    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.notification-badge__item'));
    expect(items.length).toBe(3);

    expect(items[0].nativeElement.textContent).toContain('Nova tramitação');
    expect(items[0].nativeElement.textContent).toContain('Processo tramitado para seu setor');

    expect(items[1].nativeElement.textContent).toContain('Revisão pendente');
    expect(items[2].nativeElement.textContent).toContain('Documento formalizado');
  });

  it('should show unread indicator for unread notifications', () => {
    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.notification-badge__item'));
    const unreadItems = items.filter((i) => i.nativeElement.classList.contains('is-unread'));
    expect(unreadItems.length).toBe(2);

    const indicators = fixture.debugElement.queryAll(By.css('.notification-badge__unread-dot'));
    expect(indicators.length).toBe(2);
  });

  // --- Mark as read ---

  it('should call markAsRead when clicking an unread notification', () => {
    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.notification-badge__item'));
    items[0].triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(mockService.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('should not call markAsRead when clicking an already read notification', () => {
    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.notification-badge__item'));
    items[2].triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(mockService.markAsRead).not.toHaveBeenCalled();
  });

  // --- Navigation ---

  it('should navigate to entity on notification click', () => {
    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.notification-badge__item'));
    items[0].triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'processes', 'proc-1']);
  });

  it('should close panel after navigating', () => {
    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.notification-badge__item'));
    items[0].triggerEventHandler('click', null);
    fixture.detectChanges();

    const panel = fixture.debugElement.query(By.css('.notification-badge__panel'));
    expect(panel).toBeNull();
  });

  // --- Service interaction ---

  it('should call getUnreadCount on init', () => {
    expect(mockService.getUnreadCount).toHaveBeenCalled();
  });

  it('should call getNotifications with limit 5 on init', () => {
    expect(mockService.getNotifications).toHaveBeenCalledWith({ limit: 5 });
  });

  it('should have correct selector app-notification-badge', () => {
    const component = fixture.debugElement.query(By.directive(NotificationBadgeComponent));
    expect(component).toBeTruthy();
    expect(component.nativeElement.tagName.toLowerCase()).toBe('app-notification-badge');
  });

  // --- Empty state ---

  it('should show empty message when no notifications', () => {
    mockService.getNotifications.mockReturnValue(
      of({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 5 },
      }),
    );

    const button = fixture.debugElement.query(By.css('p-button'));
    button.triggerEventHandler('onClick', null);
    fixture.detectChanges();

    // Reload notifications on panel open
    const comp = fixture.debugElement.query(By.directive(NotificationBadgeComponent));
    comp.componentInstance.notifications.set([]);
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('.notification-badge__empty'));
    expect(empty).toBeTruthy();
    expect(empty.nativeElement.textContent).toContain('Nenhuma notificação');
  });
});
