import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ClassificationBadgeComponent } from '../shared/classification-badge/classification-badge';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { ProcessService, GetProcessesParams } from '../services/process.service';
import {
  Process,
  ProcessStatus,
  SecurityClassification,
  Priority,
} from '../models/document.models';
import { handleDocumentError } from '../services/error-handler.util';

@Component({
  selector: 'app-process-list',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    ToastModule,
    ClassificationBadgeComponent,
    StatusBadgeComponent,
    DateFormatPipe,
  ],
  providers: [MessageService],
  templateUrl: './process-list.html',
  styleUrl: './process-list.css',
})
export class ProcessListComponent implements OnInit {
  private readonly processService = inject(ProcessService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  processes = signal<Process[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  statusFilter = signal<ProcessStatus | null>(null);
  classificationFilter = signal<SecurityClassification | null>(null);
  priorityFilter = signal<Priority | null>(null);
  sectorFilter = signal<string | null>(null);
  periodFilter = signal<Date[] | null>(null);

  statusOptions = [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Arquivado', value: 'ARQUIVADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Tramitando', value: 'TRAMITANDO' },
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

  ngOnInit(): void {
    this.loadProcesses();
  }

  loadProcesses(): void {
    this.loading.set(true);
    this.error.set(null);
    const params: GetProcessesParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };
    const status = this.statusFilter();
    if (status) params.status = status;
    const classification = this.classificationFilter();
    if (classification) params.security_level = classification;
    const priority = this.priorityFilter();
    if (priority) params.priority = priority;
    const sector = this.sectorFilter();
    if (sector) params.sectorId = sector;

    this.processService.getProcesses(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.processes.set(res.data.items);
          this.totalRecords.set(res.data.total);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Falha ao carregar processos.');
        handleDocumentError(err, this.messageService);
      },
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = (event.rows as number) ?? this.pageSize();
    const page = Math.floor(((event.first as number) ?? 0) / rows) + 1;
    this.currentPage.set(page);
    this.pageSize.set(rows);
    this.loadProcesses();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadProcesses();
  }

  onRowClick(process: Process): void {
    this.router.navigate(['/intelligence', 'documentos', 'processes', process.id]);
  }

  navigateToNew(): void {
    this.router.navigate(['/intelligence', 'documentos', 'new']);
  }
}
