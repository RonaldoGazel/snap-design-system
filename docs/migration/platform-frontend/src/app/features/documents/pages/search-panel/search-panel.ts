import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ClassificationBadgeComponent } from '../shared/classification-badge/classification-badge';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { SearchService } from '../services/search.service';
import {
  DocumentSearchItem,
  SearchRequest,
  DocumentType,
  DocumentStatus,
  SecurityClassification,
  Priority,
} from '../models/document.models';
import { handleDocumentError } from '../services/error-handler.util';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    PaginatorModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ClassificationBadgeComponent,
    StatusBadgeComponent,
    DateFormatPipe,
  ],
  providers: [MessageService],
  templateUrl: './search-panel.html',
  styleUrl: './search-panel.css',
})
export class SearchComponent {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  query = signal('');
  results = signal<DocumentSearchItem[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);
  hasSearched = signal(false);
  showAdvancedFilters = signal(false);

  // Advanced filters
  typeFilter = signal<DocumentType[] | null>(null);
  classificationFilter = signal<SecurityClassification | null>(null);
  priorityFilter = signal<Priority | null>(null);
  statusFilter = signal<DocumentStatus[] | null>(null);
  sectorFilter = signal<string | null>(null);
  periodFilter = signal<Date[] | null>(null);
  responsibleFilter = signal<string | null>(null);

  typeOptions = [
    { label: 'Capa', value: 'CAPA' },
    { label: 'Despacho', value: 'DESPACHO' },
    { label: 'Relatório', value: 'RELATORIO' },
    { label: 'Ofício', value: 'OFICIO' },
    { label: 'Anexo', value: 'ANEXO' },
  ];

  classificationOptions = [
    { label: 'Público', value: 'PUBLICO' },
    { label: 'Reservado', value: 'RESERVADO' },
    { label: 'Sigiloso', value: 'SIGILOSO' },
  ];

  priorityOptions = [
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Alta', value: 'ALTA' },
    { label: 'Urgente', value: 'URGENTE' },
  ];

  statusOptions = [
    { label: 'Rascunho', value: 'RASCUNHO' },
    { label: 'Ativo', value: 'ACTIVE' },
    { label: 'Em Revisão', value: 'IN_REVIEW' },
    { label: 'Formalizado', value: 'FORMALIZED' },
    { label: 'Rejeitado', value: 'REJECTED' },
    { label: 'Tramitando', value: 'TRAMITATING' },
    { label: 'Atribuído', value: 'ASSIGNED' },
    { label: 'Arquivado', value: 'ARCHIVED' },
  ];

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
  }

  search(): void {
    this.currentPage.set(1);
    this.executeSearch();
  }

  executeSearch(): void {
    this.loading.set(true);
    this.hasSearched.set(true);
    this.error.set(null);

    const request: SearchRequest = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    const q = this.query();
    if (q.trim()) request.query = q.trim();

    const types = this.typeFilter();
    if (types && types.length > 0) request.type = types[0];

    const classification = this.classificationFilter();
    if (classification) request.security_level = Number(classification) || undefined;

    const priority = this.priorityFilter();
    if (priority) request.priority = priority;

    const statuses = this.statusFilter();
    if (statuses && statuses.length > 0) request.status = statuses[0];

    const sector = this.sectorFilter();
    if (sector) request.sectorId = sector;

    const period = this.periodFilter();
    if (period && period.length >= 1 && period[0]) {
      request.createdFrom = period[0].toISOString();
      if (period.length >= 2 && period[1]) {
        request.createdTo = period[1].toISOString();
      }
    }

    const responsible = this.responsibleFilter();
    if (responsible) request.responsibleId = responsible;

    this.searchService.search(request).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.results.set(res.data.items);
          this.totalRecords.set(res.data.total);
        } else {
          this.results.set([]);
          this.totalRecords.set(0);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.results.set([]);
        this.totalRecords.set(0);
        this.loading.set(false);
        this.error.set('Falha ao buscar documentos.');
        handleDocumentError(err, this.messageService);
      },
    });
  }

  onPageChange(event: PaginatorState): void {
    const rows = event.rows ?? this.pageSize();
    this.currentPage.set(Math.floor((event.first ?? 0) / rows) + 1);
    this.pageSize.set(rows);
    this.executeSearch();
  }

  onRowClick(item: DocumentSearchItem): void {
    this.router.navigate(['/intelligence', 'documentos', 'editor', item.document.id]);
  }
}
