import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { interval, switchMap } from 'rxjs';

import { Notification } from '../../models/document.models';
import { NotificationService } from '../../services/notification.service';
import { DateFormatPipe } from '../../../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [BadgeModule, ButtonModule, DateFormatPipe],
  templateUrl: './notification-badge.html',
  styleUrl: './notification-badge.css',
})
export class NotificationBadgeComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  unreadCount = signal(0);
  notifications = signal<Notification[]>([]);
  panelVisible = signal(false);

  showBadge = computed(() => this.unreadCount() > 0);

  ngOnInit(): void {
    this.loadUnreadCount();
    this.loadNotifications();
    this.startPolling();
  }

  togglePanel(): void {
    this.panelVisible.update((v) => !v);
    if (this.panelVisible()) {
      this.loadNotifications();
    }
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.unreadCount.update((c) => Math.max(0, c - 1));
          this.notifications.update((list) =>
            list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
          );
        },
      });
    }
    this.panelVisible.set(false);
    this.router.navigate(['/intelligence', notification.entityType, notification.entityId]);
  }

  private loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.unreadCount.set(res.data.count);
        }
      },
    });
  }

  private loadNotifications(): void {
    this.notificationService.getNotifications({ limit: 5 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notifications.set(res.data.items);
        }
      },
    });
  }

  private startPolling(): void {
    interval(30000)
      .pipe(
        switchMap(() => this.notificationService.getUnreadCount()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.unreadCount.set(res.data.count);
          }
        },
      });
  }
}
