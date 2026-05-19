import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { BpmsApiService } from '../../services/bpms-api.service';
import { OrgSelectorComponent } from '../../shared/org-selector/org-selector';
import {
  BpmsDocumentInstance,
  BpmsTemplate,
  BpmsFlow,
  BpmsFlowVersion,
  BpmsProcess,
  UnitProfileCombo,
} from '../../models/bpms.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-document-instance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    TextareaModule,
    CardModule,
    TagModule,
    TimelineModule,
    OrgSelectorComponent,
    TranslateModule
  ],
  templateUrl: './document-instance.html',
  styleUrl: './document-instance.css',
})
export class DocumentInstanceComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly isCreateMode = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly instance = signal<BpmsDocumentInstance | null>(null);

  readonly templates = signal<BpmsTemplate[]>([]);
  readonly flows = signal<BpmsFlow[]>([]);
  readonly flowVersions = signal<BpmsFlowVersion[]>([]);
  readonly processes = signal<BpmsProcess[]>([]);
  readonly originCombos = signal<UnitProfileCombo[]>([]);

  readonly templateOptions = computed(() =>
    this.templates().map((t) => ({ label: t.name, value: t.id })),
  );

  readonly flowOptions = computed(() =>
    this.flows().map((f) => ({ label: `${f.code} — ${f.name}`, value: f.id })),
  );

  readonly flowVersionOptions = computed(() =>
    this.flowVersions()
      .filter((v) => v.status === 'published')
      .map((v) => ({ label: `v${v.version} (${v.status})`, value: v.id })),
  );

  readonly processOptions = computed(() => [
    { label: '— Nenhum (avulso) —', value: null },
    ...this.processes().map((p) => ({ label: `${p.identifier} — ${p.subject}`, value: p.id }))
  ]);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(300)]],
    template_id: ['', Validators.required],
    flow_id: [''],
    flow_version_id: ['', Validators.required],
    process_id: [null as string | null],
    is_standalone: [false],
    content: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const isNew = this.route.snapshot.url.some((seg) => seg.path === 'novo');

    if (isNew || !id) {
      this.isCreateMode.set(true);
      this.loadCreateData();
    } else {
      this.isCreateMode.set(false);
      this.loadInstance(id);
    }
  }

  private loadCreateData(): void {
    this.api.getTemplates().subscribe((data) => this.templates.set(data));
    this.api.getFlows().subscribe((data) => this.flows.set(data));
    this.api.getProcesses().subscribe((data) => this.processes.set(data));
  }

  private loadInstance(id: string): void {
    this.loading.set(true);
    this.api.getDocumentInstance(id).subscribe({
      next: (data) => {
        this.instance.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.instance.set(null);
        this.loading.set(false);
      },
    });
  }

  onTemplateChange(templateId: string): void {
    // Template selected — flow matching is now done via document types, not templates directly.
    // The user selects the flow independently.
  }

  onFlowChange(flowId: string): void {
    if (!flowId) {
      this.flowVersions.set([]);
      return;
    }
    this.api.getFlowVersions(flowId).subscribe((versions) => {
      this.flowVersions.set(versions);
      const published = versions.filter((v) => v.status === 'published');
      if (published.length > 0) {
        this.form.patchValue({ flow_version_id: published[0].id });
      }
    });
  }

  onOriginChange(combos: UnitProfileCombo[]): void {
    this.originCombos.set(combos);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.saving.set(true);
    const value = this.form.getRawValue();
    const origin = this.originCombos()[0] ?? null;
    const payload: Partial<BpmsDocumentInstance> = {
      title: value.title ?? '',
      template_id: value.template_id ?? '',
      flow_version_id: value.flow_version_id ?? '',
      process_id: value.process_id ?? undefined,
      content: value.content ?? undefined,
      origin_unit_id: origin?.unit_id ?? undefined,
      origin_profile_id: origin?.profile_id ?? undefined,
      created_by: 'system',
    };
    this.api.createDocumentInstance(payload).subscribe({
      next: (created) => this.router.navigate(['/intelligence/workflows/documents', created.id]),
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? this.translate.instant('workflows.errors.createDocumentFailed'));
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/intelligence/workflows/documents']);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      RASCUNHO: 'workflows.status.draft', EM_PRODUCAO: 'workflows.docStatus.inProduction', EM_REVISAO: 'workflows.docStatus.inReview',
      EM_FORMALIZACAO: 'workflows.docStatus.awaitingFormalization', FORMALIZADO: 'workflows.docStatus.formalized', EM_DIFUSAO: 'Em Difusao',
      DIFUNDIDO_INTERNO: 'Difundido Internamente', DIFUNDIDO_EXTERNO: 'Difundido Externamente',
      CANCELADO: 'workflows.processStatus.CANCELADO',
    };
    return map[status] ?? status;
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      FORMALIZADO: 'success', DIFUNDIDO_INTERNO: 'success', DIFUNDIDO_EXTERNO: 'success',
      CANCELADO: 'danger', EM_PRODUCAO: 'info', EM_REVISAO: 'warn',
      EM_FORMALIZACAO: 'warn', EM_DIFUSAO: 'info',
    };
    return map[status] ?? 'secondary';
  }

  eventLabel(type: string): string {
    const map: Record<string, string> = {
      TRANSITION: 'workflows.eventType.routing', FORMALIZE: 'workflows.transitionType.standard_forward',
      DISSEMINATE: 'workflows.transitionType.standard_forward', COMMENT: 'Comentario',
    };
    return map[type] ?? type;
  }
}
