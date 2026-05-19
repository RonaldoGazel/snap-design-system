import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ClassificationBadgeComponent } from '../shared/classification-badge/classification-badge';
import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { FormalizationService } from '../services/formalization.service';
import { DocumentService } from '../services/document.service';
import { Document, FinalArtifact, IntegrityVerification } from '../models/document.models';
import { handleDocumentError } from '../services/error-handler.util';

@Component({
  selector: 'app-formalization-panel',
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    ClassificationBadgeComponent,
    StatusBadgeComponent,
    DateFormatPipe,
  ],
  providers: [MessageService],
  templateUrl: './formalization-panel.html',
  styleUrl: './formalization-panel.css',
})
export class FormalizationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formalizationService = inject(FormalizationService);
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);

  document = signal<Document | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  formalizing = signal(false);
  verifying = signal(false);

  artifact = signal<FinalArtifact | null>(null);
  integrityResult = signal<IntegrityVerification | null>(null);

  // Checklist items
  checkApproved = signal(false);
  checkVersionConfirmed = signal(false);
  checkClassificationDefined = signal(false);
  checkMetadataComplete = signal(false);

  allChecked = computed(
    () =>
      this.checkApproved() &&
      this.checkVersionConfirmed() &&
      this.checkClassificationDefined() &&
      this.checkMetadataComplete(),
  );

  isFormalized = computed(() => {
    const doc = this.document();
    return doc?.status === 'FORMALIZED' || this.artifact() !== null;
  });

  constructor() {
    effect(() => {
      this.route.params.subscribe((params) => {
        const id = params['id'];
        if (id) {
          this.loadDocument(id);
        }
      });
    });
  }

  loadDocument(docId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.documentService.getDocument(docId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.document.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Falha ao carregar documento.');
        handleDocumentError(err, this.messageService);
        this.loading.set(false);
      },
    });
  }

  formalizeDocument(): void {
    const doc = this.document();
    if (!doc || !this.allChecked()) return;

    this.formalizing.set(true);
    this.formalizationService.formalizeDocument(doc.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.artifact.set(res.data);
          this.document.update((d) => (d ? { ...d, status: 'FORMALIZED' as const } : d));
          this.messageService.add({
            severity: 'success',
            summary: 'Documento formalizado',
            detail: 'Documento formalizado com sucesso. Artefato final gerado.',
            life: 5000,
          });
        }
        this.formalizing.set(false);
      },
      error: (err) => {
        handleDocumentError(err, this.messageService);
        this.formalizing.set(false);
      },
    });
  }

  verifyIntegrity(): void {
    const doc = this.document();
    if (!doc) return;

    this.verifying.set(true);
    this.integrityResult.set(null);
    this.formalizationService.verifyIntegrity(doc.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.integrityResult.set(res.data);
        }
        this.verifying.set(false);
      },
      error: (err) => {
        handleDocumentError(err, this.messageService);
        this.verifying.set(false);
      },
    });
  }
}
