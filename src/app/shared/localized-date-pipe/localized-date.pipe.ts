import { Pipe, PipeTransform, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@ngneat/transloco';

import type { ISODateString, ISOLocalDateTime } from '../date-utils/date.utils';

@Pipe({
  name: 'localizedDate',
  pure: false,
})
export class LocalizedDatePipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  transform(
    date: Date | ISODateString | ISOLocalDateTime | number | null | undefined,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    const lang = this.activeLang();

    if (date === null || date === undefined || date === '') return '';

    const parsed = this.parseDate(date);

    return parsed.toLocaleString(lang, {
      dateStyle: 'medium',
      ...options,
    });
  }

  private parseDate(date: Date | string | number): Date {
    if (date instanceof Date) return date;

    if (typeof date === 'number') {
      return new Date(date);
    }

    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.exec(date);
    if (dateOnlyMatch) {
      const [y, m, d] = date.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    return new Date(date);
  }
}
