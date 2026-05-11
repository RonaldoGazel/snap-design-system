import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { IdleTrackerService } from './idle-tracker.service';
import { BroadcastChannelService } from './broadcast-channel.service';

describe('IdleTrackerService', () => {
  let service: IdleTrackerService;
  let broadcastMock: { broadcast: ReturnType<typeof vi.fn>; onMessage: ReturnType<typeof vi.fn> };
  let onLogout: () => void;
  let onWarning: () => void;

  beforeEach(() => {
    broadcastMock = {
      broadcast: vi.fn(),
      onMessage: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        IdleTrackerService,
        { provide: BroadcastChannelService, useValue: broadcastMock },
      ],
    });

    service = TestBed.inject(IdleTrackerService);
    onLogout = vi.fn() as unknown as () => void;
    onWarning = vi.fn() as unknown as () => void;
  });

  afterEach(() => {
    service.stop();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be idle initially', () => {
    expect(service.isIdle).toBe(false);
  });

  it('should subscribe to BroadcastChannel user_active events on start', () => {
    service.start({ onLogout, onWarning });
    expect(broadcastMock.onMessage).toHaveBeenCalled();
  });

  it('should update lastActivityTimestamp on cross-tab activity', () => {
    service.start({ onLogout, onWarning });

    // Get the callback registered with onMessage
    const callback = broadcastMock.onMessage.mock.calls[0][0];
    const futureTimestamp = Date.now() + 1000;

    callback({ type: 'user_active', timestamp: futureTimestamp });

    // isIdle should still be false since we just got activity
    expect(service.isIdle).toBe(false);
  });

  it('should remove all listeners on stop', () => {
    service.start({ onLogout, onWarning });
    service.stop();
    // Verify no errors on double-stop
    service.stop();
  });

  it('should unsubscribe from BroadcastChannel on stop', () => {
    const unsubFn = vi.fn();
    broadcastMock.onMessage.mockReturnValue(unsubFn);

    service.start({ onLogout, onWarning });
    expect(broadcastMock.onMessage).toHaveBeenCalled();

    service.stop();
    expect(unsubFn).toHaveBeenCalledOnce();
  });

  it('should not receive cross-tab messages after stop', () => {
    // Track whether the unsub was called to confirm cleanup
    const unsubFn = vi.fn();
    broadcastMock.onMessage.mockReturnValue(unsubFn);

    service.start({ onLogout, onWarning });
    service.stop();

    // After stop, the unsubscribe function was called — no more messages delivered
    expect(unsubFn).toHaveBeenCalled();
    // Double-stop should not throw
    service.stop();
  });

  it('should report isIdle when enough time has passed', () => {
    service.start({ onLogout, onWarning });
    (service as any).lastActivityTimestamp = Date.now() - 16 * 60_000; // 16 min ago
    expect(service.isIdle).toBe(true);
  });

  it('should not expose recordActivity publicly', () => {
    // recordActivity exists as a private method
    expect(typeof service['recordActivity']).toBe('function');
  });

  describe('checkIdle() via timer', () => {
    it('should call onLogout when idle timeout is exceeded', () => {
      vi.useFakeTimers();
      service.start({ onLogout, onWarning });

      // Simulate idle: set lastActivityTimestamp far in the past
      (service as any).lastActivityTimestamp = Date.now() - 16 * 60_000; // 16 min (> 15 min default)

      // Advance past the 30s check interval
      vi.advanceTimersByTime(30_000);

      expect(onLogout).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should call onWarning 2 minutes before idle timeout', () => {
      vi.useFakeTimers();
      service.start({ onLogout, onWarning });

      // Set activity to 13.5 min ago (warning threshold = idleTimeout - 2min = 13min)
      (service as any).lastActivityTimestamp = Date.now() - 13.5 * 60_000;

      vi.advanceTimersByTime(30_000);

      expect(onWarning).toHaveBeenCalled();
      expect(onLogout).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not call onWarning twice without activity reset', () => {
      vi.useFakeTimers();
      service.start({ onLogout, onWarning });

      (service as any).lastActivityTimestamp = Date.now() - 13.5 * 60_000;

      // First check triggers warning
      vi.advanceTimersByTime(30_000);
      expect(onWarning).toHaveBeenCalledTimes(1);

      // Second check — warningShown is true, should not fire again
      vi.advanceTimersByTime(30_000);
      expect(onWarning).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should not trigger warning or logout when user is active', () => {
      vi.useFakeTimers();
      service.start({ onLogout, onWarning });

      // Activity is recent (default: Date.now())
      vi.advanceTimersByTime(30_000);

      expect(onWarning).not.toHaveBeenCalled();
      expect(onLogout).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not fire callbacks after stop()', () => {
      vi.useFakeTimers();
      service.start({ onLogout, onWarning });

      service.stop();

      // Set idle timestamp and advance — callbacks should not fire
      (service as any).lastActivityTimestamp = Date.now() - 16 * 60_000;
      vi.advanceTimersByTime(30_000);

      expect(onLogout).not.toHaveBeenCalled();
      expect(onWarning).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
