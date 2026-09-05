import { Pipe, PipeTransform, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@ngneat/transloco';

@Pipe({
  name: 'localizedDuration',
  pure: false,
})
export class LocalizedDurationPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  transform(seconds: number | null | undefined): string {
    this.activeLang();

    if (!seconds) return '';

    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return minutes > 0
        ? this.transloco.translate('duration.hoursMinutes', { hours, minutes })
        : this.transloco.translate('duration.hoursOnly', { hours });
    }

    return minutes > 0
      ? this.transloco.translate('duration.minutesSeconds', { minutes, seconds: secs })
      : this.transloco.translate('duration.secondsOnly', { seconds: secs });
  }
}
