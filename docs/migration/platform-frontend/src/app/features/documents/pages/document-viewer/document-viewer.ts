import { Component, OnChanges, inject, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';

import { Document } from '../../../../shared/models/document.model';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { SecurityBadgeComponent } from '../../../../shared/components/security-badge/security-badge';
import { DocumentService } from '../services/document.service';
import { VersionHistoryComponent } from '../version-history/version-history';
import { CollaboraEditorComponent } from '../../../../shared/components/collabora-editor/collabora-editor';
import { AttachmentViewerComponent } from '../../attachments/attachment-viewer/attachment-viewer';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    ButtonModule,
    TagModule,
    TabsModule,
    DateFormatPipe,
    SecurityBadgeComponent,
    VersionHistoryComponent,
    CollaboraEditorComponent,
    AttachmentViewerComponent,
  ],
  templateUrl: './document-viewer.html',
  styleUrl: './document-viewer.css',
})
export class DocumentViewerComponent implements OnChanges {
  private readonly documentService = inject(DocumentService);

  document = input<Document | null>(null);
  canEdit = input(false);
  editRequested = output<Document>();

  activeTab = signal<string>('preview');

  ngOnChanges(): void {
    const doc = this.document();
    if (doc) {
      // TODO: Implement document access logging on backend
      // this.documentService.logAccess(doc.id).subscribe();
      this.activeTab.set('preview');
    }
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      DRAFT: 'warn',
      ACTIVE: 'success',
      ARCHIVED: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  setActiveTab(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.activeTab.set(value);
    }
  }
}
