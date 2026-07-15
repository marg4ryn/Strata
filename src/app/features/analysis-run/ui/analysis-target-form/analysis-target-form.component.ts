import { Component, signal, output } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  hidden,
  required,
  validate,
  maxLength,
  SchemaPath,
  debounce,
} from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { AnalysisTargetFormModel } from '../../data-access/analysis-run.model';

@Component({
  selector: 'app-analysis-target-form',
  imports: [FormField, FormRoot, ButtonDirective],
  templateUrl: './analysis-target-form.component.html',
  styleUrl: './analysis-target-form.component.scss',
})
export class AnalysisTargetForm {
  private readonly datePipe = new DatePipe('en-US');
  private readonly minDate = new Date('1970-01-01');

  private readonly initialModel = (): AnalysisTargetFormModel => ({
    targetURL: '',
    limitRange: false,
    startDate: null,
    endDate: null,
  });

  readonly analysisTargetData = output<AnalysisTargetFormModel>();

  readonly analysisTargetModel = signal<AnalysisTargetFormModel>(this.initialModel());

  readonly analysisTargetForm = form(
    this.analysisTargetModel,
    (schemaPath) => {
      debounce(schemaPath.targetURL, 300);

      required(schemaPath.targetURL, {
        message: 'URL is required',
      });
      required(schemaPath.startDate, {
        message: 'Start date is required',
        when: ({ valueOf }) => valueOf(schemaPath.limitRange),
      });
      required(schemaPath.endDate, {
        message: 'End date is required',
        when: ({ valueOf }) => valueOf(schemaPath.limitRange),
      });

      hidden(schemaPath.startDate, {
        when: ({ valueOf }) => !valueOf(schemaPath.limitRange),
      });
      hidden(schemaPath.endDate, {
        when: ({ valueOf }) => !valueOf(schemaPath.limitRange),
      });

      url(schemaPath.targetURL);
      maxLength(schemaPath.targetURL, 500);

      afterDate(
        schemaPath.startDate,
        this.minDate,
        `Start date cannot be earlier than ${this.datePipe.transform(this.minDate, 'longDate')}`,
      );
      afterDate(
        schemaPath.endDate,
        this.minDate,
        `End date cannot be earlier than ${this.datePipe.transform(this.minDate, 'longDate')}`,
      );
      afterDate(schemaPath.endDate, schemaPath.startDate, 'End date must be after start date');
      beforeDate(schemaPath.startDate, localNowAsUtcMidnight, 'Start date cannot be in the future');
      beforeDate(schemaPath.endDate, localNowAsUtcMidnight, 'End date cannot be in the future');
    },
    {
      submission: {
        action: async (field) => {
          const formData = field().value();
          this.analysisTargetData.emit(formData);
          field().reset(this.initialModel());
        },
        onInvalid: (field) => {
          const firstError = field().errorSummary()[0];
          firstError?.fieldTree().focusBoundControl();
        },
      },
    },
  );

  isInvalid(field: () => any): boolean {
    return field().touched() && field().invalid();
  }
}

function url(path: SchemaPath<string>, options?: { message?: string }) {
  validate(path, ({ value }) => {
    if (!value()) return null;
    try {
      new URL(value());
      return null;
    } catch {
      return {
        kind: 'url',
        message: options?.message ?? 'Enter a valid URL',
      };
    }
  });
}

function afterDate(
  path: SchemaPath<Date | null>,
  min: Date | SchemaPath<Date | null>,
  message: string,
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const minDate = min instanceof Date ? min : valueOf(min);
    if (!date || !minDate) return null;

    if (toCalendarKey(date) < toCalendarKey(minDate)) {
      return { kind: 'date', message };
    }
    return null;
  });
}

function beforeDate(
  path: SchemaPath<Date | null>,
  max: Date | (() => Date) | SchemaPath<Date | null>,
  message: string,
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const maxDate = max instanceof Date ? max : typeof max === 'function' ? max() : valueOf(max);
    if (!date || !maxDate) return null;

    if (toCalendarKey(date) > toCalendarKey(maxDate)) {
      return { kind: 'date', message };
    }
    return null;
  });
}

function toCalendarKey(date: Date): number {
  return date.getUTCFullYear() * 10000 + date.getUTCMonth() * 100 + date.getUTCDate();
}

function localNowAsUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
