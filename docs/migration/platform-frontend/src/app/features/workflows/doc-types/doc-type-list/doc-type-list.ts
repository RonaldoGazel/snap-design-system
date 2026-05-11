import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsDocumentType } from '../../models/bpms.model';
import { DocumentDistribution } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-doc-type-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, TableModule, TagModule, ButtonModule, InputTextModule, SelectModule,
    TranslateModule
  ],
  templateUrl: './doc-type-list.html',
  styleUrl: './doc-type-list.css',
})
export class DocTypeListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly docTypes = signal<BpmsDocumentType[]>([]);
  readonly searchText = signal('');
  readonly filterDistribution = signal<string | null>(null);
  readonly filterDocType = signal('');
  readonly filterActive = signal<boolean | null>(null);

  readonly distributionOptions = [
    { label: 'Todos', value: null },
    { label: 'Externo', value: DocumentDistribution.EXTERNO },
    { label: 'Interno', value: DocumentDistribution.INTERNO },
    { label: 'Interno/Externo', value: DocumentDistribution.INTERNO_EXTERNO }
  ];

  readonly activeOptions = [
    { label: 'Todos', value: null },
    { label: this.translate.instant('workflows.status.published'), value: true },
    { label: this.translate.instant('workflows.status.archived'), value: false }
  ];

  readonly filteredDocTypes = computed(() => {
    const search = this.searchText().toLowerCase();
    const dist = this.filterDistribution();
    const docType = this.filterDocType().toLowerCase();
    const active = this.filterActive();
    return this.docTypes().filter(dt => {
      if (search && !dt.code.toLowerCase().includes(search) && !dt.name.toLowerCase().includes(search)) return false;
      if (dist && dt.distribution !== dist) return false;
      if (docType && !dt.doc_category.toLowerCase().includes(docType)) return false;
      if (active !== null && dt.is_active !== active) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.api.getDocumentTypes().subscribe(data => this.docTypes.set(data));
  }

  navigateToNew(): void { this.router.navigate(['/intelligence/workflows/document-types/new']); }
  navigateToEdit(dt: BpmsDocumentType): void { this.router.navigate(['/intelligence/workflows/document-types', dt.id]); }

  toggleActive(dt: BpmsDocumentType): void {
    this.api.updateDocumentType(dt.id, { is_active: !dt.is_active }).subscribe(updated => {
      this.docTypes.update(list => list.map(d => d.id === updated.id ? updated : d));
    });
  }

  distributionLabel(value: string): string {
    const map: Record<string, string> = { EXTERNO: 'Externo', INTERNO: 'Interno', INTERNO_EXTERNO: 'Interno/Externo' };
    return map[value] ?? value;
  }
}
