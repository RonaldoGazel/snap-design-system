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
import { of, throwError } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DocumentWizardComponent } from './document-wizard';
import { BpmsApiService } from '../../../workflows/services/bpms-api.service';
import { DocumentStoreService, LocalDocument } from '../services/document-store.service';
import {
  BpmsFlow,
  BpmsFlowVersion,
  BpmsFlowStep,
  BpmsTemplate,
} from '../../../workflows/models/bpms.model';
import { FlowStatus, StepType } from '../../../workflows/models/bpms.enums';

const mockStep: BpmsFlowStep = {
  id: 'step-1',
  flow_version_id: 'ver-1',
  name: 'Produção',
  code: 'PRODUCTION',
  type: StepType.PRODUCTION,
  order_index: 0,
  is_mandatory: true,
};

const mockVersion: BpmsFlowVersion = {
  id: 'ver-1',
  flow_id: 'flow-1',
  version: 1,
  status: FlowStatus.PUBLISHED,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  steps: [
    mockStep,
    {
      id: 'step-2',
      flow_version_id: 'ver-1',
      name: 'Revisão',
      code: 'REVIEW',
      type: StepType.REVIEW,
      order_index: 1,
      is_mandatory: true,
    },
  ],
};

const mockFlow: BpmsFlow = {
  id: 'flow-1',
  name: 'Fluxo de Relatório',
  code: 'RELATORIO',
  description: 'Fluxo para criação de relatórios',
  status: FlowStatus.PUBLISHED,
  created_by: 'user-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  flow_doc_types: [
    {
      id: 'fdt-1',
      document_type: {
        id: 'dt-1',
        code: 'RELATORIO',
        name: 'Relatório',
        distribution: 'INTERNO',
        doc_category: 'ANALISE',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    },
  ],
  versions: [mockVersion],
};

const mockFlowDetail: BpmsFlow = {
  ...mockFlow,
  versions: [mockVersion],
};

const mockTemplate: BpmsTemplate = {
  id: 'tpl-1',
  name: 'Template Relatório',
  description: 'Template padrão',
  version: 1,
  content_html: '<p>Conteúdo do template</p>',
  has_docx: false,
  status: 'active',
  is_active: true,
};

function createMockBpmsApi() {
  return {
    getFlows: vi.fn().mockReturnValue(of([mockFlow])),
    getFlow: vi.fn().mockReturnValue(of(mockFlowDetail)),
    getTemplates: vi.fn().mockReturnValue(of([mockTemplate])),
    getStepCatalog: vi.fn().mockReturnValue(of([])),
    getDocumentTypes: vi.fn().mockReturnValue(of([])),
  };
}

function createMockDocumentStore() {
  return {
    save: vi.fn().mockImplementation((doc: LocalDocument) => of(doc)),
    getAll: vi.fn().mockReturnValue(of([])),
  };
}

