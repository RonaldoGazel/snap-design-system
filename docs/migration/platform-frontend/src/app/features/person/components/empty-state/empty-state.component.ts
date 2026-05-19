import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

export interface EmptyStateAction {
  label: string;
  routerLink?: string;
  severity?: 'primary' | 'secondary';
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  icon = input<string>('pi pi-inbox');
  title = input.required<string>();
  subtitle = input<string>();
  actions = input<EmptyStateAction[]>([]);
}
