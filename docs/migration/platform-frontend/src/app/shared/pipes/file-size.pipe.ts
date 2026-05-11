import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fileSize', standalone: true })
export class FileSizePipe implements PipeTransform {
  private static readonly UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

  transform(value: number | null | undefined): string {
    if (value == null) {
      return '-';
    }

    if (value === 0) {
      return '0 B';
    }

    const exponent = Math.min(
      Math.floor(Math.log(value) / Math.log(1024)),
      FileSizePipe.UNITS.length - 1,
    );
    const size = value / Math.pow(1024, exponent);

    return `${size.toFixed(1)} ${FileSizePipe.UNITS[exponent]}`;
  }
}
