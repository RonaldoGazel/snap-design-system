import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';

import { SecurityClassification } from '../../models/document.models';

@Component({
  selector: 'app-classification-badge',
  standalone: true,
  imports: [Tag],
  templateUrl: './classification-badge.html',
})
export class ClassificationBadgeComponent {
  classification = input<SecurityClassification | null | undefined>();

  severity = computed<'success' | 'warn' | 'danger' | undefined>(() => {
    const value = this.classification();
    switch (value) {
      case 'PUBLICO':
        return 'success';
      case 'RESERVADO':
        return 'warn';
      case 'SIGILOSO':
        return 'danger';
      default:
        return undefined;
    }
  });

  label = computed<string | undefined>(() => {
    const value = this.classification();
    switch (value) {
      case 'PUBLICO':
        return 'PÚBLICO';
      case 'RESERVADO':
        return 'RESERVADO';
      case 'SIGILOSO':
        return 'SIGILOSO';
      default:
        return undefined;
    }
  });
}
