import { Component, input } from '@angular/core';

@Component({
  selector: 'app-settings-section',
  imports: [],
  templateUrl: './settings-section.component.html',
  styleUrl: './settings-section.component.scss',
})
export class SettingsSectionComponent {
  label = input.required<string>();
}
