import { Component, OnChanges, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

import { Attachment } from '../../../../shared/models/attachment.model';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { AttachmentService } from '../services/attachment.service';
import { FileUploadComponent } from '../file-upload/file-upload';

@Component({
  selector: 'app-attachment-viewer',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    FileSizePipe,
    DateFormatPipe,
    FileUploadComponent,
  ],
  templateUrl: './attachment-viewer.html',
  styleUrl: './attachment-viewer.css',
})
export class AttachmentViewerComponent implements OnChanges {
  private readonly attachmentService = inject(AttachmentService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  documentId = input.required<string>();
  canUpload = input(false);

  attachments = signal<Attachment[]>([]);
  loading = signal(false);
  showUpload = signal(false);
  showPreview = signal(false);
  previewUrl = signal<SafeResourceUrl | null>(null);
  previewMime = signal<string | null>(null);

  ngOnChanges(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.attachmentService.getAttachments(this.documentId()).subscribe((res) => {
      if (res.success && res.data) this.attachments.set(res.data);
      this.loading.set(false);
    });
  }

  onUploaded(a: Attachment): void {
    this.attachments.update((list) => [...list, a]);
    this.showUpload.set(false);
  }

  download(a: Attachment): void {
    window.open(this.attachmentService.getDownloadUrl(a.id), '_blank');
  }

  preview(a: Attachment): void {
    const url = this.attachmentService.getPreviewUrl(a.id);
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.previewMime.set(a.mime_type ?? null);
    this.showPreview.set(true);
  }

  delete(a: Attachment): void {
    this.attachmentService.deleteAttachment(a.id).subscribe((res) => {
      if (res.success) {
        this.attachments.update((list) => list.filter((x) => x.id !== a.id));
        this.toast.success('Anexo removido.');
      } else {
        this.toast.error(res.error ?? 'Erro ao remover anexo.');
      }
    });
  }

  fileIcon(mimeType?: string): string {
    if (!mimeType) return 'pi pi-file';
    if (mimeType === 'application/pdf') return 'pi pi-file-pdf';
    if (mimeType.startsWith('image/')) return 'pi pi-image';
    if (mimeType.includes('word')) return 'pi pi-file-word';
    return 'pi pi-file';
  }

  isPreviewable(mimeType?: string): boolean {
    return !!mimeType && (mimeType === 'application/pdf' || mimeType.startsWith('image/'));
  }
}
