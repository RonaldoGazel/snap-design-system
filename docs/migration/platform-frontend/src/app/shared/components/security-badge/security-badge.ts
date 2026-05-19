import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-security-badge',
  standalone: true,
  imports: [Tag],
  templateUrl: './security-badge.html',
})
export class SecurityBadgeComponent {
  classification = input.required<string>();

  severity = computed(() => {
    switch (this.classification()) {
      case 'RESERVADO':
        return 'warn';
      case 'SIGILOSO':
        return 'danger';
      default:
        return 'info';
    }
  });
}
