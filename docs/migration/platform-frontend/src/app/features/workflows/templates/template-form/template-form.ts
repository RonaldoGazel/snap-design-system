import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsTemplate } from '../../models/bpms.model';
import { CollaboraEditorComponent } from '../../../../shared/components/collabora-editor/collabora-editor';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-template-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ButtonModule,
    FileUploadModule,
    TagModule,
    TranslateModule,
    CollaboraEditorComponent,
  ],
  templateUrl: './template-form.html',
  styleUrl: './template-form.css',
})
export class TemplateFormComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly editId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly currentTemplate = signal<BpmsTemplate | null>(null);
  readonly pendingFile = signal<File | null>(null);

  readonly statusOptions = [
    { label: 'Ativo', value: 'active' },
    { label: 'Inativo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', [Validators.maxLength(2000)]],
    status: ['active'],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.isEditMode.set(true);
      this.loadTemplate(id);
    }
  }

  private loadTemplate(id: string): void {
    this.api.getTemplates().subscribe((templates) => {
      const t = templates.find((tpl) => tpl.id === id);
      if (t) {
        this.currentTemplate.set(t);
        this.form.patchValue({
          name: t.name,
          description: t.description ?? '',
          status: t.status,
        });
        // Collabora editor auto-opens via the shared component when has_file is true
      }
    });
  }

  onFileSelect(event: { files: File[] }): void {
    const file = event.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
      this.errorMessage.set('Apenas arquivos .doc e .docx são aceitos.');
      return;
    }
    this.errorMessage.set(null);

    const id = this.editId();
    if (id) {
      this.uploadFileNow(id, file);
    } else {
      this.pendingFile.set(file);
    }
  }

  /**
   * Upload a file immediately to an existing template.
   * Refreshes the template data so the shared Collabora component picks up has_file.
   */
  private uploadFileNow(templateId: string, file: File): void {
    this.uploading.set(true);

    this.api.uploadTemplateDocx(templateId, file).subscribe({
      next: (updated) => {
        this.uploading.set(false);
        this.pendingFile.set(null);
        this.currentTemplate.set(updated as any);
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err?.error?.detail ?? 'Falha ao enviar o arquivo.');
      },
    });
  }

  downloadDocx(): void {
    const id = this.editId();
    if (!id) return;
    this.http
      .get(`/api/v1/documents/templates/${id}/download`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const filename = this.currentTemplate()?.original_filename ?? 'template.docx';
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.errorMessage.set('Falha ao baixar o arquivo.'),
      });
  }

  openPreview(): void {
    const id = this.editId();
    if (!id) return;
    this.http.get(`/api/v1/documents/templates/${id}/preview`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      },
      error: () => this.errorMessage.set('Falha ao carregar a pré-visualização PDF.'),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    const value = this.form.getRawValue();

    const payload: Record<string, unknown> = {
      name: value.name ?? '',
      description: value.description || undefined,
      status: value.status ?? 'active',
    };

    const id = this.editId();

    if (id) {
      this.api.updateTemplate(id, payload).subscribe({
        next: () => {
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.detail ?? 'Falha ao salvar o template.');
        },
      });
    } else {
      const pendingFile = this.pendingFile();
      this.api.createTemplate(payload).subscribe({
        next: (result) => {
          const newId = (result as any).id;
          this.saving.set(false);

          if (pendingFile && newId) {
            this.editId.set(newId);
            this.isEditMode.set(true);
            this.pendingFile.set(null);
            window.history.replaceState({}, '', `/intelligence/workflows/templates/${newId}`);
            this.uploadFileNow(newId, pendingFile);
          } else {
            this.router.navigate(['/intelligence/workflows/templates', newId]);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.detail ?? 'Falha ao criar o template.');
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/intelligence/workflows/templates']);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
