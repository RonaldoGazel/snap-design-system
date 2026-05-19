import { Component, signal, output, viewChild, ElementRef, afterNextRender, Injector, inject, ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';

import { BpmsVisualFlowStageProfile } from '../../../models/visual-bpms.model';
import { AVAILABLE_PERMISSIONS } from '../../../models/bpms.enums';
import { TranslateModule } from '@ngx-translate/core';

export interface PermissionChangeEvent {
  stageProfileId: string;
  permissions: string[];
  customized: boolean;
}

const MENU_MARGIN = 8;

@Component({
  selector: 'app-profile-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, CheckboxModule, ButtonModule,
    TranslateModule
  ],
  templateUrl: './profile-context-menu.html',
  styleUrl: './profile-context-menu.css',
})
export class ProfileContextMenuComponent {
  private readonly injector = inject(Injector);

  readonly visible = signal(false);
  readonly posX = signal(0);
  readonly posY = signal(0);
  readonly profile = signal<BpmsVisualFlowStageProfile | null>(null);
  readonly selectedPermissions = signal<string[]>([]);
  readonly isCustomized = signal(false);
  readonly availablePermissions = AVAILABLE_PERMISSIONS;

  readonly menuRef = viewChild<ElementRef<HTMLElement>>('menuEl');

  readonly permissionsChanged = output<PermissionChangeEvent>();
  readonly profileDeleted = output<string>(); // stageProfileId
  readonly closed = output<void>();

  private stagePermissions: string[] = [];
  private clickX = 0;
  private clickY = 0;

  open(config: {
    x: number;
    y: number;
    profile: BpmsVisualFlowStageProfile;
    stagePermissions: string[];
  }): void {
    this.clickX = config.x;
    this.clickY = config.y;
    // Position off-screen initially to measure without flicker
    this.posX.set(-9999);
    this.posY.set(-9999);
    this.profile.set(config.profile);
    this.stagePermissions = config.stagePermissions;

    // Resolve effective permissions
    const effective = config.profile.permissions_customized
      ? [...(config.profile.permissions ?? [])]
      : [...config.stagePermissions];
    this.selectedPermissions.set(effective);
    this.isCustomized.set(config.profile.permissions_customized);
    this.visible.set(true);

    // After render, measure and reposition
    afterNextRender(() => this.adjustPosition(), { injector: this.injector });
  }

  private adjustPosition(): void {
    const el = this.menuRef()?.nativeElement;
    if (!el) {
      this.posX.set(this.clickX);
      this.posY.set(this.clickY);
      return;
    }

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = this.clickX;
    let y = this.clickY;

    // Vertical: prefer below, flip above if no room
    if (y + rect.height + MENU_MARGIN > vh) {
      y = this.clickY - rect.height;
    }
    // Clamp to top edge
    if (y < MENU_MARGIN) {
      y = MENU_MARGIN;
    }

    // Horizontal: clamp to viewport
    if (x + rect.width + MENU_MARGIN > vw) {
      x = vw - rect.width - MENU_MARGIN;
    }
    if (x < MENU_MARGIN) {
      x = MENU_MARGIN;
    }

    this.posX.set(x);
    this.posY.set(y);
  }

  close(): void {
    this.visible.set(false);
    this.closed.emit();
  }

  togglePermission(perm: string): void {
    const current = this.selectedPermissions();
    if (current.includes(perm)) {
      this.selectedPermissions.set(current.filter((p) => p !== perm));
    } else {
      this.selectedPermissions.set([...current, perm]);
    }
    this.isCustomized.set(true);
  }

  isSelected(perm: string): boolean {
    return this.selectedPermissions().includes(perm);
  }

  restoreDefaults(): void {
    this.selectedPermissions.set([...this.stagePermissions]);
    this.isCustomized.set(false);
  }

  save(): void {
    const p = this.profile();
    if (!p) return;
    this.permissionsChanged.emit({
      stageProfileId: p.id,
      permissions: this.selectedPermissions(),
      customized: this.isCustomized(),
    });
    this.close();
  }

  deleteProfile(): void {
    const p = this.profile();
    if (!p) return;
    this.profileDeleted.emit(p.id);
    this.close();
  }
}
