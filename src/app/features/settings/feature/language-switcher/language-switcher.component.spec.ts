import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

import { DropdownComponent } from '@app/shared/components/dropdown/dropdown.component';
import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { LanguageFacade } from '@app/core/language/language.facade';
import { LangPreference } from '@app/core/language/language.model';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let fixture: ComponentFixture<LanguageSwitcherComponent>;

  let facade: {
    langPreference: ReturnType<typeof signal<LangPreference>>;
    setPreference: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    facade = {
      langPreference: signal('en'),
      setPreference: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent, DropdownComponent, getTranslocoModule()],
      providers: [{ provide: LanguageFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const getButton = () => fixture.nativeElement.querySelector('button');

  it('displays current language label', () => {
    expect(getButton().textContent).toContain('English');
  });

  it('falls back to the first option for unknown preference', () => {
    facade.langPreference.set('xx' as LangPreference);
    fixture.detectChanges();

    expect(component.currentOption).toBe(fixture.componentInstance.options[0]);
  });

  it('translates labelKey for "system"', () => {
    facade.langPreference.set('system');
    fixture.detectChanges();

    expect(getButton().textContent).toContain('System');
  });

  it('opens dropdown and emits openedChange(true) when trigger clicked', () => {
    const emitted: boolean[] = [];
    component.openedChange.subscribe((value) => emitted.push(value));

    getButton().click();
    fixture.detectChanges();

    expect(component.isOpen()).toBeTruthy();
    expect(emitted).toEqual([true]);
  });

  it('does not call setPreference when selecting the current language', () => {
    const closeSpy = vi.spyOn(component, 'close');

    component.select('en');

    expect(facade.setPreference).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('calls setPreference and closes when selecting a different language', () => {
    const closeSpy = vi.spyOn(component, 'close');

    component.select('pl' as LangPreference);

    expect(facade.setPreference).toHaveBeenCalledExactlyOnceWith('pl');
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('emits selectionChange from dropdown and calls select() through the binding', () => {
    const selectSpy = vi.spyOn(component, 'select');
    const dropdown = fixture.debugElement.query(By.directive(DropdownComponent))
      .componentInstance as DropdownComponent<LangPreference>;

    dropdown.selectionChange.emit('pl' as LangPreference);
    fixture.detectChanges();

    expect(selectSpy).toHaveBeenCalledExactlyOnceWith('pl');
    expect(facade.setPreference).toHaveBeenCalledExactlyOnceWith('pl');
  });
});
