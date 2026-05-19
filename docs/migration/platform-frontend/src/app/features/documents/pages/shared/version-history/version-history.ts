import { Component, effect, inject, input, signal } from '@angular/core';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { DocumentVersion } from '../../models/document.models';
import { DocumentService } from '../../services/document.service';
import { DateFormatPipe } from '../../../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-version-history',
  standalone: true,
  imports: [TimelineModule, DialogModule, ButtonModule, DateFormatPipe],
  templateUrl: './version-history.html',
  styleUrl: './version-history.css',
})
export class VersionHistoryComponent {
  private readonly documentService = inject(DocumentService);

  documentId = input<string>();

  versions = signal<DocumentVersion[]>([]);
  loading = signal(false);
  selectedVersion = signal<DocumentVersion | null>(null);
  dialogVisible = signal(false);

  constructor() {
    effect(() => {
      const docId = this.documentId();
      if (docId) {
        this.loadVersions(docId);
      }
    });
  }

  private loadVersions(docId: string): void {
    this.loading.set(true);
    this.documentService.getVersions(docId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const sorted = [...res.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          this.versions.set(sorted);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openVersionDialog(version: DocumentVersion): void {
    this.selectedVersion.set(version);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedVersion.set(null);
  }

  isCurrentVersion(version: DocumentVersion): boolean {
    const all = this.versions();
    return all.length > 0 && all[0].id === version.id;
  }
}
