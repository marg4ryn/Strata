import { Component, inject, signal, output } from '@angular/core';
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
import { AnalysisTarget } from '../../data-access/analysis-run.model';

@Component({
  selector: 'app-analysis-target-form',
  imports: [FormField, FormRoot],
  templateUrl: './analysis-target-form.component.html',
  styleUrl: './analysis-target-form.component.scss',
})
export class AnalysisTargetForm {
  private readonly datePipe = new DatePipe('en-US');
  private readonly MIN_DATE = new Date('1970-01-01');

  private readonly INITIAL_MODEL = (): AnalysisTarget => ({
    targetURL: '',
    limitRange: false,
    startDate: null,
    endDate: null,
  });

  analysisTargetData = output<AnalysisTarget>();

  analysisTargetModel = signal<AnalysisTarget>(this.INITIAL_MODEL());

  analysisTargetForm = form(
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
        this.MIN_DATE,
        `Start date cannot be earlier than ${this.datePipe.transform(this.MIN_DATE, 'longDate')}`,
      );
      afterDate(
        schemaPath.endDate,
        this.MIN_DATE,
        `End date cannot be earlier than ${this.datePipe.transform(this.MIN_DATE, 'longDate')}`,
      );
      afterDate(schemaPath.endDate, schemaPath.startDate, 'End date must be after start date');
      beforeDate(schemaPath.startDate, new Date(), 'Start date cannot be in the future');
      beforeDate(schemaPath.endDate, new Date(), 'End date cannot be in the future');
    },
    {
      submission: {
        action: async (field) => {
          const formData = field().value();
          this.analysisTargetData.emit(formData);
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
  message: string,
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const minDate = min instanceof Date ? min : valueOf(min);

    if (date && minDate && date < minDate) {
      return {
        kind: 'date',
        message: message,
      };
    }
    return null;
  });
}

function beforeDate(
  path: SchemaPath<Date | null>,
  max: Date | SchemaPath<Date | null>,
  message: string,
) {
  validate(path, ({ value, valueOf }) => {
    const date = value();
    const maxDate = max instanceof Date ? max : valueOf(max);

    if (date && maxDate && date > maxDate) {
      return {
        kind: 'date',
        message: message,
      };
    }
    return null;
  });
}
