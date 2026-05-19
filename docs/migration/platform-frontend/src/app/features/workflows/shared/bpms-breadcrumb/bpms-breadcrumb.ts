import { Component, input, ChangeDetectionStrategy} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bpms-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslateModule
  ],
  templateUrl: './bpms-breadcrumb.html',
  styleUrl: './bpms-breadcrumb.css',
})
export class BpmsBreadcrumbComponent {
  readonly items = input<Array<{ label: string; route?: string }>>([]);
}
