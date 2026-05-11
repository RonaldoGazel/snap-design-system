import { Component, signal, output, computed, ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

const STORAGE_KEY = 'bpms_group_connection_skip_dialog';

export interface GroupConnectionDialogResult {
  mode: 'all' | 'sector';
  skipNextTime: boolean;
}

export interface GroupConnectionPending {
  sourceMemberIds: string[];
  targetMemberIds: string[];
}

export interface ProfileInfo {
  id: string;
  name: string;
  unitAcronym: string;
  unitId: string;
}

@Component({
  selector: 'app-group-connection-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DialogModule, RadioButtonModule, CheckboxModule, ButtonModule,
    TranslateModule
  ],
  templateUrl: './group-connection-dialog.html',
  styleUrl: './group-connection-dialog.css',
})
export class GroupConnectionDialogComponent {
  readonly visible = signal(false);
  readonly selectedMode = signal<'all' | 'sector'>('all');
  readonly skipNextTime = signal(false);
  readonly sourceProfiles = signal<ProfileInfo[]>([]);
  readonly targetProfiles = signal<ProfileInfo[]>([]);

  readonly confirmed = output<GroupConnectionDialogResult>();
  readonly cancelled = output<void>();

  private pendingData: GroupConnectionPending | null = null;

  readonly allConnections = computed(() => {
    const sources = this.sourceProfiles();
    const targets = this.targetProfiles();
    const result: string[] = [];
    for (const s of sources) {
      for (const t of targets) {
        result.push(`${s.name} (${s.unitAcronym}) → ${t.name} (${t.unitAcronym})`);
      }
    }
    return result;
  });

  readonly sectorConnections = computed(() => {
    const sources = this.sourceProfiles();
    const targets = this.targetProfiles();
    const result: string[] = [];
    for (const s of sources) {
      for (const t of targets) {
        if (s.unitId && t.unitId && s.unitId === t.unitId) {
          result.push(`${s.name} (${s.unitAcronym}) → ${t.name} (${t.unitAcronym})`);
        }
      }
    }
    return result;
  });

  static shouldSkip(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  static getSavedMode(): 'all' | 'sector' | null {
    const mode = localStorage.getItem(STORAGE_KEY + '_mode');
    return mode === 'all' || mode === 'sector' ? mode : null;
  }

  open(pending: GroupConnectionPending, currentMode: 'all' | 'sector', sources: ProfileInfo[], targets: ProfileInfo[]): void {
    this.pendingData = pending;
    this.selectedMode.set(currentMode);
    this.skipNextTime.set(false);
    this.sourceProfiles.set(sources);
    this.targetProfiles.set(targets);
    this.visible.set(true);
  }

  getPending(): GroupConnectionPending | null {
    return this.pendingData;
  }

  onConfirm(): void {
    const mode = this.selectedMode();
    const skip = this.skipNextTime();

    if (skip) {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem(STORAGE_KEY + '_mode', mode);
    }

    this.confirmed.emit({ mode, skipNextTime: skip });
    this.visible.set(false);
    this.pendingData = null;
  }

  onCancel(): void {
    this.visible.set(false);
    this.pendingData = null;
    this.cancelled.emit();
  }
}
