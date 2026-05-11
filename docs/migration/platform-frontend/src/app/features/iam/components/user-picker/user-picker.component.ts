import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { UserService } from '../../services/user.service';
import { ActiveOrgService } from '../../services/active-org.service';
import { UserResponse } from '../../models/identity.model';

@Component({
  selector: 'app-user-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AutoComplete, TranslateModule],
  templateUrl: './user-picker.component.html',
  styleUrl: './user-picker.component.css',
})
export class UserPickerComponent implements OnInit, OnDestroy {
  /** Emits the selected user's internal user.id (FR-1) */
  readonly userSelected = output<string>();

  /** Optional: scope search to a specific organization */
  readonly organizationId = input<string | null>(null);

  /** Placeholder i18n key */
  readonly placeholder = input<string>('admin.userPicker.placeholder');

  readonly suggestions = signal<UserResponse[]>([]);

  displayValue = '';

  private readonly userService = inject(UserService);
  private readonly activeOrg = inject(ActiveOrgService);
  private readonly searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        filter((query) => query.length >= 2),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const orgId = this.organizationId() ?? this.activeOrg.activeOrganizationId();
          return this.userService.listUsers(
            {
              search: query,
              organization_id: orgId ?? undefined,
              limit: 10,
              offset: 0,
            },
            // When organizationId is explicitly provided (e.g. recovery dialog),
            // override the X-Organization-Id header so the backend scopes the
            // search to the target org instead of the platform-admin's active org.
            this.organizationId() ? { orgId: this.organizationId()! } : undefined,
          );
        }),
      )
      .subscribe((response) => {
        this.suggestions.set(response.items);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearch(event: AutoCompleteCompleteEvent): void {
    this.searchSubject.next(event.query);
  }

  onSelect(event: AutoCompleteSelectEvent): void {
    const user = event.value as UserResponse;
    this.displayValue = `${user.display_name} (${user.email})`;
    this.userSelected.emit(user.id);
  }

  onClear(): void {
    this.displayValue = '';
  }
}
