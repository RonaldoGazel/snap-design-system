import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsStepCatalog } from '../../models/bpms.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-step-catalog-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, TableModule, TagModule, ButtonModule, InputTextModule, SelectModule,
    TranslateModule
  ],
  templateUrl: './step-catalog-list.html',
  styleUrl: './step-catalog-list.css',
})
export class StepCatalogListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly steps = signal<BpmsStepCatalog[]>([]);
  readonly searchText = signal('');
  readonly filterActive = signal<boolean | null>(null);

  readonly activeOptions = [
    { label: 'Todos', value: null },
    { label: this.translate.instant('workflows.status.published'), value: true },
    { label: this.translate.instant('workflows.status.archived'), value: false }
  ];

  readonly filteredSteps = computed(() => {
    const search = this.searchText().toLowerCase();
    const active = this.filterActive();
    return this.steps().filter(step => {
      if (search && !step.name.toLowerCase().includes(search)) return false;
      if (active !== null && step.is_active !== active) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.api.getStepCatalog().subscribe(data => this.steps.set(data));
  }

  navigateToNew(): void {
    this.router.navigate(['/intelligence/workflows/step-catalog/new']);
  }

  navigateToEdit(step: BpmsStepCatalog): void {
    this.router.navigate(['/intelligence/workflows/step-catalog', step.id]);
  }

  toggleActive(step: BpmsStepCatalog): void {
    this.api.updateStepCatalog(step.id, { is_active: !step.is_active }).subscribe(updated => {
      this.steps.update(list => list.map(s => s.id === updated.id ? updated : s));
    });
  }
}
