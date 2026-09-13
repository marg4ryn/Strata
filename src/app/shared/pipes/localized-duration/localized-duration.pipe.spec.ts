import { TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LocalizedDurationPipe } from './localized-duration.pipe';

describe('LocalizedDurationPipe', () => {
  let pipe: LocalizedDurationPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      providers: [LocalizedDurationPipe],
    });

    pipe = TestBed.inject(LocalizedDurationPipe);
  });

  it('returns empty string for null/undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns "0s" for zero (not treated as falsy)', () => {
    expect(pipe.transform(0)).toBe('0s');
  });

  it('formats seconds only when under 60', () => {
    expect(pipe.transform(45)).toBe('45s');
  });

  it('formats seconds only when under a minute', () => {
    expect(pipe.transform(1)).toBe('1s');
  });

  it('formats minutes and seconds when under an hour', () => {
    expect(pipe.transform(125)).toBe('2m 5s');
  });

  it('formats minutes only when seconds remainder is 0', () => {
    expect(pipe.transform(120)).toBe('2m 0s');
  });

  it('formats seconds only when exactly 60', () => {
    expect(pipe.transform(60)).toBe('1m 0s');
  });

  it('formats hours and minutes when over an hour', () => {
    expect(pipe.transform(3725)).toBe('1h 2m');
  });

  it('formats hours only when minutes remainder is 0', () => {
    expect(pipe.transform(3600)).toBe('1h');
  });

  it('ignores seconds remainder when hours are present', () => {
    expect(pipe.transform(3605)).toBe('1h');
  });

  it('does not wrap around at 24 hours', () => {
    expect(pipe.transform(86400 + 3725)).toBe('25h 2m');
  });
});
