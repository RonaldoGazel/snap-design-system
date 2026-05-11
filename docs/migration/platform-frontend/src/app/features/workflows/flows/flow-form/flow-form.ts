import { Component, OnInit, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsDocumentType } from '../../models/bpms.model';
import { FlowStatus } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, MultiSelectModule, ButtonModule,
    TranslateModule
  ],
  templateUrl: './flow-form.html',
  styleUrl: './flow-form.css',
})
export class FlowFormComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly docTypes = signal<BpmsDocumentType[]>([]);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly statusOptions = [
    { label: this.translate.instant('workflows.status.draft'), value: FlowStatus.DRAFT },
    { label: this.translate.instant('workflows.status.published'), value: FlowStatus.PUBLISHED },
    { label: this.translate.instant('workflows.status.archived'), value: FlowStatus.ARCHIVED }
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    description: [''],
    scope: [''],
    status: [FlowStatus.DRAFT as string, Validators.required],
    document_type_ids: [[] as string[]],
  });

  ngOnInit(): void {
    this.api.getDocumentTypes().subscribe(data => this.docTypes.set(data));
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.errorMessage.set(null);
    this.saving.set(true);
    const value = this.form.getRawValue();
    const payload = {
      name: value.name ?? '',
      code: value.code ?? '',
      description: value.description ?? undefined,
      scope: value.scope ?? undefined,
      status: (value.status as FlowStatus) ?? FlowStatus.DRAFT,
      document_type_ids: value.document_type_ids ?? [],
    };
    this.api.createFlow(payload).subscribe({
      next: (flow) => this.router.navigate(['/intelligence/workflows/flows', flow.id]),
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? this.translate.instant('workflows.errors.createFlowFailed'));
      },
    });
  }

  goBack(): void { this.router.navigate(['/intelligence/workflows/flows']); }
  isInvalid(field: string): boolean { const ctrl = this.form.get(field); return !!(ctrl?.invalid && ctrl.touched); }
}
