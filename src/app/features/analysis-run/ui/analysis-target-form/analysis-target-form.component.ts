import { Component, signal, output } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  hidden,
  required,
  maxLength,
  debounce,
  ValidationError,
} from '@angular/forms/signals';
import { DatePipe } from '@angular/common';

import { localNowAsUtcMidnight } from '@app/shared/date-utils/date.utils';
import { ButtonDirective } from '@app/shared/button-directive/button.directive';
import { url, afterDate, beforeDate } from '../../utils/validators';
import { AnalysisTargetFormModel } from '../../analysis-run.model';

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

      url(schemaPath.targetURL, 'Enter a valid URL');
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

  errorMessage(error: ValidationError): string | null {
    return error.message ?? 'Enter a valid date';
  }
}