describe('DocumentWizardComponent', () => {
  let fixture: ComponentFixture<DocumentWizardComponent>;
  let component: DocumentWizardComponent;
  let mockBpmsApi: ReturnType<typeof createMockBpmsApi>;
  let mockDocumentStore: ReturnType<typeof createMockDocumentStore>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn>; events: Subject<unknown> };
  let messageService: MessageService;

  beforeEach(async () => {
    mockBpmsApi = createMockBpmsApi();
    mockDocumentStore = createMockDocumentStore();
    mockRouter = { navigate: vi.fn(), events: new Subject() };

    await TestBed.configureTestingModule({
      imports: [DocumentWizardComponent],
      providers: [
        { provide: BpmsApiService, useValue: mockBpmsApi },
        { provide: DocumentStoreService, useValue: mockDocumentStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { params: of({}), snapshot: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentWizardComponent);
    component = fixture.componentInstance;
    messageService = fixture.debugElement.injector.get(MessageService);
    vi.spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  // --- Component creation ---

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start at step 0', () => {
    expect(component.activeIndex()).toBe(0);
  });

  it('should render 4 steps', () => {
    expect(component.steps.length).toBe(4);
    expect(component.steps[0].label).toBe('Fluxo');
    expect(component.steps[3].label).toBe('Salvamento');
  });

  // --- Workflow loading ---

  it('should load published workflows on init', () => {
    expect(mockBpmsApi.getFlows).toHaveBeenCalled();
    expect(component.workflows().length).toBe(1);
    expect(component.workflows()[0].name).toBe('Fluxo de Relatório');
  });

  it('should filter out non-published workflows', () => {
    const archivedFlow: BpmsFlow = {
      ...mockFlow,
      id: 'flow-archived',
      status: FlowStatus.ARCHIVED,
    };
    mockBpmsApi.getFlows.mockReturnValue(of([mockFlow, archivedFlow]));

    component.loadWorkflows();
    expect(component.workflows().length).toBe(1);
    expect(component.workflows()[0].id).toBe('flow-1');
  });

  // --- Workflow selection ---

  it('should not advance from step 0 without selecting a workflow', () => {
    expect(component.canAdvance()).toBe(false);
    component.nextStep();
    expect(component.activeIndex()).toBe(0);
  });

  it('should load flow detail when a workflow is selected', () => {
    component.selectWorkflow(mockFlow);
    expect(mockBpmsApi.getFlow).toHaveBeenCalledWith('flow-1');
  });

  it('should resolve active version and initial step from flow detail', () => {
    component.selectWorkflow(mockFlow);
    expect(component.activeVersion()?.id).toBe('ver-1');
    expect(component.initialStep()?.name).toBe('Produção');
  });

  it('should resolve document types from flow', () => {
    component.selectWorkflow(mockFlow);
    expect(component.workflowDocumentTypes().length).toBe(1);
    expect(component.workflowDocumentTypes()[0].name).toBe('Relatório');
  });

  it('should allow advancing from step 0 after selecting a workflow', () => {
    component.selectWorkflow(mockFlow);
    expect(component.canAdvance()).toBe(true);

    component.nextStep();
    expect(component.activeIndex()).toBe(1);
  });

  // --- Metadata step ---

  it('should not advance from step 1 without a title', () => {
    component.selectWorkflow(mockFlow);
    component.nextStep(); // 0 -> 1
    component.documentTitle.set('');
    expect(component.canAdvance()).toBe(false);
  });

  it('should advance from step 1 with a title', () => {
    component.selectWorkflow(mockFlow);
    component.nextStep(); // 0 -> 1
    component.documentTitle.set('Meu Relatório');
    expect(component.canAdvance()).toBe(true);

    component.nextStep(); // 1 -> 2
    expect(component.activeIndex()).toBe(2);
  });

  // --- Editor step ---

  it('should always allow advancing from step 2 (editor)', () => {
    component.activeIndex.set(2);
    expect(component.canAdvance()).toBe(true);
  });

  // --- Navigation ---

  it('should go back to previous step', () => {
    component.selectWorkflow(mockFlow);
    component.nextStep(); // 0 -> 1
    expect(component.activeIndex()).toBe(1);

    component.previousStep();
    expect(component.activeIndex()).toBe(0);
  });

  it('should not go below step 0', () => {
    component.previousStep();
    expect(component.activeIndex()).toBe(0);
  });

  // --- Template resolution ---

  it('should resolve template when document type has template_id', () => {
    const flowWithTemplate: BpmsFlow = {
      ...mockFlowDetail,
      flow_doc_types: [
        {
          id: 'fdt-1',
          document_type: {
            id: 'dt-1',
            code: 'RELATORIO',
            name: 'Relatório',
            distribution: 'INTERNO',
            doc_category: 'ANALISE',
            template_id: 'tpl-1',
            is_active: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        },
      ],
    };
    mockBpmsApi.getFlow.mockReturnValue(of(flowWithTemplate));

    component.selectWorkflow(mockFlow);

    expect(mockBpmsApi.getTemplates).toHaveBeenCalled();
    expect(component.workflowTemplate()?.id).toBe('tpl-1');
    expect(component.editorContent()).toBe('<p>Conteúdo do template</p>');
  });

  // --- Save draft ---

  it('should save document to IndexedDB on saveDraft', () => {
    component.selectWorkflow(mockFlow);
    component.documentTitle.set('Relatório de Teste');
    component.documentClassification.set('RESERVADO');
    component.editorContent.set('<p>Conteúdo</p>');
    component.activeIndex.set(3);

    component.saveDraft();

    expect(mockDocumentStore.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: 'flow-1',
        workflowName: 'Fluxo de Relatório',
        flowVersionId: 'ver-1',
        currentStepId: 'step-1',
        currentStepName: 'Produção',
        title: 'Relatório de Teste',
        securityClassification: 'RESERVADO',
        content: '<p>Conteúdo</p>',
        status: 'RASCUNHO',
        synced: false,
      }),
    );
  });

  it('should navigate to documents home after successful save', () => {
    component.selectWorkflow(mockFlow);
    component.documentTitle.set('Teste');
    component.activeIndex.set(3);

    component.saveDraft();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/intelligence', 'documents']);
  });

  it('should show success toast after save', () => {
    component.selectWorkflow(mockFlow);
    component.documentTitle.set('Teste');
    component.activeIndex.set(3);

    component.saveDraft();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Documento criado',
      }),
    );
  });

  it('should show error toast when save fails', () => {
    mockDocumentStore.save.mockReturnValue(throwError(() => new Error('IndexedDB error')));

    component.selectWorkflow(mockFlow);
    component.documentTitle.set('Teste');
    component.activeIndex.set(3);

    component.saveDraft();

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Erro',
      }),
    );
  });

  // --- Computed values ---

  it('should compute resolved doc type name from workflow', () => {
    component.selectWorkflow(mockFlow);
    expect(component.resolvedDocTypeName()).toBe('Relatório');
  });

  it('should show dash when no document types', () => {
    component.workflowDocumentTypes.set([]);
    expect(component.resolvedDocTypeName()).toBe('—');
  });

  it('should compute resolved template name', () => {
    component.workflowTemplate.set(mockTemplate);
    expect(component.resolvedTemplateName()).toBe('Template Relatório');
  });

  it('should show fallback when no template', () => {
    component.workflowTemplate.set(null);
    expect(component.resolvedTemplateName()).toBe('Nenhum template vinculado');
  });
});
