import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, MenuItem } from 'primeng/api';

import { CollaboraEditorComponent } from '../../../../shared/components/collabora-editor/collabora-editor';
import { ClassificationBadgeComponent } from '../shared/classification-badge/classification-badge';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { VersionHistoryComponent } from '../shared/version-history/version-history';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { DocumentService } from '../services/document.service';
import { Document, Attachment, DocumentReview } from '../models/document.models';
import { UpdateDocumentPayload } from '../models/document.payloads';
import { handleDocumentError } from '../services/error-handler.util';

export const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/tiff',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Component({
  selector: 'app-document-editor',
  standalone: true,
  imports: [
    FormsModule,
    CollaboraEditorComponent,
    TabsModule,
    MenuModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    FileUploadModule,
    ProgressBarModule,
    ClassificationBadgeComponent,
    StatusBadgeComponent,
    VersionHistoryComponent,
    DateFormatPipe,
  ],
  providers: [MessageService],
  templateUrl: './document-editor.html',
  styleUrl: './document-editor.css',
})
export class DocumentEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);

  document = signal<Document | null>(null);
  attachments = signal<Attachment[]>([]);
  reviews = signal<DocumentReview[]>([]);
  loading = signal(false);
  saving = signal(false);
  content = signal('');
  uploadProgress = signal(0);
  uploading = signal(false);
  error = signal<string | null>(null);

  isEditable = computed(() => {
    const doc = this.document();
    return doc?.status === 'RASCUNHO' || doc?.status === 'ACTIVE';
  });

  isFormalized = computed(() => {
    const doc = this.document();
    return doc?.status === 'FORMALIZED';
  });

  actionMenuItems = computed<MenuItem[]>(() => {
    const editable = this.isEditable();
    return [
      {
        label: 'Salvar Rascunho',
        icon: 'pi pi-save',
        command: () => this.saveDraft(),
        disabled: !editable,
      },
      {
        label: 'Submeter para Revisão',
        icon: 'pi pi-check-circle',
        command: () => this.submitForReview(),
        disabled: !editable,
      },
      { label: 'Tramitar', icon: 'pi pi-send', command: () => this.tramitate() },
      { label: 'Formalizar', icon: 'pi pi-verified', command: () => this.formalize() },
      {
        label: 'Anexar Arquivo',
        icon: 'pi pi-paperclip',
        command: () => this.triggerFileUpload(),
        disabled: !editable,
      },
    ];
  });

  constructor() {
    effect(() => {
      this.route.params.subscribe((params) => {
        const id = params['id'];
        if (id) {
          this.loadDocument(id);
          this.loadAttachments(id);
          this.loadReviews(id);
        }
      });
    });
  }

  loadDocument(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.documentService.getDocument(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.document.set(res.data);
          this.content.set(res.data.content ?? '');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Falha ao carregar documento.');
        handleDocumentError(err, this.messageService, this.router);
      },
    });
  }

  private loadAttachments(docId: string): void {
    this.documentService.getAttachments(docId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.attachments.set(res.data);
        }
      },
    });
  }

  private loadReviews(docId: string): void {
    // Reviews are now handled via workflow transitions in the document view.
    // This method is a no-op until the document-editor is fully migrated.
    this.reviews.set([]);
  }

  saveDraft(): void {
    const doc = this.document();
    if (!doc || !this.isEditable()) return;

    this.saving.set(true);
    const payload: UpdateDocumentPayload = {
      title: doc.title,
      content: this.content(),
      expectedVersion: doc.version,
    };

    this.documentService.updateDocument(doc.id, payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.document.set(res.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Rascunho salvo',
            detail: `Rascunho salvo — versão ${res.data.version} criada`,
            life: 5000,
          });
        } else if (
          res.error?.includes('409') ||
          res.error?.includes('conflito') ||
          res.error?.includes('Conflict')
        ) {
          this.messageService.add({
            severity: 'error',
            summary: 'Conflito de edição',
            detail:
              'Conflito de edição: documento foi alterado por outro usuário. Recarregue a página.',
            life: 8000,
          });
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        handleDocumentError(err, this.messageService);
      },
    });
  }

  submitForReview(): void {
    const doc = this.document();
    if (!doc) return;
    // Review submission is now handled via workflow transitions in the document view.
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Use a visualização do documento para submeter revisões.',
      life: 5000,
    });
  }

  tramitate(): void {
    const doc = this.document();
    if (!doc) return;
    this.router.navigate(['/intelligence', 'documentos', 'processes', doc.processId]);
  }

  formalize(): void {
    const doc = this.document();
    if (!doc) return;
    this.router.navigate(['/intelligence', 'documentos', 'formalization', doc.id]);
  }

  triggerFileUpload(): void {
    const fileInput = globalThis.document?.querySelector('.hidden-file-input') as HTMLInputElement;
    fileInput?.click();
  }

  validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Tipo de arquivo não suportado: ${file.name}. Tipos aceitos: PDF, DOCX, XLSX, PNG, JPG, TIFF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo excede o tamanho máximo de 50MB: ${file.name}`;
    }
    return null;
  }

  onFileSelect(event: { files: File[] } | Event): void {
    const files =
      (event as { files: File[] }).files ??
      (event as Event & { target: HTMLInputElement }).target?.files;
    if (!files || files.length === 0) return;

    const file = files[0] instanceof File ? files[0] : (files as unknown as FileList)[0];
    const error = this.validateFile(file);
    if (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Upload inválido',
        detail: error,
        life: 8000,
      });
      return;
    }

    this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    const doc = this.document();
    if (!doc) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);

    this.documentService.uploadAttachment(file, { documentId: doc.id }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.attachments.update((list) => [...list, res.data!]);
          this.messageService.add({
            severity: 'success',
            summary: 'Upload concluído',
            detail: `Arquivo "${file.name}" anexado com sucesso.`,
            life: 5000,
          });
        }
        this.uploading.set(false);
        this.uploadProgress.set(100);
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        handleDocumentError(err, this.messageService);
      },
    });
  }

  onTitleChange(newTitle: string): void {
    const doc = this.document();
    if (doc) {
      this.document.set({ ...doc, title: newTitle });
    }
  }

  onContentChange(newContent: string): void {
    this.content.set(newContent);
  }

  onContentSaved(savedHtml: string): void {
    this.content.set(savedHtml);
    const doc = this.document();
    if (doc) {
      this.document.set({ ...doc, version: doc.version + 1 });
    }
  }
}
