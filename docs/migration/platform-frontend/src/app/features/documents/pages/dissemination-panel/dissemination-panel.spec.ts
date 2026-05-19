// Polyfill ResizeObserver for PrimeNG in test environment
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

import { DisseminationComponent } from './dissemination-panel';
import { DisseminationService } from '../services/dissemination.service';
import {
  InternalDissemination,
  ExternalDissemination,
} from '../models/document.models';

const mockApiResponse = <T>(data: T) => of({ success: true, data, error: null });

const mockInternalDisseminations: InternalDissemination[] = [
  {
    id: 'int-1',
    documentId: 'doc-1',
    fromSectorId: 'sector-a',
    toSectorId: 'sector-b',
    disseminatedBy: 'user-1',
    justification: 'Necessidade operacional',
    status: 'DELIVERED',
    createdAt: '2025-01-20T10:00:00Z',
    deliveredAt: '2025-01-20T10:05:00Z',
    toSectorName: 'Setor Beta',
    disseminatorName: 'João Silva',
  },
];

const mockExternalDisseminations: ExternalDissemination[] = [
  {
    id: 'ext-1',
    documentId: 'doc-1',
    authorizedBy: 'user-admin',
    destinationEntity: 'Polícia Federal',
    destinationContact: 'contato@pf.gov.br',
    justification: 'Cooperação interinstitucional',
    exportFormat: 'PDF',
    status: 'PENDING_AUTHORIZATION',
    createdAt: '2025-01-21T14:00:00Z',
    authorizerName: 'Admin User',
  },
];

function createMockDisseminationService() {
  return {
    getInternalDisseminations: vi.fn().mockReturnValue(mockApiResponse(mockInternalDisseminations)),
    getExternalDisseminations: vi.fn().mockReturnValue(mockApiResponse(mockExternalDisseminations)),
    disseminateInternal: vi.fn().mockReturnValue(
      mockApiResponse({
        ...mockInternalDisseminations[0],
        id: 'int-new',
        status: 'PENDING',
      }),
    ),
    disseminateExternal: vi.fn().mockReturnValue(
      mockApiResponse({
        ...mockExternalDisseminations[0],
        id: 'ext-new',
      }),
    ),
  };
}

