// @ts-nocheck — Legacy file pending migration to new document models
import { Component, OnChanges, inject, input, signal } from '@angular/core';
import { TableModule } from 'primeng/table';

import { DocumentVersion } from '../../../../shared/models/document.model';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { DocumentService } from '../services/document.service';

@Component({
  selector: 'app-version-history',
  standalone: true,
  imports: [TableModule, DateFormatPipe],
  templateUrl: './version-history.html',
})
export class VersionHistoryComponent implements OnChanges {
  private readonly documentService = inject(DocumentService);

  documentId = input.required<string>();

  versions = signal<DocumentVersion[]>([]);
  loading = signal(false);

  ngOnChanges(): void {
    this.loading.set(true);
    this.documentService.getVersions(this.documentId()).subscribe((res) => {
      if (res.success && res.data) this.versions.set(res.data);
      this.loading.set(false);
    });
  }
}
