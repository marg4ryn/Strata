import { ChangeDetectionStrategy, Component, signal, output, inject } from '@angular/core';
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
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { localNowAsUtcMidnight } from '@app/shared/utils/date.utils';
import { ButtonDirective } from '@app/shared/directives/button.directive';
import { url, afterDate, beforeDate, ParamValidationError } from '../../utils/validators';
import { AnalysisTargetFormModel } from '../../analysis-run.model';

@Component({
  selector: 'app-analysis-target-form',
  imports: [FormField, FormRoot, ButtonDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analysis-target-form.component.html',
  styleUrl: './analysis-target-form.component.scss',
})
export class AnalysisTargetFormComponent {
  private readonly transloco = inject(TranslocoService);

  readonly analysisTargetData = output<AnalysisTargetFormModel>();

  private readonly minDate = new Date('1970-01-01');

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  private readonly initialModel = (): AnalysisTargetFormModel => ({
    targetURL: '',
    limitRange: false,
    startDate: null,
    endDate: null,
  });

  readonly analysisTargetModel = signal<AnalysisTargetFormModel>(this.initialModel());

  readonly analysisTargetForm = form(
    this.analysisTargetModel,
    (schemaPath) => {
      debounce(schemaPath.targetURL, 300);

      required(schemaPath.targetURL, {
        message: marker('analysisRun.form.urlRequired'),
      });
      required(schemaPath.startDate, {
        message: marker('analysisRun.form.startDateRequired'),
        when: ({ valueOf }) => valueOf(schemaPath.limitRange),
      });
      required(schemaPath.endDate, {
        message: marker('analysisRun.form.endDateRequired'),
        when: ({ valueOf }) => valueOf(schemaPath.limitRange),
      });

      hidden(schemaPath.startDate, {
        when: ({ valueOf }) => !valueOf(schemaPath.limitRange),
      });
      hidden(schemaPath.endDate, {
        when: ({ valueOf }) => !valueOf(schemaPath.limitRange),
      });

      url(schemaPath.targetURL, marker('analysisRun.form.urlInvalid'));
      maxLength(schemaPath.targetURL, 500);

      afterDate(schemaPath.startDate, this.minDate, marker('analysisRun.form.dateTooEarly'), {
        date: this.minDate.toISOString(),
      });
      afterDate(schemaPath.endDate, this.minDate, marker('analysisRun.form.dateTooEarly'), {
        date: this.minDate.toISOString(),
      });
      afterDate(
        schemaPath.endDate,
        schemaPath.startDate,
        marker('analysisRun.form.endBeforeStart'),
      );
      beforeDate(
        schemaPath.startDate,
        localNowAsUtcMidnight,
        marker('analysisRun.form.dateInFuture'),
      );
      beforeDate(
        schemaPath.endDate,
        localNowAsUtcMidnight,
        marker('analysisRun.form.dateInFuture'),
      );
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

  errorParams(error: ValidationError): Record<string, string> | undefined {
    const params = (error as ParamValidationError).params;
    if (!params?.['date']) return params;

    return {
      ...params,
      date: new Date(params['date']).toLocaleDateString(this.activeLang()),
    };
  }

  errorMessage(error: ValidationError): string | null {
    return error.message ?? marker('analysisRun.form.dateInvalid');
  }
}
