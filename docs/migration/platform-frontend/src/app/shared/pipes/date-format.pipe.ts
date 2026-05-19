import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  private static readonly shortFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  private static readonly longFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  transform(
    value: string | Date | null | undefined,
    format: 'short' | 'long' | 'relative' = 'long',
  ): string {
    if (value == null || value === '') {
      return '-';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) {
      return '-';
    }

    switch (format) {
      case 'short':
        return DateFormatPipe.shortFormatter.format(date);
      case 'relative':
        return this.formatRelative(date);
      case 'long':
      default:
        return DateFormatPipe.longFormatter.format(date);
    }
  }

  private formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 0) {
      return DateFormatPipe.longFormatter.format(date);
    }

    if (diffSeconds < 60) {
      return 'agora mesmo';
    }

    if (diffMinutes < 60) {
      return diffMinutes === 1 ? 'há 1 minuto' : `há ${diffMinutes} minutos`;
    }

    if (diffHours < 24) {
      return diffHours === 1 ? 'há 1 hora' : `há ${diffHours} horas`;
    }

    if (diffDays < 30) {
      return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
    }

    return DateFormatPipe.longFormatter.format(date);
  }
}
