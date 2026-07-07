import { Component } from '@angular/core';
import { AnalysisTargetForm } from '../ui/analysis-target-form/analysis-target-form.component';
import { AnalysisProgressSpinner } from '../ui/analysis-progress-spinner/analysis-progress-spinner';

@Component({
  selector: 'app-analysis-run-page.component',
  imports: [AnalysisTargetForm, AnalysisProgressSpinner],
  templateUrl: './analysis-run-page.component.html',
  styleUrl: './analysis-run-page.component.scss',
})
export class AnalysisRunPage {}
