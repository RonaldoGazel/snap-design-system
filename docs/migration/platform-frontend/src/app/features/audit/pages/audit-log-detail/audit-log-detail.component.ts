import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuditLogService } from '../../services/audit-log.service';
import { ForbiddenViewComponent } from '../../components/forbidden-view/forbidden-view.component';
import { formatAuditDate } from '../../utils/date-format.util';
import { AuditLogResponse } from '../../models/audit-log.model';

@Component({
  selector: 'app-audit-log-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    ButtonModule,
    Message,
    ProgressSpinnerModule,
    TranslateModule,
    ForbiddenViewComponent,
  ],
  template: `
    @if (forbidden()) {
      <app-forbidden-view />
    } @else if (loading()) {
      <div class="flex justify-content-center" style="margin-top: 4rem">
        <p-progressSpinner />
      </div>
    } @else if (notFound()) {
      <div class="detail-container">
        <p-message severity="warn" [style]="{ width: '100%' }">
          <span>{{ 'audit.error.notFound' | translate }}</span>
        </p-message>
        <p-button
          [label]="'audit.detail.back' | translate"
          icon="pi pi-arrow-left"
          severity="secondary"
          [style]="{ 'margin-top': '1rem' }"
          (onClick)="onBack()"
        />
      </div>
    } @else if (errorMessage()) {
      <div class="detail-container">
        <p-message [severity]="'error'" [style]="{ width: '100%' }">
          <span>{{ errorMessage()! | translate }}</span>
        </p-message>
        <p-button
          [label]="'audit.error.retry' | translate"
          severity="secondary"
          [style]="{ 'margin-top': '1rem' }"
          (onClick)="onRetry()"
        />
      </div>
    } @else if (log()) {
      <div class="detail-container">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
          <p-button
            icon="pi pi-arrow-left"
            [label]="'audit.detail.back' | translate"
            severity="secondary"
            (onClick)="onBack()"
          />
          <h2 style="margin: 0;">{{ 'audit.detail.title' | translate }}</h2>
        </div>

        <!-- Event Identification -->
        <p-card
          [header]="'audit.detail.sectionIdentification' | translate"
          [style]="{ 'margin-bottom': '1rem' }"
        >
          <div class="field-grid">
            <div class="field-row">
              <span class="field-label">event_id</span>
              <span class="field-value"
                >{{ log()!.event_id }}
                <button class="copy-btn" (click)="onCopy(log()!.event_id)">
                  <i class="pi pi-copy"></i></button
              ></span>
            </div>
            <div class="field-row">
              <span class="field-label">event_type</span>
              <span class="field-value">{{ log()!.event_type }}</span>
            </div>
            <div class="field-row">
              <span class="field-label">event_version</span>
              <span class="field-value">{{ log()!.event_version }}</span>
            </div>
            <div class="field-row">
              <span class="field-label">id</span>
              <span class="field-value">{{ log()!.id }}</span>
            </div>
          </div>
        </p-card>

        <!-- Timestamps -->
        <p-card
          [header]="'audit.detail.sectionTemporal' | translate"
          [style]="{ 'margin-bottom': '1rem' }"
        >
          <div class="field-grid">
            <div class="field-row">
              <span class="field-label">occurred_at</span>
              <span class="field-value">{{ formatDate(log()!.occurred_at) }}</span>
            </div>
            <div class="field-row">
              <span class="field-label">received_at</span>
              <span class="field-value">{{ formatDate(log()!.received_at) }}</span>
            </div>
          </div>
        </p-card>

        <!-- Traceability -->
        <p-card
          [header]="'audit.detail.sectionTraceability' | translate"
          [style]="{ 'margin-bottom': '1rem' }"
        >
          <div class="field-grid">
            <div class="field-row">
              <span class="field-label">correlation_id</span>
              <span class="field-value"
                >{{ log()!.correlation_id }}
                <button class="copy-btn" (click)="onCopy(log()!.correlation_id)">
                  <i class="pi pi-copy"></i></button
              ></span>
            </div>
            <div class="field-row">
              <span class="field-label">request_id</span>
              <span class="field-value">
                @if (log()!.request_id) {
                  {{ log()!.request_id }}
                  <button class="copy-btn" (click)="onCopy(log()!.request_id!)">
                    <i class="pi pi-copy"></i>
                  </button>
                } @else {
                  <span class="null-value">N/A</span>
                }
              </span>
            </div>
            <div class="field-row">
              <span class="field-label">trace_id</span>
              <span class="field-value">{{ log()!.trace_id ?? 'N/A' }}</span>
            </div>
            <div class="field-row">
              <span class="field-label">producer</span>
              <span class="field-value">{{ log()!.producer }}</span>
            </div>
          </div>
        </p-card>

        <!-- Actor & Action -->
        <p-card
          [header]="'audit.detail.sectionActor' | translate"
          [style]="{ 'margin-bottom': '1rem' }"
        >
          <div class="field-grid">
            <div class="field-row">
              <span class="field-label">actor_id</span>
              <span class="field-value"
                >{{ log()!.actor_id }}
                <button class="copy-btn" (click)="onCopy(log()!.actor_id)">
                  <i class="pi pi-copy"></i></button
              ></span>
            </div>
            <div class="field-row">
              <span class="field-label">actor_type</span>
              <span class="field-value">{{ log()!.actor_type }}</span>
            </div>
            <div class="field-row">
              <span class="field-label">action</span>
              <span class="field-value">{{ log()!.action }}</span>
            </div>
          </div>
        </p-card>

        <!-- Resource -->
        <p-card
          [header]="'audit.detail.sectionResource' | translate"
          [style]="{ 'margin-bottom': '1rem' }"
        >
          <div class="field-grid">
            <div class="field-row">
              <span class="field-label">resource_type</span>
              <span class="field-value">{{ log()!.resource_type }}</span>
            </div>
            <div class="field-row">
              <span class="field-label">resource_id</span>
              <span class="field-value"
                >{{ log()!.resource_id }}
                <button class="copy-btn" (click)="onCopy(log()!.resource_id)">
                  <i class="pi pi-copy"></i></button
              ></span>
            </div>
          </div>
        </p-card>

        <!-- Outcome -->
        <p-card
          [header]="'audit.detail.sectionOutcome' | translate"
          [style]="{ 'margin-bottom': '1rem' }"
        >
          <div class="field-grid">
            <div class="field-row">
              <span class="field-label">{{ 'audit.table.outcome' | translate }}</span>
              <span class="field-value">
                <span
                  class="outcome-badge"
                  [class.outcome-success]="log()!.outcome === 'success'"
                  [class.outcome-failure]="log()!.outcome === 'failure'"
                >
                  {{ 'audit.outcome.' + log()!.outcome | translate }}
                </span>
              </span>
            </div>
            <div class="field-row">
              <span class="field-label">{{ 'audit.detail.failureReason' | translate }}</span>
              <span class="field-value">
                @if (log()!.failure_reason) {
                  <span class="failure-highlight">{{ log()!.failure_reason }}</span>
                } @else {
                  <span class="null-value">{{
                    'audit.detail.failureReasonEmpty' | translate
                  }}</span>
                }
              </span>
            </div>
          </div>
        </p-card>

        <!-- Metadata -->
        <p-card [header]="'audit.detail.metadata' | translate">
          @if (log()!.metadata) {
            <p-button
              [label]="metadataExpanded() ? 'Collapse' : 'Expand'"
              [icon]="metadataExpanded() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              severity="secondary"
              size="small"
              (onClick)="toggleMetadata()"
              [style]="{ 'margin-bottom': '0.5rem' }"
            />
            @if (metadataExpanded()) {
              <pre class="metadata-block"><code>{{ formatMetadata(log()!.metadata) }}</code></pre>
            }
          } @else {
            <span class="null-value">{{ 'audit.detail.metadataEmpty' | translate }}</span>
          }
        </p-card>

        <!-- Copied toast -->
        @if (copiedField()) {
          <div class="copied-toast">{{ 'audit.detail.copied' | translate }}</div>
        }
      </div>
    }
  `,
  styles: [
    `
      .detail-container {
        padding: 1.5rem;
        max-width: 900px;
      }
      .field-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .field-row {
        display: flex;
        gap: 1rem;
        align-items: baseline;
      }
      .field-label {
        font-weight: 600;
        min-width: 140px;
        color: var(--p-text-muted-color);
        font-size: 0.9rem;
      }
      .field-value {
        word-break: break-all;
        font-family: monospace;
        font-size: 0.9rem;
      }
      .null-value {
        color: var(--p-text-muted-color);
        font-style: italic;
      }
      .copy-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--p-primary-color);
        padding: 0 0.25rem;
        font-size: 0.85rem;
      }
      .copy-btn:hover {
        color: var(--p-primary-600);
      }
      .outcome-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .outcome-success {
        background-color: color-mix(in srgb, var(--p-green-500) 15%, transparent);
        color: var(--p-green-500);
      }
      .outcome-failure {
        background-color: color-mix(in srgb, var(--p-red-500) 15%, transparent);
        color: var(--p-red-500);
      }
      .failure-highlight {
        color: var(--p-red-500);
        font-weight: 500;
      }
      .metadata-block {
        background: var(--p-content-background);
        border: 1px solid var(--p-content-border-color);
        border-radius: 6px;
        padding: 1rem;
        max-height: 300px;
        overflow-y: auto;
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .copied-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--p-green-600);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
      }
      @keyframes fadeInOut {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        15% {
          opacity: 1;
          transform: translateY(0);
        }
        85% {
          opacity: 1;
          transform: translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateY(-10px);
        }
      }
    `,
  ],
})
export class AuditLogDetailComponent implements OnInit {
  private readonly auditLogService = inject(AuditLogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly log = signal<AuditLogResponse | null>(null);
  readonly loading = signal<boolean>(true);
  readonly notFound = signal<boolean>(false);
  readonly forbidden = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly metadataExpanded = signal<boolean>(false);
  readonly copiedField = signal<boolean>(false);

  private eventId = '';

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['eventId'] ?? '';
    this.fetchDetail();
  }

