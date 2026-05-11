import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { Process } from '../../../../shared/models/process.model';
import { ProcessDistribution } from '../../../../shared/models/enums';
import {
  DISTRIBUTION_DOCTYPE_MAP,
  DOCTYPE_TEMPLATE_MAP,
  DISTRIBUTION_LABEL_MAP,
  DOCTYPE_LABEL_MAP,
  TemplateOption,
} from '../../../../shared/models/process-mappings';
import { ToastService } from '../../../../shared/services/toast.service';
import { DocumentService } from '../services/document.service';

interface DocForm {
  title: string;
  doc_type: string;
  template_key: string;
}

@Component({
  selector: 'app-document-form-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, InputTextModule, SelectModule, FormsModule],
  templateUrl: './document-form-dialog.html',
})
export class DocumentFormDialogComponent {
  private readonly documentService = inject(DocumentService);
  private readonly toast = inject(ToastService);

  process = input.required<Process>();
  visible = model(false);
  saved = output<string>();

  form = signal<DocForm>({ title: '', doc_type: '', template_key: 'BLANK' });
  saving = signal(false);

  readonly distributionLabel = computed(() => {
    const dist = this.process().distribution;
    return DISTRIBUTION_LABEL_MAP[dist as ProcessDistribution] ?? dist;
  });

  readonly docTypeOptions = computed(() => {
    const dist = this.process().distribution;
    if (!dist) return [];
    const types = DISTRIBUTION_DOCTYPE_MAP[dist as ProcessDistribution] ?? [];
    return types.map((t) => ({ label: DOCTYPE_LABEL_MAP[t], value: t }));
  });

  readonly templateOptions = computed(() => {
    const { doc_type } = this.form();
    const dist = this.process().distribution;
    const blank = { label: 'Documento em Branco', value: 'BLANK' };
    if (!dist || !doc_type) return [blank];
    const key = `${dist}:${doc_type}`;
    const templates: TemplateOption[] = DOCTYPE_TEMPLATE_MAP[key] ?? [];
    return [
      blank,
      ...templates.map((t) => ({ label: `${t.abbreviation} - ${t.fullName}`, value: t.key })),
    ];
  });

  patch(partial: Partial<DocForm>): void {
    this.form.update((f) => ({ ...f, ...partial }));
  }

  onDocTypeChange(value: string): void {
    this.form.update((f) => ({ ...f, doc_type: value, template_key: 'BLANK' }));
  }

  onTemplateChange(value: string): void {
    this.patch({ template_key: value });
  }

  submit(): void {
    const f = this.form();
    if (!f.title.trim() || !f.doc_type) return;
    this.saving.set(true);

    const payload = {
      processId: this.process().id,
      title: f.title,
      distribution: this.process().distribution,
      doc_type: f.doc_type,
      template_key: f.template_key || 'BLANK',
    };

    this.documentService.createDocument(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.toast.success('Documento criado.');
          this.visible.set(false);
          this.saved.emit(res.data.id);
        } else {
          this.toast.error(res.error ?? 'Erro ao criar documento.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao criar documento.');
      },
    });
  }
}
