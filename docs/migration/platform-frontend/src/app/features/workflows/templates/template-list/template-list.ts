import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsTemplate } from '../../models/bpms.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-template-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TableModule, TagModule, ButtonModule, InputTextModule, TranslateModule],
  templateUrl: './template-list.html',
  styleUrl: './template-list.css',
})
export class TemplateListComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly router = inject(Router);

  readonly templates = signal<BpmsTemplate[]>([]);
  readonly searchText = signal('');

  readonly filteredTemplates = computed(() => {
    const search = this.searchText().toLowerCase();
    return this.templates().filter((t) => {
      if (search && !t.name.toLowerCase().includes(search)) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.api.getTemplates().subscribe((data) => this.templates.set(data));
  }

  navigateToNew(): void {
    this.router.navigate(['/intelligence/workflows/templates/new']);
  }

  navigateToEdit(t: BpmsTemplate): void {
    this.router.navigate(['/intelligence/workflows/templates', t.id]);
  }

  statusSeverity(status: string): 'success' | 'danger' | 'secondary' {
    return status === 'active' ? 'success' : 'danger';
  }
}
