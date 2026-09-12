import { TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LocalizedDatePipe } from './localized-date.pipe';

describe('LocalizedDatePipe', () => {
  let pipe: LocalizedDatePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      providers: [LocalizedDatePipe],
    });

    pipe = TestBed.inject(LocalizedDatePipe);
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('formats a Date object', () => {
    const result = pipe.transform(new Date(2024, 0, 15));
    expect(result).toBe(new Date(2024, 0, 15).toLocaleString('en', { dateStyle: 'medium' }));
  });

  it('formats an ISO date-only string without timezone shift', () => {
    const result = pipe.transform('2024-01-15');
    expect(result).toBe(new Date(2024, 0, 15).toLocaleString('en', { dateStyle: 'medium' }));
  });

  it('formats an ISO datetime string', () => {
    const result = pipe.transform('2024-01-15T10:30:00');
    expect(result).toBe(
      new Date('2024-01-15T10:30:00').toLocaleString('en', { dateStyle: 'medium' }),
    );
  });

  it('formats a numeric timestamp', () => {
    const timestamp = new Date(2024, 0, 15).getTime();
    const result = pipe.transform(timestamp);
    expect(result).toBe(new Date(timestamp).toLocaleString('en', { dateStyle: 'medium' }));
  });

  it('applies custom options', () => {
    const result = pipe.transform('2024-01-15', { dateStyle: 'short' });
    expect(result).toBe(new Date(2024, 0, 15).toLocaleString('en', { dateStyle: 'short' }));
  });
});
