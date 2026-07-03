import { Component, signal } from '@angular/core';
import { form, FormField, hidden, required } from '@angular/forms/signals';

interface AnalysisTarget {
  URL: string;
  limitRange: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-start-analysis-page',
  imports: [FormField],
  templateUrl: './start-analysis-page.html',
  styleUrl: './start-analysis-page.scss',
})
export class StartAnalysisPage {
  initialAnalysisTarget = (): AnalysisTarget => ({
    URL: '',
    limitRange: false,
    startDate: null,
    endDate: null,
  });

  analysisTargetModel = signal<AnalysisTarget>(this.initialAnalysisTarget());

  analysisTargetForm = form(this.analysisTargetModel, (schemaPath) => {
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
  });

  onSubmit(event: Event) {
    event.preventDefault();
    this.analysisTargetForm().markAsTouched();
    if (this.analysisTargetForm().invalid()) return;
    const formData = this.analysisTargetModel();
    console.log(formData);
    this.resetForm();
  }

  resetForm() {
    this.analysisTargetModel.set(this.initialAnalysisTarget());
    this.analysisTargetForm().reset();
  }
}
