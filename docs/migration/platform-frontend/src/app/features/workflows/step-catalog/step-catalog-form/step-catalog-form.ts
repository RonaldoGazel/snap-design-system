import { Component, OnInit, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { BpmsApiService } from '../../services/bpms-api.service';
import { BpmsStepCatalog } from '../../models/bpms.model';
import { AVAILABLE_PERMISSIONS } from '../../models/bpms.enums';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-step-catalog-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    ButtonModule,
    TranslateModule
  ],
  templateUrl: './step-catalog-form.html',
  styleUrl: './step-catalog-form.css',
})
export class StepCatalogFormComponent implements OnInit {
  private readonly api = inject(BpmsApiService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly editId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedPermissions = signal<string[]>([]);
  readonly availablePermissions = AVAILABLE_PERMISSIONS;

  private existingNames = signal<string[]>([]);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    is_active: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.isEditMode.set(true);
    }

    this.api.getStepCatalog().subscribe((items) => {
      const names = items
        .filter((item) => item.id !== id)
        .map((item) => item.name.toLowerCase());
      this.existingNames.set(names);

      if (id) {
        const existing = items.find((item) => item.id === id);
        if (existing) this.patchForm(existing);
      }
    });
  }

  private patchForm(step: BpmsStepCatalog): void {
    this.form.patchValue({
      name: step.name,
      description: step.description ?? '',
      is_active: step.is_active,
    });
    this.selectedPermissions.set([...(step.permissions ?? [])]);
  }

  isDuplicateName(): boolean {
    const name = this.form.get('name')?.value?.toLowerCase() ?? '';
    return this.existingNames().includes(name);
  }

  togglePermission(permission: string): void {
    const current = this.selectedPermissions();
    if (current.includes(permission)) {
      this.selectedPermissions.set(current.filter((p) => p !== permission));
    } else {
      this.selectedPermissions.set([...current, permission]);
    }
  }

  isPermissionSelected(permission: string): boolean {
    return this.selectedPermissions().includes(permission);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isDuplicateName()) {
      this.errorMessage.set('Já existe uma etapa com este nome.');
      return;
    }

    this.errorMessage.set(null);
    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload: Partial<BpmsStepCatalog> = {
      name: value.name ?? '',
      description: value.description || undefined,
      permissions: this.selectedPermissions(),
      is_active: value.is_active ?? true,
    };

    const id = this.editId();
    const request$ = id
      ? this.api.updateStepCatalog(id, payload)
      : this.api.createStepCatalog(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/intelligence/workflows/step-catalog']),
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? this.translate.instant('workflows.errors.saveStepFailed'));
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/intelligence/workflows/step-catalog']);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
