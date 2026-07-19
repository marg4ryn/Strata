import { TestBed } from '@angular/core/testing';

import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { url, afterDate, beforeDate } from './validators';

describe('url validator', () => {
  function setup(initial: string) {
    return TestBed.runInInjectionContext(() => {
      const model = signal({ targetURL: initial });
      return form(model, (schemaPath) => {
        url(schemaPath.targetURL, 'Enter a valid URL');
      });
    });
  }

  it('returns no error for an empty value', () => {
    const f = setup('');
    expect(f.targetURL().errors()).toEqual([]);
  });

  it('returns no error for a valid URL', () => {
    const f = setup('https://example.com');
    expect(f.targetURL().errors()).toEqual([]);
  });

  it('returns an error for an invalid URL', () => {
    const f = setup('invalid-url');
    const errors = f.targetURL().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ kind: 'url', message: 'Enter a valid URL' });
  });
});

describe('afterDate validator', () => {
  const min = new Date('2024-01-01');

  function setup(initial: Date | null) {
    return TestBed.runInInjectionContext(() => {
      const model = signal({ date: initial });
      return form(model, (schemaPath) => {
        afterDate(schemaPath.date, min, 'Date too early');
      });
    });
  }

  it('returns no error when the field is empty', () => {
    const f = setup(null);
    expect(f.date().errors()).toEqual([]);
  });

  it('returns an error when the date is earlier than the minimum', () => {
    const f = setup(new Date('2023-12-31'));
    const errors = f.date().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ kind: 'date', message: 'Date too early' });
  });

  it('returns no error when the date is equal to the minimum', () => {
    const f = setup(new Date('2024-01-01'));
    expect(f.date().errors()).toEqual([]);
  });

  it('returns no error when the date is later than the minimum', () => {
    const f = setup(new Date('2024-06-01'));
    expect(f.date().errors()).toEqual([]);
  });

  it('compares against another form field provided as a SchemaPath', () => {
    const f = TestBed.runInInjectionContext(() => {
      const model = signal({ startDate: new Date('2024-05-10'), endDate: new Date('2024-05-01') });
      return form(model, (schemaPath) => {
        afterDate(schemaPath.endDate, schemaPath.startDate, 'End date must be after start date');
      });
    });

    const errors = f.endDate().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ kind: 'date', message: 'End date must be after start date' });
  });
});

describe('beforeDate validator', () => {
  function setup(initial: Date | null, max: Date | (() => Date)) {
    return TestBed.runInInjectionContext(() => {
      const model = signal({ date: initial });
      return form(model, (schemaPath) => {
        beforeDate(schemaPath.date, max, 'Date too late');
      });
    });
  }

  it('returns no error when the field is empty', () => {
    const f = setup(null, new Date('2024-01-01'));
    expect(f.date().errors()).toEqual([]);
  });

  it('returns an error when the date is later than the maximum (Date)', () => {
    const f = setup(new Date('2024-01-02'), new Date('2024-01-01'));
    const errors = f.date().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ kind: 'date', message: 'Date too late' });
  });

  it('returns no error when the date is equal to the maximum', () => {
    const f = setup(new Date('2024-01-01'), new Date('2024-01-01'));
    expect(f.date().errors()).toEqual([]);
  });

  it('returns an error when the date is later than the maximum (function)', () => {
    const maxFn = () => new Date('2024-01-01');
    const f = setup(new Date('2024-01-05'), maxFn);
    const errors = f.date().errors();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ kind: 'date', message: 'Date too late' });
  });

  it('compares against another form field provided as a SchemaPath', () => {
    const f = TestBed.runInInjectionContext(() => {
      const model = signal({ startDate: new Date('2024-05-01'), endDate: new Date('2024-05-10') });
      return form(model, (schemaPath) => {
        beforeDate(schemaPath.startDate, schemaPath.endDate, 'Start date must be before end date');
      });
    });

    expect(f.startDate().errors()).toEqual([]);
  });
});