describe('DisseminationComponent', () => {
  let fixture: ComponentFixture<DisseminationComponent>;
  let component: DisseminationComponent;
  let mockDisseminationService: ReturnType<typeof createMockDisseminationService>;
  let messageService: MessageService;

  beforeEach(async () => {
    mockDisseminationService = createMockDisseminationService();

    await TestBed.configureTestingModule({
      imports: [DisseminationComponent],
      providers: [
        { provide: DisseminationService, useValue: mockDisseminationService },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'doc-1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisseminationComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    vi.spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Tabs rendering ---
  // **Validates: Requirement 9.1**

  it('should render 2 tabs', () => {
    const tabs = fixture.debugElement.queryAll(By.css('p-tab'));
    expect(tabs.length).toBe(2);
    expect(tabs[0].nativeElement.textContent).toContain('Difusão Interna');
    expect(tabs[1].nativeElement.textContent).toContain('Difusão Externa');
  });

  // --- Internal dissemination loading ---
  // **Validates: Requirement 9.3**

  it('should load internal disseminations on init', () => {
    expect(mockDisseminationService.getInternalDisseminations).toHaveBeenCalledWith('doc-1');
    expect(component.internalList().length).toBe(1);
    expect(component.internalList()[0].toSectorName).toBe('Setor Beta');
  });

  it('should render internal disseminations in table', () => {
    const rows = fixture.debugElement.queryAll(By.css('.internal-row'));
    expect(rows.length).toBe(1);
    const text = rows[0].nativeElement.textContent;
    expect(text).toContain('Setor Beta');
    expect(text).toContain('João Silva');
  });

  // --- Internal dissemination form ---
  // **Property 7: required text fields disable submit when empty**
  // **Validates: Requirement 9.2**

  it('should not submit internal dissemination when justification is empty', () => {
    component.internalSectorId.set('sector-beta');
    component.internalJustification.set('');
    component.submitInternalDissemination();

    expect(mockDisseminationService.disseminateInternal).not.toHaveBeenCalled();
  });

  it('should not submit internal dissemination when justification is whitespace only', () => {
    component.internalSectorId.set('sector-beta');
    component.internalJustification.set('   ');
    component.submitInternalDissemination();

    expect(mockDisseminationService.disseminateInternal).not.toHaveBeenCalled();
  });

  it('should not submit internal dissemination when sector is empty', () => {
    component.internalSectorId.set('');
    component.internalJustification.set('Justificativa válida');
    component.submitInternalDissemination();

    expect(mockDisseminationService.disseminateInternal).not.toHaveBeenCalled();
  });

  it('should submit internal dissemination with valid data and show success toast', () => {
    component.internalSectorId.set('sector-beta');
    component.internalJustification.set('Necessidade operacional');
    component.submitInternalDissemination();

    expect(mockDisseminationService.disseminateInternal).toHaveBeenCalledWith('doc-1', {
      toSectorId: 'sector-beta',
      justification: 'Necessidade operacional',
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Difusão interna realizada',
      }),
    );
  });

  it('should clear internal form after successful submission', () => {
    component.internalSectorId.set('sector-beta');
    component.internalJustification.set('Necessidade operacional');
    component.submitInternalDissemination();

    expect(component.internalSectorId()).toBe('');
    expect(component.internalJustification()).toBe('');
  });

  // --- External dissemination loading ---
  // **Validates: Requirement 9.5**

  it('should load external disseminations on init', () => {
    expect(mockDisseminationService.getExternalDisseminations).toHaveBeenCalledWith('doc-1');
    expect(component.externalList().length).toBe(1);
    expect(component.externalList()[0].destinationEntity).toBe('Polícia Federal');
  });

  // --- External dissemination form ---
  // **Property 7: required text fields disable submit when empty**
  // **Validates: Requirement 9.4**

  it('should not submit external dissemination when entity is empty', () => {
    component.externalEntity.set('');
    component.externalJustification.set('Cooperação');
    component.submitExternalDissemination();

    expect(mockDisseminationService.disseminateExternal).not.toHaveBeenCalled();
  });

  it('should not submit external dissemination when justification is empty', () => {
    component.externalEntity.set('Polícia Federal');
    component.externalJustification.set('');
    component.submitExternalDissemination();

    expect(mockDisseminationService.disseminateExternal).not.toHaveBeenCalled();
  });

  it('should not submit external dissemination when justification is whitespace only', () => {
    component.externalEntity.set('Polícia Federal');
    component.externalJustification.set('   ');
    component.submitExternalDissemination();

    expect(mockDisseminationService.disseminateExternal).not.toHaveBeenCalled();
  });

  it('should submit external dissemination with valid data and show info toast', () => {
    component.externalEntity.set('Polícia Federal');
    component.externalContact.set('contato@pf.gov.br');
    component.externalJustification.set('Cooperação interinstitucional');
    component.externalFormat.set('PDF');
    component.submitExternalDissemination();

    expect(mockDisseminationService.disseminateExternal).toHaveBeenCalledWith('doc-1', {
      destinationEntity: 'Polícia Federal',
      destinationContact: 'contato@pf.gov.br',
      justification: 'Cooperação interinstitucional',
      exportFormat: 'PDF',
    });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'info',
        summary: 'Solicitação enviada',
      }),
    );
  });

  it('should clear external form after successful submission', () => {
    component.externalEntity.set('Polícia Federal');
    component.externalJustification.set('Cooperação');
    component.submitExternalDissemination();

    expect(component.externalEntity()).toBe('');
    expect(component.externalJustification()).toBe('');
  });

  // --- Dissemination trail ---
  // **Validates: Requirement 9.6**

  it('should build trail from internal and external disseminations', () => {
    expect(component.trailEvents().length).toBe(2);
    // Trail should be sorted by date descending
    expect(new Date(component.trailEvents()[0].date).getTime()).toBeGreaterThanOrEqual(
      new Date(component.trailEvents()[1].date).getTime(),
    );
  });

  it('should include internal dissemination in trail', () => {
    const internalEvent = component.trailEvents().find((e) => e.type === 'internal');
    expect(internalEvent).toBeTruthy();
    expect(internalEvent!.label).toContain('Setor Beta');
  });

  it('should include external dissemination in trail', () => {
    const externalEvent = component.trailEvents().find((e) => e.type === 'external');
    expect(externalEvent).toBeTruthy();
    expect(externalEvent!.label).toContain('Polícia Federal');
  });

  // --- Error handling ---

  it('should show error toast on internal dissemination failure', () => {
    mockDisseminationService.disseminateInternal.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.internalSectorId.set('sector-beta');
    component.internalJustification.set('Justificativa');
    component.submitInternalDissemination();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Erro interno. Tente novamente mais tarde.',
      }),
    );
  });

  it('should show error toast on external dissemination failure', () => {
    mockDisseminationService.disseminateExternal.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.externalEntity.set('Entidade');
    component.externalJustification.set('Justificativa');
    component.submitExternalDissemination();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Erro interno. Tente novamente mais tarde.',
      }),
    );
  });
});
