import { Component, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  hidden,
  required,
  validate,
  SchemaPath,
} from '@angular/forms/signals';

interface AnalysisTarget {
  URL: string;
  limitRange: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-start-analysis-page',
  imports: [FormField, FormRoot],
  templateUrl: './start-analysis-page.html',
  styleUrl: './start-analysis-page.scss',
})
export class StartAnalysisPage {
  private readonly INITIAL_MODEL = (): AnalysisTarget => ({
    URL: '',
    limitRange: false,
    startDate: null,
    endDate: null,
  });

  analysisTargetModel = signal<AnalysisTarget>(this.INITIAL_MODEL());

  analysisTargetForm = form(
    this.analysisTargetModel,
    (schemaPath) => {
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

      afterDate(schemaPath.startDate, new Date('1970-01-01'), {
        fieldName: 'Start date',
      });
      afterDate(schemaPath.endDate, new Date('1970-01-01'), {
        fieldName: 'End date',
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
          console.log(formData);
          field().reset(this.INITIAL_MODEL());
        },
        onInvalid: (field) => {
          const firstError = field().errorSummary()[0];
          firstError?.fieldTree().focusBoundControl();
        },
      },
    },
  );
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
  options?: { message?: string; fieldName?: string },
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const minDate = min instanceof Date ? min : valueOf(min);

    if (date && minDate && date < minDate) {
      return {
        kind: 'date',
        message:
          options?.message ??
          `${options?.fieldName ?? 'Date'} cannot be earlier than ${minDate.toLocaleDateString(
            'en-US',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            },
          )}`,
      };
    }
    return null;
  });
}

function beforeDate(
  path: SchemaPath<Date | null>,
  max: Date | SchemaPath<Date | null>,
  options?: { message?: string; fieldName?: string },
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const maxDate = max instanceof Date ? max : valueOf(max);

    if (date && maxDate && date > maxDate) {
      return {
        kind: 'date',
        message:
          options?.message ??
          `${options?.fieldName ?? 'Date'} cannot be after ${maxDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
      };
    }
    return null;
  });
}
