import { Component, OnInit, inject, signal, input, ChangeDetectionStrategy} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsFlowStateService } from '../../services/bpms-flow-state.service';
import { BpmsFlowVersion } from '../../models/bpms.model';
import { FlowVersionStatus, FlowStatus } from '../../models/bpms.enums';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-version-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    TagModule, ButtonModule, TableModule,
    TranslateModule
  ],
  templateUrl: './flow-version-list.html',
  styleUrl: './flow-version-list.css',
})
export class FlowVersionListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly flowState = inject(BpmsFlowStateService);

  readonly flowId = input.required<string>();
  readonly versions = signal<BpmsFlowVersion[]>([]);

  ngOnInit(): void {
    this.loadVersions();
  }

  loadVersions(): void {
    this.api.getFlowVersions(this.flowId()).subscribe(data => this.versions.set(data));
  }

  private reloadFlowState(): void {
    this.loadVersions();
    this.flowState.loadFlow(this.flowId());
  }

  createVersion(): void {
    this.api.createFlowVersion(this.flowId(), {}).subscribe(() => this.reloadFlowState());
  }

  publishVersion(version: BpmsFlowVersion): void {
    this.api.publishFlowVersion(version.id).subscribe(() => this.reloadFlowState());
  }

  deactivateVersion(version: BpmsFlowVersion): void {
    this.api.deactivateFlowVersion(version.id).subscribe(() => this.reloadFlowState());
  }

  canPublish(version: BpmsFlowVersion): boolean {
    return version.status === FlowStatus.DRAFT;
  }

  canDeactivate(version: BpmsFlowVersion): boolean {
    return version.status === FlowStatus.PUBLISHED;
  }

  statusSeverity(status: string): 'info' | 'success' | 'danger' | 'warn' | 'secondary' | 'contrast' {
    const map: Record<string, 'warn' | 'success' | 'danger'> = {
      RASCUNHO: 'warn',
      PUBLICADO: 'success',
      DESATIVADO: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      RASCUNHO: 'workflows.status.draft',
      PUBLICADO: 'workflows.status.published',
      DESATIVADO: 'workflows.status.archived',
    };
    return map[status] ?? status;
  }
}
