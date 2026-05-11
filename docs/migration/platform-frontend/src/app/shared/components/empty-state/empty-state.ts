import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  icon = input('pi pi-inbox');
  title = input('Nenhum item encontrado');
  message = input<string | undefined>();
}
