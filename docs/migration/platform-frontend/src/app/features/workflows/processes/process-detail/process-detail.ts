import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TimelineModule } from 'primeng/timeline';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsProcess } from '../../models/bpms.model';
import { ProcessStatus } from '../../models/bpms.enums';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bpms-process-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    TagModule, ButtonModule, CardModule, TimelineModule,
    TranslateModule
  ],
  templateUrl: './process-detail.html',
  styleUrl: './process-detail.css',
})
export class ProcessDetailComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly processId = signal<string>('');
  readonly process = signal<BpmsProcess | null>(null);
  readonly loading = signal(false);

  readonly canClose = computed(() => {
    const p = this.process();
    if (!p?.document_instances?.length) return false;
    return p.document_instances.every(d => d.status === 'FORMALIZADO' || d.status === 'CANCELADO');
  });

  readonly timelineEvents = computed(() => {
    const p = this.process();
    if (!p?.document_instances) return [];
    const events: Array<{ date: string; title: string; doc: string }> = [];
    for (const doc of p.document_instances) {
      for (const ev of doc.events ?? []) {
        events.push({ date: ev.created_at, title: this.eventLabel(ev.event_type), doc: doc.title });
      }
    }
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.processId.set(id);
    this.loading.set(true);
    this.api.getProcess(id).subscribe({
      next: (p) => { this.process.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void { this.router.navigate(['/intelligence/workflows/processes']); }
  navigateToDocument(id: string): void { this.router.navigate(['/intelligence/workflows/documents', id]); }

  closeProcess(): void {
    if (!this.canClose()) return;
    this.api.updateProcess(this.processId(), { status: ProcessStatus.CLOSED }).subscribe(updated => this.process.set(updated));
  }

  statusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' {
    const map: Record<string, 'success' | 'danger' | 'warn' | 'secondary'> = { ABERTO: 'success', ENCERRADO: 'secondary', CANCELADO: 'danger' };
    return map[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { ABERTO: 'workflows.processStatus.ABERTO', ENCERRADO: 'workflows.processStatus.ENCERRADO', CANCELADO: 'workflows.processStatus.CANCELADO' };
    return map[status] ?? status;
  }

  docStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' | 'info' {
    const map: Record<string, 'success' | 'danger' | 'warn' | 'secondary' | 'info'> = { FORMALIZADO: 'success', CANCELADO: 'danger', EM_PRODUCAO: 'info', EM_REVISAO: 'warn', EM_FORMALIZACAO: 'warn' };
    return map[status] ?? 'secondary';
  }

  docStatusLabel(status: string): string {
    const map: Record<string, string> = { FORMALIZADO: 'workflows.docStatus.formalized', CANCELADO: 'workflows.processStatus.CANCELADO', EM_PRODUCAO: 'workflows.docStatus.inProduction', EM_REVISAO: 'workflows.docStatus.inReview', EM_FORMALIZACAO: 'workflows.docStatus.awaitingFormalization' };
    return map[status] ?? status;
  }

  private eventLabel(type: string): string {
    const map: Record<string, string> = { CRIACAO: 'workflows.eventType.creation', TRAMITACAO: 'workflows.eventType.routing', REVISAO: 'workflows.stepType.review', DEVOLUCAO: 'workflows.transitionType.standard_backward', FORMALIZACAO: 'workflows.stepType.formalization', DIFUSAO_INTERNA: 'workflows.stepType.internal_dissemination', DIFUSAO_EXTERNA: 'workflows.stepType.external_dissemination', ENCERRAMENTO: 'Encerramento' };
    return map[type] ?? type;
  }
}
