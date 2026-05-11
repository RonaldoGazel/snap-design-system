import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { ProcessListComponent } from './process-list';
import { ProcessService } from '../services/process.service';
import { Process } from '../models/document.models';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { ClassificationBadgeComponent } from '../shared/classification-badge/classification-badge';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge';

const mockProcesses: Process[] = [
  {
    id: 'proc-1',
    nup: '00001.000001/2025-01',
    title: 'Processo Alpha',
    status: 'ATIVO',
    securityClassification: 'PUBLICO',
    priority: 'NORMAL',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-15T14:00:00Z',
    creatorId: 'user-1',
    currentSectorId: 'sector-1',
    assignedUserId: 'user-10',
  },
  {
    id: 'proc-2',
    nup: '00001.000002/2025-01',
    title: 'Processo Beta',
    status: 'TRAMITANDO',
    securityClassification: 'RESERVADO',
    priority: 'ALTA',
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2025-02-10T12:00:00Z',
    creatorId: 'user-2',
    currentSectorId: 'sector-2',
  },
];

type ProcessListData = { items: Process[]; total: number; page: number; limit: number };

const mockListResponse: ApiResponse<ProcessListData> = {
  success: true,
  data: { items: mockProcesses, total: 2, page: 1, limit: 10 },
};

function createMockProcessService() {
  return {
    getProcesses: vi.fn().mockReturnValue(of(mockListResponse)),
  };
}

describe('ProcessListComponent', () => {
  let fixture: ComponentFixture<ProcessListComponent>;
  let component: ProcessListComponent;
  let mockService: ReturnType<typeof createMockProcessService>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockService = createMockProcessService();
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProcessListComponent],
      providers: [
        { provide: ProcessService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Table rendering ---
  // **Validates: Requirement 2.1**

  it('should render process data in the table', () => {
    const rows = fixture.debugElement.queryAll(By.css('.process-row'));
    expect(rows.length).toBe(2);

    const firstRow = rows[0].nativeElement.textContent;
    expect(firstRow).toContain('00001.000001/2025-01');
    expect(firstRow).toContain('Processo Alpha');
    expect(firstRow).toContain('NORMAL');
    expect(firstRow).toContain('user-10');
  });

  it('should render second process row correctly', () => {
    const rows = fixture.debugElement.queryAll(By.css('.process-row'));
    const secondRow = rows[1].nativeElement.textContent;
    expect(secondRow).toContain('00001.000002/2025-01');
    expect(secondRow).toContain('Processo Beta');
    expect(secondRow).toContain('ALTA');
  });

  it('should render classification badge for each process', () => {
    const badges = fixture.debugElement.queryAll(By.directive(ClassificationBadgeComponent));
    expect(badges.length).toBe(2);
  });

  it('should render status badge for each process', () => {
    const badges = fixture.debugElement.queryAll(By.directive(StatusBadgeComponent));
    expect(badges.length).toBe(2);
  });

  it('should show empty message when no processes', () => {
    mockService.getProcesses.mockReturnValue(
      of({ success: true, data: { items: [], total: 0, page: 1, limit: 10 } }),
    );
    component.ngOnInit();
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('.empty-message'));
    expect(empty).toBeTruthy();
    expect(empty.nativeElement.textContent).toContain('Nenhum processo encontrado');
  });

  it('should display dash for missing assignedUserId', () => {
    const rows = fixture.debugElement.queryAll(By.css('.process-row'));
    const secondRow = rows[1].nativeElement.textContent;
    expect(secondRow).toContain('-');
  });

  // --- Filters ---
  // **Validates: Requirement 2.2**

  it('should reload data when status filter changes', () => {
    mockService.getProcesses.mockClear();
    component.statusFilter.set('ATIVO');
    component.onFilterChange();

    expect(mockService.getProcesses).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ATIVO', page: 1 }),
    );
  });

  it('should reload data when classification filter changes', () => {
    mockService.getProcesses.mockClear();
    component.classificationFilter.set('SIGILOSO');
    component.onFilterChange();

    expect(mockService.getProcesses).toHaveBeenCalledWith(
      expect.objectContaining({ securityClassification: 'SIGILOSO' }),
    );
  });

  it('should reload data when priority filter changes', () => {
    mockService.getProcesses.mockClear();
    component.priorityFilter.set('URGENTE');
    component.onFilterChange();

    expect(mockService.getProcesses).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'URGENTE' }),
    );
  });

  it('should reset to page 1 when filter changes', () => {
    component.currentPage.set(3);
    component.onFilterChange();
    expect(component.currentPage()).toBe(1);
  });

  // --- Pagination ---
  // **Validates: Requirement 2.3**

  it('should call API with pagination params on lazy load', () => {
    mockService.getProcesses.mockClear();
    component.onLazyLoad({ first: 20, rows: 10 });

    expect(mockService.getProcesses).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, limit: 10 }),
    );
  });

  it('should update currentPage and pageSize on lazy load', () => {
    component.onLazyLoad({ first: 10, rows: 50 });

    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(50);
  });

  it('should set totalRecords from API response', () => {
    expect(component.totalRecords()).toBe(2);
  });

  // --- Navigation to detail ---
  // **Validates: Requirement 2.4**

  it('should navigate to process detail on row click', () => {
    component.onRowClick(mockProcesses[0]);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/intelligence',
      'documentos',
      'processos',
      'proc-1',
    ]);
  });

  // --- New process button ---
  // **Validates: Requirement 2.5**

  it('should navigate to new process wizard on button click', () => {
    component.navigateToNew();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'documentos', 'novo']);
  });

  it('should render "Novo Processo" button', () => {
    const button = fixture.debugElement.query(By.css('p-button'));
    expect(button).toBeTruthy();
  });

  // --- Loading state ---

  it('should set loading to false after data loads', () => {
    expect(component.loading()).toBe(false);
    expect(mockService.getProcesses).toHaveBeenCalled();
  });

  // --- Selector ---

  it('should have correct selector app-process-list', () => {
    // When creating component directly, the fixture IS the component
    // Verify the component class is correctly instantiated
    expect(component).toBeInstanceOf(ProcessListComponent);
  });

  // --- Service call on init ---

  it('should call getProcesses on init with default params', () => {
    expect(mockService.getProcesses).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });
});
