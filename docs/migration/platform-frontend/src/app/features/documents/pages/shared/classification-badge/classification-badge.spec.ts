import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { ClassificationBadgeComponent } from './classification-badge';
import { SecurityClassification } from '../../models/document.models';

@Component({
  standalone: true,
  imports: [ClassificationBadgeComponent],
  template: `<app-classification-badge [classification]="classification()" />`,
})
class TestHostComponent {
  classification = signal<SecurityClassification | null | undefined>(null);
}

describe('ClassificationBadgeComponent', () => {
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

  // --- Property 1: ClassificationBadge renderiza cores semânticas corretas ---
  // Validates: Requirements 14.1, 14.2, 14.4

  it('should render p-tag with severity "success" for PUBLICO', () => {
    host.classification.set('PUBLICO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.value).toBe('PÚBLICO');
    expect(tag.componentInstance.severity).toBe('success');
  });

  it('should render p-tag with severity "warn" for RESERVADO', () => {
    host.classification.set('RESERVADO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.value).toBe('RESERVADO');
    expect(tag.componentInstance.severity).toBe('warn');
  });

  it('should render p-tag with severity "danger" for SIGILOSO', () => {
    host.classification.set('SIGILOSO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.value).toBe('SIGILOSO');
    expect(tag.componentInstance.severity).toBe('danger');
  });

  it('should not render p-tag when classification is null', () => {
    host.classification.set(null);
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeNull();
  });

  it('should not render p-tag when classification is undefined', () => {
    host.classification.set(undefined);
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeNull();
  });

  it('should update tag when classification changes from null to a valid value', () => {
    host.classification.set(null);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('p-tag'))).toBeNull();

    host.classification.set('SIGILOSO');
    fixture.detectChanges();

    const tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag).toBeTruthy();
    expect(tag.componentInstance.severity).toBe('danger');
  });

  it('should update tag when classification changes between valid values', () => {
    host.classification.set('PUBLICO');
    fixture.detectChanges();

    let tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag.componentInstance.severity).toBe('success');

    host.classification.set('RESERVADO');
    fixture.detectChanges();

    tag = fixture.debugElement.query(By.css('p-tag'));
    expect(tag.componentInstance.severity).toBe('warn');
  });

  it('should have correct selector app-classification-badge', () => {
    const badge = fixture.debugElement.query(By.directive(ClassificationBadgeComponent));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.tagName.toLowerCase()).toBe('app-classification-badge');
  });
});
