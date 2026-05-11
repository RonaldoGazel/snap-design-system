import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsDocumentType, BpmsTemplate } from '../../models/bpms.model';
import { DocumentDistribution } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-doc-type-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    TagModule,
    TranslateModule,
  ],
  templateUrl: './doc-type-form.html',
  styleUrl: './doc-type-form.css',
})
export class DocTypeFormComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly editId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly templates = signal<{ label: string; value: string | null }[]>([]);

  private existingCodes = signal<string[]>([]);

  readonly distributionOptions = [
    { label: 'Externo', value: DocumentDistribution.EXTERNO },
    { label: 'Interno', value: DocumentDistribution.INTERNO },
    { label: 'Interno/Externo', value: DocumentDistribution.INTERNO_EXTERNO },
  ];

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    distribution: [DocumentDistribution.INTERNO as string, Validators.required],
    doc_category: ['', [Validators.required, Validators.maxLength(100)]],
    template_id: [null as string | null],
    is_active: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.isEditMode.set(true);
    }

    // Load templates for the dropdown
    this.api.getTemplates().subscribe((tpls) => {
      this.templates.set([
        { label: 'Nenhum (sem template)', value: null },
        ...tpls
          .filter((t) => t.is_active)
          .map((t) => ({ label: t.name ?? t.code ?? '', value: t.id })),
      ]);
    });

    // Load existing doc types for duplicate check and edit patching
    this.api.getDocumentTypes().subscribe((types) => {
      const codes = types.filter((t) => t.id !== id).map((t) => t.code.toLowerCase());
      this.existingCodes.set(codes);

      if (id) {
        const existing = types.find((t) => t.id === id);
        if (existing) this.patchForm(existing);
      }
    });
  }

  private patchForm(dt: BpmsDocumentType): void {
    this.form.patchValue({
      code: dt.code,
      name: dt.name,
      distribution: dt.distribution,
      doc_category: dt.doc_category,
      template_id: dt.template_id ?? null,
      is_active: dt.is_active,
    });
  }

  isDuplicateCode(): boolean {
    const code = this.form.get('code')?.value?.toLowerCase() ?? '';
    return this.existingCodes().includes(code);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isDuplicateCode()) {
      this.errorMessage.set('Já existe um tipo documental com este código.');
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload: Partial<BpmsDocumentType> = {
      code: value.code ?? '',
      name: value.name ?? '',
      distribution: value.distribution ?? DocumentDistribution.INTERNO,
      doc_category: value.doc_category ?? '',
      template_id: value.template_id,
      is_active: value.is_active ?? true,
    };

    const id = this.editId();
    const request$ = id
      ? this.api.updateDocumentType(id, payload)
      : this.api.createDocumentType(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/intelligence/workflows/document-types']),
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err?.error?.detail ?? this.translate.instant('workflows.errors.saveDocTypeFailed'),
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/intelligence/workflows/document-types']);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
