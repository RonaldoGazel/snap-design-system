import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { DisseminationService } from '../services/dissemination.service';
import {
  ExportFormat,
  ExternalDissemination,
  InternalDissemination,
} from '../models/document.models';
import { handleDocumentError } from '../services/error-handler.util';

interface TimelineEvent {
  type: 'internal' | 'external';
  date: string;
  label: string;
  detail: string;
  status: string;
}

@Component({
  selector: 'app-dissemination-panel',
  standalone: true,
  imports: [
    FormsModule,
    TabsModule,
    TableModule,
    TimelineModule,
    SelectModule,
    TextareaModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    StatusBadgeComponent,
    DateFormatPipe,
  ],
  providers: [MessageService],
  templateUrl: './dissemination-panel.html',
  styleUrl: './dissemination-panel.css',
})
export class DisseminationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly disseminationService = inject(DisseminationService);
  private readonly messageService = inject(MessageService);

  documentId = signal('');

  // Internal dissemination
  internalList = signal<InternalDissemination[]>([]);
  internalLoading = signal(false);
  internalSubmitting = signal(false);
  internalSectorId = signal('');
  internalJustification = signal('');

  // External dissemination
  externalList = signal<ExternalDissemination[]>([]);
  externalLoading = signal(false);
  externalSubmitting = signal(false);
  externalEntity = signal('');
  externalContact = signal('');
  externalJustification = signal('');
  externalFormat = signal<ExportFormat>('PDF');

  // Timeline
  trailEvents = signal<TimelineEvent[]>([]);

  sectorOptions = signal([
    { label: 'Setor Alpha', value: 'sector-alpha' },
    { label: 'Setor Beta', value: 'sector-beta' },
    { label: 'Setor Gamma', value: 'sector-gamma' },
  ]);

  formatOptions = signal([
    { label: 'PDF', value: 'PDF' },
    { label: 'DOCX', value: 'DOCX' },
    { label: 'ORIGINAL', value: 'ORIGINAL' },
  ]);

  constructor() {
    effect(() => {
      this.route.params.subscribe((params) => {
        const id = params['id'];
        if (id) {
          this.documentId.set(id);
          this.loadInternalDisseminations();
          this.loadExternalDisseminations();
        }
      });
    });
  }

  loadInternalDisseminations(): void {
    this.internalLoading.set(true);
    this.disseminationService.getInternalDisseminations(this.documentId()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.internalList.set(res.data);
          this.buildTrail();
        }
        this.internalLoading.set(false);
      },
      error: (err) => {
        this.internalLoading.set(false);
        handleDocumentError(err, this.messageService);
      },
    });
  }

  loadExternalDisseminations(): void {
    this.externalLoading.set(true);
    this.disseminationService.getExternalDisseminations(this.documentId()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.externalList.set(res.data);
          this.buildTrail();
        }
        this.externalLoading.set(false);
      },
      error: (err) => {
        this.externalLoading.set(false);
        handleDocumentError(err, this.messageService);
      },
    });
  }

  submitInternalDissemination(): void {
    if (!this.internalSectorId() || !this.internalJustification().trim()) return;

    this.internalSubmitting.set(true);
    this.disseminationService
      .disseminateInternal(this.documentId(), {
        toSectorId: this.internalSectorId(),
        justification: this.internalJustification(),
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Difusão interna realizada',
              detail: 'Documento difundido internamente com sucesso.',
              life: 5000,
            });
            this.internalSectorId.set('');
            this.internalJustification.set('');
            this.loadInternalDisseminations();
          }
          this.internalSubmitting.set(false);
        },
        error: (err) => {
          handleDocumentError(err, this.messageService);
          this.internalSubmitting.set(false);
        },
      });
  }

  submitExternalDissemination(): void {
    if (!this.externalEntity().trim() || !this.externalJustification().trim()) return;

    this.externalSubmitting.set(true);
    this.disseminationService
      .disseminateExternal(this.documentId(), {
        destinationEntity: this.externalEntity(),
        destinationContact: this.externalContact() || undefined,
        justification: this.externalJustification(),
        exportFormat: this.externalFormat(),
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.messageService.add({
              severity: 'info',
              summary: 'Solicitação enviada',
              detail:
                'Solicitação de difusão externa enviada. Aguarda autorização do Subsecretário.',
              life: 5000,
            });
            this.externalEntity.set('');
            this.externalContact.set('');
            this.externalJustification.set('');
            this.externalFormat.set('PDF');
            this.loadExternalDisseminations();
          }
          this.externalSubmitting.set(false);
        },
        error: (err) => {
          handleDocumentError(err, this.messageService);
          this.externalSubmitting.set(false);
        },
      });
  }

  private buildTrail(): void {
    const events: TimelineEvent[] = [];

    for (const item of this.internalList()) {
      events.push({
        type: 'internal',
        date: item.createdAt,
        label: `Difusão Interna → ${item.toSectorName ?? item.toSectorId}`,
        detail: item.justification,
        status: item.status,
      });
    }

    for (const item of this.externalList()) {
      events.push({
        type: 'external',
        date: item.createdAt,
        label: `Difusão Externa → ${item.destinationEntity}`,
        detail: item.justification,
        status: item.status,
      });
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.trailEvents.set(events);
  }
}
