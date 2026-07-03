import { Component, signal } from '@angular/core';
import { form, FormField, hidden, required, schema } from '@angular/forms/signals';

interface AnalysisTarget {
  URL: string;
  limitRange: boolean;
  range: {
    startDate: Date | null;
    endDate: Date | null;
  };
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
    range: {
      startDate: null,
      endDate: null,
    },
  });

  analysisTargetModel = signal<AnalysisTarget>(this.initialAnalysisTarget());

  analysisTargetSchema = schema<AnalysisTarget>((analysisTarget) => {
    hidden(analysisTarget.range.startDate, ({ valueOf }) => !valueOf(analysisTarget.limitRange));
    hidden(analysisTarget.range.endDate, ({ valueOf }) => !valueOf(analysisTarget.limitRange));
  });

  analysisTargetForm = form(this.analysisTargetModel, (schemaPath) => {
    required(schemaPath.URL);
    required(schemaPath.range.startDate, {
      when: ({ valueOf }) => valueOf(schemaPath.limitRange),
    });
    required(schemaPath.range.endDate, {
      when: ({ valueOf }) => valueOf(schemaPath.limitRange),
    });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    const formData = this.analysisTargetModel();
    if (!this.analysisTargetForm().valid()) return;
    console.log(formData);
    this.resetForm();
  }

  resetForm() {
    this.analysisTargetModel.set(this.initialAnalysisTarget());
    this.analysisTargetForm().reset();
  }
}
