import { Component } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'app-analysis-not-found',
  imports: [TranslocoPipe],
  templateUrl: './analysis-not-found.component.html',
  styleUrl: './analysis-not-found.component.scss',
})
export class AnalysisNotFoundComponent {}
