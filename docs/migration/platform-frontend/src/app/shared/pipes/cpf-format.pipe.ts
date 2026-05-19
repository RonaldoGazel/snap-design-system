import { Pipe, PipeTransform } from '@angular/core';

import { formatCPF } from '../utils/validators';

@Pipe({ name: 'cpfFormat', standalone: true })
export class CpfFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (value == null || value === '') {
      return '-';
    }

    return formatCPF(value);
  }
}
