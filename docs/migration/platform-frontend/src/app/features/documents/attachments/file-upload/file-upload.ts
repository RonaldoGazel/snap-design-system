import { Component, inject, input, output, signal } from '@angular/core';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { Attachment } from '../../../../shared/models/attachment.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { AttachmentService } from '../services/attachment.service';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from '../../../../shared/utils/constants';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [FileUploadModule, ButtonModule, TagModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
})
export class FileUploadComponent {
  private readonly attachmentService = inject(AttachmentService);
  private readonly toast = inject(ToastService);

  documentId = input.required<string>();
  uploaded = output<Attachment>();

  uploading = signal(false);
  readonly accept = ALLOWED_MIME_TYPES.join(',');
  readonly maxSize = MAX_FILE_SIZE_BYTES;
  readonly maxSizeLabel = MAX_FILE_SIZE_LABEL;

  onUpload(event: FileUploadHandlerEvent): void {
    const file = event.files[0];
    if (!file) return;

    if (file.size > this.maxSize) {
      this.toast.error(`Arquivo muito grande. Máximo: ${this.maxSizeLabel}`);
      return;
    }

    this.uploading.set(true);
    this.attachmentService.upload(this.documentId(), file).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.success && res.data) {
          this.toast.success('Arquivo enviado com sucesso.');
          this.uploaded.emit(res.data);
        } else {
          this.toast.error(res.error ?? 'Erro ao enviar arquivo.');
        }
      },
      error: () => {
        this.uploading.set(false);
        this.toast.error('Erro ao enviar arquivo.');
      },
    });
  }
}
