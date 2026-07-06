import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { LoggerService } from '../../core/logging/logger.service';

interface AnalysisTarget {
  URL: string;
  limitRange: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-start-analysis',
  imports: [FormField, FormRoot],
  templateUrl: './start-analysis.component.html',
  styleUrl: './start-analysis.component.scss',
})
export class StartAnalysis {
  private readonly datePipe = new DatePipe('en-US');
  private readonly MIN_DATE = new Date('1970-01-01');

  private readonly INITIAL_MODEL = (): AnalysisTarget => ({
    URL: '',
    limitRange: false,
    startDate: null,
    endDate: null,
  });

  private logger = inject(LoggerService);

  analysisTargetModel = signal<AnalysisTarget>(this.INITIAL_MODEL());

  analysisTargetForm = form(
    this.analysisTargetModel,
    (schemaPath) => {
      debounce(schemaPath.URL, 300);

      required(schemaPath.URL, {
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

      url(schemaPath.URL);
      maxLength(schemaPath.URL, 500);

      afterDate(schemaPath.startDate, this.MIN_DATE, {
        message: `Start date cannot be earlier than ${this.datePipe.transform(this.MIN_DATE, 'longDate')}`,
      });
      afterDate(schemaPath.endDate, this.MIN_DATE, {
        message: `End date cannot be earlier than ${this.datePipe.transform(this.MIN_DATE, 'longDate')}`,
      });
      afterDate(schemaPath.endDate, schemaPath.startDate, {
        message: 'End date must be after start date',
      });
      beforeDate(schemaPath.startDate, new Date(), {
        message: 'Start date cannot be in the future',
      });
      beforeDate(schemaPath.endDate, new Date(), {
        message: 'End date cannot be in the future',
      });
    },
    {
      submission: {
        action: async (field) => {
          const formData = field().value();
          this.logger.info(formData);
          field().reset(this.INITIAL_MODEL());
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
  options: { message: string },
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const minDate = min instanceof Date ? min : valueOf(min);

    if (date && minDate && date < minDate) {
      return {
        kind: 'date',
        message: options.message,
      };
    }
    return null;
  });
}

function beforeDate(
  path: SchemaPath<Date | null>,
  max: Date | SchemaPath<Date | null>,
  options: { message: string },
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const maxDate = max instanceof Date ? max : valueOf(max);

    if (date && maxDate && date > maxDate) {
      return {
        kind: 'date',
        message: options.message,
      };
    }
    return null;
  });
}
