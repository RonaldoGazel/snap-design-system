import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { StatusBadgeComponent } from './status-badge';

@Component({
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `<app-status-badge [status]="status()" [context]="context()" />`,
})
class TestHostComponent {
  status = signal<string | null | undefined>(null);
  context = signal<'process' | 'document'>('process');
}

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Property 2: StatusBadge renderiza cores semânticas corretas por contexto ---
  // Validates: Requirements 15.1, 15.2, 15.3

  // === Process context ===

  it('should render severity "info" for process status ATIVO', () => {
    host.context.set('process');
    host.status.set('ATIVO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('info');
    expect(tag.componentInstance.value).toBe('ATIVO');
  });

  it('should render severity "secondary" for process status ARQUIVADO', () => {
    host.context.set('process');
    host.status.set('ARQUIVADO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('secondary');
    expect(tag.componentInstance.value).toBe('ARQUIVADO');
  });

  it('should render severity "danger" for process status CANCELADO', () => {
    host.context.set('process');
    host.status.set('CANCELADO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('danger');
    expect(tag.componentInstance.value).toBe('CANCELADO');
  });

  it('should render severity "warn" for process status TRAMITANDO', () => {
    host.context.set('process');
    host.status.set('TRAMITANDO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('warn');
    expect(tag.componentInstance.value).toBe('TRAMITANDO');
  });

  // === Document context ===

  it('should render severity "secondary" for document status RASCUNHO', () => {
    host.context.set('document');
    host.status.set('RASCUNHO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('secondary');
    expect(tag.componentInstance.value).toBe('RASCUNHO');
  });

  it('should render severity "info" for document status ACTIVE', () => {
    host.context.set('document');
    host.status.set('ACTIVE');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('info');
    expect(tag.componentInstance.value).toBe('ATIVO');
  });

  it('should render severity "warn" for document status IN_REVIEW', () => {
    host.context.set('document');
    host.status.set('IN_REVIEW');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('warn');
    expect(tag.componentInstance.value).toBe('EM REVISÃO');
  });

  it('should render severity "success" for document status FORMALIZED', () => {
    host.context.set('document');
    host.status.set('FORMALIZED');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('success');
    expect(tag.componentInstance.value).toBe('FORMALIZADO');
  });

  it('should render severity "danger" for document status REJECTED', () => {
    host.context.set('document');
    host.status.set('REJECTED');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('danger');
    expect(tag.componentInstance.value).toBe('REJEITADO');
  });

  it('should render severity "warn" for document status TRAMITATING', () => {
    host.context.set('document');
    host.status.set('TRAMITATING');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('warn');
    expect(tag.componentInstance.value).toBe('TRAMITANDO');
  });

  it('should render severity "contrast" for document status ASSIGNED', () => {
    host.context.set('document');
    host.status.set('ASSIGNED');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('contrast');
    expect(tag.componentInstance.value).toBe('ATRIBUÍDO');
  });

  it('should render severity "secondary" for document status ARCHIVED', () => {
    host.context.set('document');
    host.status.set('ARCHIVED');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('secondary');
    expect(tag.componentInstance.value).toBe('ARQUIVADO');
  });

  // === Edge cases ===

  it('should not render p-tag when status is null', () => {
    host.status.set(null);
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeNull();
  });

  it('should not render p-tag when status is undefined', () => {
    host.status.set(undefined);
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeNull();
  });

  it('should update tag when status changes between values', () => {
    host.context.set('process');
    host.status.set('ATIVO');
    fixture.detectChanges();

    let tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag.componentInstance.severity).toBe('info');

    host.status.set('CANCELADO');
    fixture.detectChanges();

    tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag.componentInstance.severity).toBe('danger');
  });

  it('should update tag when context changes', () => {
    host.status.set('ARCHIVED');
    host.context.set('document');
    fixture.detectChanges();

    let tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag.componentInstance.severity).toBe('secondary');
    expect(tag.componentInstance.value).toBe('ARQUIVADO');

    host.context.set('process');
    host.status.set('ARQUIVADO');
    fixture.detectChanges();

    tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag.componentInstance.severity).toBe('secondary');
    expect(tag.componentInstance.value).toBe('ARQUIVADO');
  });

  it('should have correct selector app-status-badge', () => {
    const badge = fixture.debugElement.query(By.directive(StatusBadgeComponent));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.tagName.toLowerCase()).toBe('app-status-badge');
  });
});
