import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, input } from '@angular/core';

import { SettingsPanel } from './settings-panel.component';
import { SettingsFacade } from '../../settings.facade';
import { SettingsSectionComponent } from '../../ui/settings-section.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-settings-section',
  template: '<ng-content />',
})
class SettingsSectionStub {
  label = input<string>('');
}

@Component({
  selector: 'app-language-switcher',
  template: '',
})
class LanguageSwitcherStub {}

describe('SettingsPanel', () => {
  let component: SettingsPanel;
  let fixture: ComponentFixture<SettingsPanel>;

  let facade: {
    showPanel: ReturnType<typeof signal<boolean>>;
    closePanel: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    facade = {
      showPanel: signal(false),
      closePanel: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsPanel],
      providers: [
        {
          provide: SettingsFacade,
          useValue: facade,
        },
      ],
    })
      .overrideComponent(SettingsPanel, {
        remove: {
          imports: [SettingsSectionComponent, LanguageSwitcherComponent],
        },
        add: {
          imports: [SettingsSectionStub, LanguageSwitcherStub],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('has cdkTrapFocus applied to container', () => {
    const settingsContainer = fixture.nativeElement.querySelector('.settings-panel');
    expect(settingsContainer.getAttribute('cdktrapfocus')).not.toBeNull();
  });

  it('calls closePanel when close button is clicked', () => {
    const closeBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('.settings-panel__close');
    closeBtn.click();

    expect(facade.closePanel).toHaveBeenCalledOnce();
  });
});
