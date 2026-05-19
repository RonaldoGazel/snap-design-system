import { Component, OnInit, inject, computed, ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { BpmsFlowStateService } from '../../services/bpms-flow-state.service';
import { BpmsApiService } from '../../services/bpms-api.service';
import { ProgressiveSummaryComponent } from '../../shared/progressive-summary/progressive-summary';
import { FlowDiagramComponent } from '../../shared/flow-diagram/flow-diagram';
import { FlowStepEditorComponent } from '../flow-step-editor/flow-step-editor';
import { FlowTransitionEditorComponent } from '../flow-transition-editor/flow-transition-editor';
import { FlowRoleEditorComponent } from '../flow-role-editor/flow-role-editor';
import { FlowRuleEditorComponent } from '../flow-rule-editor/flow-rule-editor';
import { FlowExceptionEditorComponent } from '../flow-exception-editor/flow-exception-editor';
import { FlowVersionListComponent } from '../flow-version-list/flow-version-list';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-flow-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TabsModule, TagModule, ButtonModule,
    ProgressiveSummaryComponent, FlowDiagramComponent,
    FlowStepEditorComponent, FlowTransitionEditorComponent,
    FlowRoleEditorComponent, FlowRuleEditorComponent,
    FlowExceptionEditorComponent, FlowVersionListComponent,
    TranslateModule
  ],
  templateUrl: './flow-detail.html',
  styleUrl: './flow-detail.css',
})
export class FlowDetailComponent implements OnInit {
  private readonly flowState = inject(BpmsFlowStateService);
  private readonly api = inject(BpmsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly flow = this.flowState.currentFlow;
  readonly version = this.flowState.currentVersion;
  readonly steps = this.flowState.steps;
  readonly transitions = this.flowState.transitions;
  readonly roles = this.flowState.roles;
  readonly rules = this.flowState.rules;
  readonly orphanSteps = this.flowState.orphanSteps;
  readonly orphanStepIds = computed(() => this.orphanSteps().map(s => s.id));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.flowState.loadFlow(id);
  }

  goBack(): void { this.router.navigate(['/intelligence/workflows/flows']); }

  createVersion(): void {
    const flowId = this.flow()?.id;
    if (!flowId) return;
    this.api.createFlowVersion(flowId, {}).subscribe(() => this.flowState.loadFlow(flowId));
  }

  statusSeverity(status: string): 'info' | 'success' | 'danger' | 'warn' | 'secondary' | 'contrast' {
    const map: Record<string, 'warn' | 'success' | 'danger'> = { RASCUNHO: 'warn', ATIVO: 'success', INATIVO: 'danger' };
    return map[status] ?? 'secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { RASCUNHO: 'workflows.status.draft', ATIVO: 'workflows.status.published', INATIVO: 'workflows.status.archived' };
    return map[status] ?? status;
  }
}
