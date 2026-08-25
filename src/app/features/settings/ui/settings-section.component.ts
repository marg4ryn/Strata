import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'app-settings-section',
  imports: [TranslocoPipe],
  templateUrl: './settings-section.component.html',
  styleUrl: './settings-section.component.scss',
})
export class SettingsSectionComponent {
  headerKey = input.required<string>();
}
