import { Injectable, inject, NgZone } from '@angular/core';
import { BroadcastChannelService } from './broadcast-channel.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IdleTrackerService {
  private readonly broadcastChannel = inject(BroadcastChannelService);
  private readonly ngZone = inject(NgZone);

  private lastActivityTimestamp = Date.now();
  private warningShown = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;
  private boundHandlers: Array<{ event: string; handler: EventListener }> = [];
  private unsubBroadcast: (() => void) | null = null;
  private onLogout: (() => void) | null = null;
  private onWarning: (() => void) | null = null;

  private get idleTimeoutMs(): number {
    return environment.auth.idleTimeoutMinutes * 60_000;
  }

  private get warningThresholdMs(): number {
    return this.idleTimeoutMs - 2 * 60_000;
  }

  get isIdle(): boolean {
    return Date.now() - this.lastActivityTimestamp >= this.idleTimeoutMs;
  }

  start(callbacks: { onLogout: () => void; onWarning: () => void }): void {
    this.onLogout = callbacks.onLogout;
    this.onWarning = callbacks.onWarning;

    // DOM event listeners (throttled to 1 event/10s)
    const throttledRecord = this.createThrottledRecordActivity();
    for (const event of ['mousemove', 'keydown', 'touchstart']) {
      const handler = throttledRecord as EventListener;
      document.addEventListener(event, handler, { passive: true });
      this.boundHandlers.push({ event, handler });
    }

    // Visibility change
    const visHandler = (() => this.onVisibilityChange()) as EventListener;
    document.addEventListener('visibilitychange', visHandler);
    this.boundHandlers.push({ event: 'visibilitychange', handler: visHandler });

    // Cross-tab activity
    this.unsubBroadcast = this.broadcastChannel.onMessage(msg => {
      if (msg.type === 'user_active') {
        this.onCrossTabActivity(msg.timestamp);
      }
    });

    // Periodic check (every 30s) — run outside Angular zone to avoid triggering change detection
    this.ngZone.runOutsideAngular(() => {
      this.checkInterval = setInterval(() => this.checkIdle(), 30_000);
    });
  }

  stop(): void {
    for (const { event, handler } of this.boundHandlers) {
      document.removeEventListener(event, handler);
    }
    this.boundHandlers = [];

    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }

    if (this.unsubBroadcast) {
      this.unsubBroadcast();
      this.unsubBroadcast = null;
    }

    this.onLogout = null;
    this.onWarning = null;
  }

  private recordActivity(): void {
    this.lastActivityTimestamp = Date.now();
    this.warningShown = false;
    this.broadcastChannel.broadcast({
      type: 'user_active',
      timestamp: this.lastActivityTimestamp,
    });
  }

  private onCrossTabActivity(timestamp: number): void {
    // Update timestamp but do NOT reset warningShown (only local DOM activity resets warning)
    this.lastActivityTimestamp = Math.max(this.lastActivityTimestamp, timestamp);
  }

  private checkIdle(): void {
    const elapsed = Date.now() - this.lastActivityTimestamp;

    if (elapsed >= this.idleTimeoutMs) {
      this.ngZone.run(() => this.onLogout?.());
      return;
    }

    if (elapsed >= this.warningThresholdMs && !this.warningShown) {
      this.warningShown = true;
      this.ngZone.run(() => this.onWarning?.());
    }
  }

  private onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.checkIdle();
    }
  }

  private createThrottledRecordActivity(): () => void {
    let throttled = false;
    return () => {
      if (throttled) return;
      throttled = true;
      this.recordActivity();
      this.throttleTimer = setTimeout(() => { throttled = false; }, 10_000);
    };
  }
}
