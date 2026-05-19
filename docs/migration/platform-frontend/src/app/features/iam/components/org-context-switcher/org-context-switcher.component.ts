import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActiveOrgService } from '../../services/active-org.service';
import { OrganizationService } from '../../services/organization.service';
import type { OrganizationResponse } from '../../models/identity.model';

interface OrgOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-org-context-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectModule, Tag, TranslateModule],
  styles: `
    :host {
      display: block;
    }
    .switcher-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .read-only-badge {
      flex-shrink: 0;
    }
  `,
  template: `
    @if (activeOrg.isPlatformAdmin()) {
      <div class="switcher-container">
        <p-select
          [options]="orgOptions()"
          [ngModel]="selectedValue()"
          (ngModelChange)="onSelectionChange($event)"
          optionLabel="label"
          optionValue="value"
          data-testid="iam-ctx-switcher"
          [placeholder]="'admin.orgSwitcher.platform' | translate"
          [style]="{ minWidth: '220px' }"
        />
        @if (showReadOnlyBadge()) {
          <p-tag
            class="read-only-badge"
            severity="warn"
            [value]="'admin.orgSwitcher.readOnly' | translate"
          />
        }
      </div>
    }
  `,
})
export class OrgContextSwitcherComponent implements OnInit {
  protected readonly activeOrg = inject(ActiveOrgService);
  private readonly orgService = inject(OrganizationService);
  private readonly translate = inject(TranslateService);

  private readonly organizations = signal<OrganizationResponse[]>([]);

  readonly orgOptions = computed<OrgOption[]>(() => {
    const platformLabel = this.translate.instant('admin.orgSwitcher.platform') as string;
    const myOrgSuffix = this.translate.instant('admin.orgSwitcher.myOrg') as string;
    const userOrgId = this.activeOrg.userOrganizationId();

    const platformOption: OrgOption = {
      label: platformLabel || 'Platform',
      value: null,
    };

    const orgs = this.organizations().map((org) => ({
      label: org.id === userOrgId ? `${org.name} (${myOrgSuffix || 'My Org'})` : org.name,
      value: org.id,
    }));

    return [platformOption, ...orgs];
  });

  readonly selectedValue = computed<string | null>(() => this.activeOrg.activeOrganizationId());

  readonly showReadOnlyBadge = computed(
    () => this.activeOrg.isOrgView() && !this.activeOrg.isOwnOrg(),
  );

  ngOnInit(): void {
    this.orgService.listOrganizations({ limit: 1000, offset: 0 }).subscribe((response) => {
      this.organizations.set(response.items);
    });
  }

  onSelectionChange(value: string | null): void {
    if (value === null) {
      this.activeOrg.switchToPlatformView();
    } else {
      const org = this.organizations().find((o) => o.id === value);
      if (org) {
        this.activeOrg.switchOrg(org.id, org.name);
      }
    }
  }
}
