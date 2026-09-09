import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-data-section',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-section.component.html',
  styleUrl: './data-section.component.scss',
})
export class DataSectionComponent {}
