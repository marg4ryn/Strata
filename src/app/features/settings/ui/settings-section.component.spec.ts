import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco';
import { SettingsSectionComponent } from './settings-section.component';

describe('SettingsSectionComponent', () => {
  let fixture: ComponentFixture<SettingsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsSectionComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsSectionComponent);
    fixture.componentRef.setInput('headerKey', 'test');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders translated header text for given key', () => {
    fixture.componentRef.setInput('headerKey', 'settings.panel.header');
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.settings-section__title');
    expect(title.textContent.trim()).toBe('Settings');
  });
});