  onBack(): void {
    this.router.navigate(['/audit-logs'], {
      queryParamsHandling: 'preserve',
    });
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.fetchDetail();
  }

  onCopy(value: string): void {
    try {
      navigator.clipboard.writeText(value).then(() => {
        this.copiedField.set(true);
        setTimeout(() => this.copiedField.set(false), 2000);
      });
    } catch {
      // Clipboard API not available (non-HTTPS context)
    }
  }

  toggleMetadata(): void {
    this.metadataExpanded.update((v) => !v);
  }

  formatMetadata(metadata: Record<string, unknown> | null): string {
    if (!metadata) return '';
    return JSON.stringify(metadata, null, 2);
  }

  formatDate(isoDate: string): string {
    return formatAuditDate(isoDate, this.translate.currentLang || 'en');
  }

  private fetchDetail(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.notFound.set(false);

    this.auditLogService.getAuditLogByEventId(this.eventId).subscribe({
      next: (response) => {
        this.log.set(response);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);

        if (err.status === 403) {
          this.forbidden.set(true);
          return;
        }
        if (err.status === 404) {
          this.notFound.set(true);
          return;
        }
        if (err.status === 503) {
          this.errorMessage.set('audit.error.serviceUnavailable');
          return;
        }
        this.errorMessage.set('audit.error.networkError');
      },
    });
  }
}
