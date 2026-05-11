import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { StatusBadgeComponent } from '../shared/status-badge/status-badge';
import { ApolizationService } from '../services/apolization.service';
import { DocumentService } from '../services/document.service';
import { Document, DocumentMention, MentionType } from '../models/document.models';
import { handleDocumentError } from '../services/error-handler.util';

const MENTION_COLOR_MAP: Record<MentionType, string> = {
  PESSOA: '#3b82f6',
  ORGANIZACAO: '#8b5cf6',
  LOCAL: '#22c55e',
  VEICULO: '#f97316',
  TELEFONE: '#06b6d4',
  DOCUMENTO: '#6366f1',
  OUTRO: '#6b7280',
};

@Component({
  selector: 'app-apolization-panel',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ProgressBarModule,
    DialogModule,
    InputTextModule,
    StatusBadgeComponent,
  ],
  providers: [MessageService],
  templateUrl: './apolization-panel.html',
  styleUrl: './apolization-panel.css',
})
export class ApolizationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly apolizationService = inject(ApolizationService);
  private readonly documentService = inject(DocumentService);
  private readonly messageService = inject(MessageService);

  document = signal<Document | null>(null);
  mentions = signal<DocumentMention[]>([]);
  loading = signal(false);
  processing = signal(false);
  mentionsLoading = signal(false);

  // Confirm dialog
  showConfirmDialog = signal(false);
  confirmingMention = signal<DocumentMention | null>(null);
  confirmedEntityId = signal('');

  // Summary
  totalMentions = computed(() => this.mentions().length);
  confirmedCount = computed(() => this.mentions().filter((m) => m.status === 'CONFIRMED').length);
  rejectedCount = computed(() => this.mentions().filter((m) => m.status === 'REJECTED').length);
  pendingCount = computed(
    () =>
      this.mentions().filter((m) => m.status === 'SUGGESTED' || m.status === 'PENDING_REVIEW')
        .length,
  );

  highlightedContent = computed(() => {
    const doc = this.document();
    if (!doc?.content) return '';

    const content = doc.content;
    const sortedMentions = [...this.mentions()].sort((a, b) => b.startOffset - a.startOffset);

    let result = content;
    for (const mention of sortedMentions) {
      const color = MENTION_COLOR_MAP[mention.mentionType] ?? MENTION_COLOR_MAP['OUTRO'];
      const before = result.substring(0, mention.startOffset);
      const text = result.substring(mention.startOffset, mention.endOffset);
      const after = result.substring(mention.endOffset);
      result = `${before}<span class="mention-highlight" style="background-color: ${color}20; border-bottom: 2px solid ${color}; padding: 0 2px;" title="${mention.mentionType}: ${mention.mentionText}">${text}</span>${after}`;
    }

    return result;
  });

  constructor() {
    effect(() => {
      this.route.params.subscribe((params) => {
        const id = params['id'];
        if (id) {
          this.loadDocument(id);
          this.loadMentions(id);
        }
      });
    });
  }

  loadDocument(docId: string): void {
    this.loading.set(true);
    this.documentService.getDocument(docId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.document.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        handleDocumentError(err, this.messageService);
        this.loading.set(false);
      },
    });
  }

  loadMentions(docId: string): void {
    this.mentionsLoading.set(true);
    this.apolizationService.getMentions(docId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.mentions.set(res.data);
        }
        this.mentionsLoading.set(false);
      },
      error: (err) => {
        this.mentionsLoading.set(false);
        handleDocumentError(err, this.messageService);
      },
    });
  }

  executeApolization(): void {
    const doc = this.document();
    if (!doc) return;

    this.processing.set(true);
    this.apolizationService.apolloize(doc.id, {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.mentions.set(res.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Apolização concluída',
            detail: `${res.data.length} menções extraídas.`,
            life: 5000,
          });
        }
        this.processing.set(false);
      },
      error: (err) => {
        handleDocumentError(err, this.messageService);
        this.processing.set(false);
      },
    });
  }

  openConfirmDialog(mention: DocumentMention): void {
    this.confirmingMention.set(mention);
    this.confirmedEntityId.set('');
    this.showConfirmDialog.set(true);
  }

  confirmMention(): void {
    const mention = this.confirmingMention();
    const doc = this.document();
    if (!mention || !doc) return;

    this.apolizationService
      .reviewMention(doc.id, mention.id, {
        status: 'CONFIRMED',
        confirmedEntityId: this.confirmedEntityId() || undefined,
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.mentions.update((list) => list.map((m) => (m.id === mention.id ? res.data! : m)));
            this.messageService.add({
              severity: 'success',
              summary: 'Menção confirmada',
              detail: `Menção "${mention.mentionText}" confirmada.`,
              life: 5000,
            });
          }
          this.showConfirmDialog.set(false);
        },
        error: (err) => {
          handleDocumentError(err, this.messageService);
        },
      });
  }

  rejectMention(mention: DocumentMention): void {
    const doc = this.document();
    if (!doc) return;

    this.apolizationService.reviewMention(doc.id, mention.id, { status: 'REJECTED' }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.mentions.update((list) => list.map((m) => (m.id === mention.id ? res.data! : m)));
          this.messageService.add({
            severity: 'info',
            summary: 'Menção rejeitada',
            detail: `Menção "${mention.mentionText}" rejeitada.`,
            life: 5000,
          });
        }
      },
      error: (err) => {
        handleDocumentError(err, this.messageService);
      },
    });
  }

  isSuggested(mention: DocumentMention): boolean {
    return mention.status === 'SUGGESTED';
  }

  getMentionColor(type: MentionType): string {
    return MENTION_COLOR_MAP[type] ?? MENTION_COLOR_MAP['OUTRO'];
  }
}
