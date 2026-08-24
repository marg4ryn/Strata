import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CdkListbox } from '@angular/cdk/listbox';

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
      imports: [LanguageSwitcherComponent],
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

  it('displays current language label', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.textContent).toContain('English');
  });

  it('falls back to empty label for unknown preference', () => {
    facade.langPreference.set('xx' as LangPreference);
    fixture.detectChanges();

    expect(component.currentLabel).toBe('');
  });

  it('toggles visibility on click', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    expect(document.querySelector('.lang-switcher__panel')).toBeTruthy();
  });

  it('sets aria-expanded according to open state', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');

    component.toggle();
    fixture.detectChanges();

    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('emits openedChange on toggle', () => {
    const emitted: boolean[] = [];
    component.openedChange.subscribe((v) => emitted.push(v));

    component.toggle();
    fixture.detectChanges();
    component.toggle();
    fixture.detectChanges();

    expect(emitted).toEqual([true, false]);
  });

  it('focuses listbox when overlay is attached', async () => {
    const focusSpy = vi.spyOn(CdkListbox.prototype, 'focus');

    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(focusSpy).toHaveBeenCalled();
  });

  it('selects option and triggers facade when preference changes', () => {
    component.toggle();
    fixture.detectChanges();

    const options = document.querySelectorAll('.lang-switcher__option');
    (options[0] as HTMLElement).click();
    fixture.detectChanges();
    vi.advanceTimersByTime(0);

    expect(facade.setPreference).toHaveBeenCalled();
    expect(component.isOpen()).toBe(false);
  });

  it('does not call facade when selecting the current preference', () => {
    component.select(['en']);
    fixture.detectChanges();
    vi.advanceTimersByTime(0);

    expect(facade.setPreference).not.toHaveBeenCalled();
    expect(component.isOpen()).toBe(false);
  });

  it('does not call facade when selection is empty', () => {
    component.select([]);
    fixture.detectChanges();
    vi.advanceTimersByTime(0);

    expect(facade.setPreference).not.toHaveBeenCalled();
    expect(component.isOpen()).toBe(false);
  });

  it('closes panel on Enter keydown in listbox', () => {
    component.toggle();
    fixture.detectChanges();

    const listboxEl = document.querySelector('.lang-switcher__panel') as HTMLElement;
    listboxEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    vi.advanceTimersByTime(0);

    expect(component.isOpen()).toBe(false);
  });

  it('closes panel on Space keydown in listbox', () => {
    component.toggle();
    fixture.detectChanges();

    const listboxEl = document.querySelector('.lang-switcher__panel') as HTMLElement;
    listboxEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    vi.advanceTimersByTime(0);

    expect(component.isOpen()).toBe(false);
  });

  it('closes on backdrop click', () => {
    component.toggle();
    fixture.detectChanges();

    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('closes on overlay detach', () => {
    component.toggle();
    fixture.detectChanges();

    component.isOpen.set(false);
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('restores focus to trigger button after closing', () => {
    const btn = fixture.nativeElement.querySelector('button');
    component.toggle();
    fixture.detectChanges();

    component.close();
    fixture.detectChanges();
    vi.advanceTimersByTime(0);

    expect(document.activeElement).toBe(btn);
  });
});
