import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';

import { LanguageFacade } from '@app/core/language/language.facade';
import { LangPreference } from '@app/core/language/language.model';
import { SettingsPanelComponent } from './settings-panel.component';
import { SettingsFacade } from '../../settings.facade';

describe('SettingsPanelComponent', () => {
  let component: SettingsPanelComponent;
  let fixture: ComponentFixture<SettingsPanelComponent>;

  let settingsFacade: {
    showPanel: ReturnType<typeof signal<boolean>>;
    closePanel: ReturnType<typeof vi.fn>;
  };

  let languageFacade: {
    langPreference: ReturnType<typeof signal<LangPreference>>;
    setPreference: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    settingsFacade = {
      showPanel: signal(false),
      closePanel: vi.fn(),
    };

    languageFacade = {
      langPreference: signal('en'),
      setPreference: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsPanelComponent],
      providers: [
        { provide: SettingsFacade, useValue: settingsFacade },
        { provide: LanguageFacade, useValue: languageFacade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPanelComponent);
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

    expect(settingsFacade.closePanel).toHaveBeenCalledOnce();
  });

  it('renders the panel title', () => {
    const title = fixture.nativeElement.querySelector('.settings-panel__title');
    expect(title.textContent).toContain('Settings');
  });

  it('renders language switcher inside a section labeled "Language"', () => {
    const sectionEl = fixture.nativeElement.querySelector('app-settings-section');
    expect(sectionEl.getAttribute('label')).toBe('Language');
    expect(sectionEl.querySelector('app-language-switcher')).toBeTruthy();
  });

  it('sets innerOverlayOpen to true when real language switcher opens', () => {
    const trigger: HTMLButtonElement =
      fixture.nativeElement.querySelector('.lang-switcher__trigger');
    trigger.click();
    fixture.detectChanges();

    expect(component.innerOverlayOpen()).toBe(true);
  });

  it('disables cdkTrapFocus while inner overlay is open', () => {
    const trapFocusDebugEl = fixture.debugElement.query((el) =>
      el.nativeElement.classList.contains('settings-panel'),
    );
    const trapFocusDirective = trapFocusDebugEl.injector.get(CdkTrapFocus);

    const trigger: HTMLButtonElement =
      fixture.nativeElement.querySelector('.lang-switcher__trigger');
    trigger.click();
    fixture.detectChanges();

    expect(trapFocusDirective.enabled).toBe(false);
  });
});
