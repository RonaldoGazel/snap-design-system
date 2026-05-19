import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { VisualBpmsApiService } from '../../services/visual-bpms-api.service';
import { BpmsVisualFlow, VisualFlowStatus } from '../../models/visual-bpms.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-visual-flow-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule, TableModule, TagModule, ButtonModule, InputTextModule,
    TranslateModule
  ],
  templateUrl: './visual-flow-list.html',
  styleUrl: './visual-flow-list.css',
})
export class VisualFlowListComponent implements OnInit {
  private readonly api = inject(VisualBpmsApiService);
  private readonly router = inject(Router);

  readonly flows = signal<BpmsVisualFlow[]>([]);
  readonly searchText = signal('');

  readonly filteredFlows = computed(() => {
    const search = this.searchText().toLowerCase();
    return this.flows().filter(flow => {
      if (search && !flow.name.toLowerCase().includes(search)) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.api.getVisualFlows().subscribe(data => this.flows.set(data));
  }

  navigateToNew(): void {
    this.router.navigate(['/intelligence/workflows/visual-bpms/new']);
  }

  navigateToBuilder(flow: BpmsVisualFlow): void {
    this.router.navigate(['/intelligence/workflows/visual-bpms', flow.id]);
  }

  getStatusSeverity(status: VisualFlowStatus): 'warn' | 'success' | 'danger' {
    switch (status) {
      case 'RASCUNHO': return 'warn';
      case 'ATIVO': return 'success';
      case 'INATIVO': return 'danger';
    }
  }

  getStatusLabel(status: VisualFlowStatus): string {
    switch (status) {
      case 'RASCUNHO': return 'workflows.status.draft';
      case 'ATIVO': return 'workflows.status.published';
      case 'INATIVO': return 'workflows.status.archived';
    }
  }
}
