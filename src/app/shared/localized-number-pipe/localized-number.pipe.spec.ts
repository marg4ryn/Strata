import { TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LocalizedNumberPipe } from './localized-number.pipe';

describe('LocalizedNumberPipe', () => {
  let pipe: LocalizedNumberPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      providers: [LocalizedNumberPipe],
    });

    pipe = TestBed.inject(LocalizedNumberPipe);
  });

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string for null/undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns "0" for zero (not treated as falsy)', () => {
    expect(pipe.transform(0)).toBe('0');
  });

  it('formats an integer with default digitsInfo', () => {
    expect(pipe.transform(1234)).toBe('1,234');
  });

  it('rounds to max 2 decimal places by default', () => {
    expect(pipe.transform(1234.5678)).toBe('1,234.57');
  });

  it('does not add trailing zeros beyond minimum digits by default', () => {
    expect(pipe.transform(1234.5)).toBe('1,234.5');
  });

  it('formats negative numbers', () => {
    expect(pipe.transform(-42.5)).toBe('-42.5');
  });

  it('applies custom digitsInfo', () => {
    expect(pipe.transform(1234.5, '1.2-2')).toBe('1,234.50');
  });

  it('applies digitsInfo with no decimal places', () => {
    expect(pipe.transform(1234.9, '1.0-0')).toBe('1,235');
  });
});
