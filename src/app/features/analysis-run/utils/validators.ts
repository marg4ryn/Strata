import { validate, SchemaPath } from '@angular/forms/signals';
import { dateToCalendarKey } from '@app/shared/date-utils/date.utils';

export function url(path: SchemaPath<string>, message: string) {
  validate(path, ({ value }) => {
    if (!value()) return null;
    try {
      const parsed = new URL(value());
      if (!parsed.pathname.endsWith('.git')) {
        return { kind: 'url', message };
      }
      return null;
    } catch {
      return { kind: 'url', message };
    }
  });
}

export function afterDate(
  path: SchemaPath<Date | null>,
  min: Date | SchemaPath<Date | null>,
  message: string,
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const minDate = min instanceof Date ? min : valueOf(min);
    if (!date || !minDate) return null;

    if (dateToCalendarKey(date) < dateToCalendarKey(minDate)) {
      return { kind: 'date', message };
    }
    return null;
  });
}

export function beforeDate(
  path: SchemaPath<Date | null>,
  max: Date | (() => Date) | SchemaPath<Date | null>,
  message: string,
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const maxDate = max instanceof Date ? max : typeof max === 'function' ? max() : valueOf(max);
    if (!date || !maxDate) return null;

    if (dateToCalendarKey(date) > dateToCalendarKey(maxDate)) {
      return { kind: 'date', message };
    }
    return null;
  });
}
