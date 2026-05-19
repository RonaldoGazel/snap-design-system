import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from 'primeng/api';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let messageService: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageService],
    });
    service = TestBed.inject(ToastService);
    messageService = TestBed.inject(MessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('success() should add a success message with life 5000', () => {
    const spy = vi.spyOn(messageService, 'add');
    service.success('Done', 'Item created');
    expect(spy).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Done',
      detail: 'Item created',
      life: 5000,
    });
  });

  it('success() should work without detail', () => {
    const spy = vi.spyOn(messageService, 'add');
    service.success('Done');
    expect(spy).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Done',
      detail: undefined,
      life: 5000,
    });
  });

  it('error() should add an error message with life 8000', () => {
    const spy = vi.spyOn(messageService, 'add');
    service.error('Failed', 'Something went wrong');
    expect(spy).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Failed',
      detail: 'Something went wrong',
      life: 8000,
    });
  });

  it('info() should add an info message with life 5000', () => {
    const spy = vi.spyOn(messageService, 'add');
    service.info('Notice', 'Check this out');
    expect(spy).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Notice',
      detail: 'Check this out',
      life: 5000,
    });
  });

  it('warn() should add a warn message with life 6000', () => {
    const spy = vi.spyOn(messageService, 'add');
    service.warn('Warning', 'Be careful');
    expect(spy).toHaveBeenCalledWith({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Be careful',
      life: 6000,
    });
  });

  it('clear() should call messageService.clear()', () => {
    const spy = vi.spyOn(messageService, 'clear');
    service.clear();
    expect(spy).toHaveBeenCalled();
  });
});
