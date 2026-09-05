import { Pipe, PipeTransform, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { formatNumber } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';

@Pipe({
  name: 'localizedNumber',
  pure: false,
})
export class LocalizedNumberPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  transform(value: number | null | undefined, digitsInfo = '1.0-2'): string {
    const lang = this.activeLang();

    if (value === null || value === undefined) return '';

    return formatNumber(value, lang, digitsInfo);
  }
}
