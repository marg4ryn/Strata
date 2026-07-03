import { Component, signal } from '@angular/core';
import { form, FormField, FormRoot, hidden, required } from '@angular/forms/signals';

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
      required(schemaPath.URL, { message: 'URL is required' });
      required(schemaPath.startDate, {
        message: 'Start date is required when Limit date range selected',
        when: ({ valueOf }) => valueOf(schemaPath.limitRange),
      });
      required(schemaPath.endDate, {
        message: 'End date is required when Limit date range selected',
        when: ({ valueOf }) => valueOf(schemaPath.limitRange),
      });

      hidden(schemaPath.startDate, { when: ({ valueOf }) => !valueOf(schemaPath.limitRange) });
      hidden(schemaPath.endDate, { when: ({ valueOf }) => !valueOf(schemaPath.limitRange) });
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
