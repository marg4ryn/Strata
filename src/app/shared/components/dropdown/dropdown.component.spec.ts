import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco';
import type { DropdownOption } from './dropdown.component';
import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent<string>;
  let fixture: ComponentFixture<DropdownComponent<string>>;

  const options: DropdownOption<string>[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'a');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts closed', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('returns matching option for current value', () => {
    expect(component.currentOption).toEqual(options[0]);
  });

  it('falls back to first option when value does not match', () => {
    fixture.componentRef.setInput('value', 'missing');
    fixture.detectChanges();
    expect(component.currentOption).toEqual(options[0]);
  });

  it('opens on toggle when closed', () => {
    component.toggle();
    expect(component.isOpen()).toBe(true);
  });

  it('closes on toggle when open', () => {
    component.toggle();
    component.toggle();
    expect(component.isOpen()).toBe(false);
  });

  it('emits openedChange with true on open', () => {
    const spy = vi.fn();
    component.openedChange.subscribe(spy);
    component.toggle();
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('emits openedChange with false on close', () => {
    const spy = vi.fn();
    component.toggle();
    component.openedChange.subscribe(spy);
    component.close();
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('does nothing when close is called while already closed', () => {
    const spy = vi.fn();
    component.openedChange.subscribe(spy);
    component.close();
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns focus to trigger button after close', async () => {
    vi.useFakeTimers();
    component.toggle();
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger'))
      .nativeElement as HTMLButtonElement;
    const focusSpy = vi.spyOn(trigger, 'focus');

    component.close();
    vi.runAllTimers();

    expect(focusSpy).toHaveBeenCalled();
  });

  it('emits selectionChange with selected values on select', () => {
    const spy = vi.fn();
    component.selectionChange.subscribe(spy);
    component.select(['b']);
    expect(spy).toHaveBeenCalledWith('b');
  });

  it('closes the panel after select', () => {
    component.toggle();
    component.select(['b']);
    expect(component.isOpen()).toBe(false);
  });

  it('closes the panel on backdrop click', async () => {
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('selects option and closes panel when clicking an option in the listbox', async () => {
    const spy = vi.fn();
    component.selectionChange.subscribe(spy);

    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const optionEls = document.querySelectorAll('.dropdown__option');
    (optionEls[1] as HTMLElement).click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('b');
    expect(component.isOpen()).toBe(false);
  });

  it('closes the panel on Enter keydown within the listbox', async () => {
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const listboxEl = document.querySelector('[cdkListbox]') as HTMLElement;
    listboxEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('closes the panel on Space keydown within the listbox', async () => {
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const listboxEl = document.querySelector('[cdkListbox]') as HTMLElement;
    listboxEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('toggles panel when trigger button is clicked', () => {
    const triggerBtn = fixture.debugElement.query(By.css('.dropdown__trigger'))
      .nativeElement as HTMLButtonElement;

    triggerBtn.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    triggerBtn.click();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(false);
  });

  it('renders trigger with default aria-label', () => {
    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger')).nativeElement;
    expect(trigger.getAttribute('aria-label')).toBe('Select an option');
  });

  it('renders trigger with custom aria-label', async () => {
    fixture.componentRef.setInput('ariaLabelKey', 'testKey');
    await fixture.whenStable();
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger')).nativeElement;
    expect(trigger.getAttribute('aria-label')).toBe('testKey');
  });

  it('reflects isOpen state via aria-expanded', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger')).nativeElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    component.toggle();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders option label using labelKey via transloco when present', () => {
    const optionsWithKey: DropdownOption<string>[] = [
      { value: 'a', labelKey: 'optionAKey' },
      { value: 'b', label: 'Option B' },
    ];
    fixture.componentRef.setInput('options', optionsWithKey);
    fixture.componentRef.setInput('value', 'a');
    fixture.detectChanges();

    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger')).nativeElement;
    expect(trigger.textContent).toContain('optionAKey');
  });

  it('renders option list item label using labelKey via transloco when present', async () => {
    const optionsWithKey: DropdownOption<string>[] = [
      { value: 'a', label: 'Option A' },
      { value: 'b', labelKey: 'optionBKey' },
    ];
    fixture.componentRef.setInput('options', optionsWithKey);
    fixture.componentRef.setInput('value', 'a');
    fixture.detectChanges();

    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const optionEls = document.querySelectorAll('.dropdown__option');
    expect(optionEls[1].textContent).toContain('optionBKey');
  });

  /**
   * This test exists solely to achieve full coverage of `viewChild.required(CdkListbox)`.
   *
   * Problem: Angular internally wraps tokens passed to `viewChild` in lazily evaluated
   * functions (forwardRef closures). Since the CdkListbox directive is rendered inside
   * an asynchronous <ng-template> (CDK Overlay), standard tests cannot synchronously
   * resolve this token. As a result, Istanbul reports the `CdkListbox` token itself
   * as uncovered (`fstat-no`).
   *
   * Solution: Use `TestBed.overrideTemplate` to remove the asynchronous CDK Overlay
   * dependency for this isolated test. Although overrideTemplate triggers JIT
   * recompilation (which would normally affect template coverage), Istanbul aggregates
   * coverage across all tests. The standard AOT tests still cover the original template,
   * while this overridden test allows the instrumented TypeScript class to synchronously
   * resolve and execute the `CdkListbox` token.
   **/

  it('should explicitly resolve viewChild queries to satisfy Istanbul coverage', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [getTranslocoModule()],
      })
      .overrideTemplate(DropdownComponent, `<ul cdkListbox></ul><button #triggerButton></button>`)
      .compileComponents();

    const localFixture = TestBed.createComponent(DropdownComponent<string>);
    localFixture.componentRef.setInput('options', [{ value: 'a', label: 'A' }]);
    localFixture.componentRef.setInput('value', 'a');
    localFixture.detectChanges();

    const componentInstance = localFixture.componentInstance;
    const listbox = componentInstance['listbox']();
    expect(listbox).toBeTruthy();

    const focusSpy = vi.spyOn(listbox, 'focus');
    componentInstance.onOverlayAttached();
    expect(focusSpy).toHaveBeenCalled();
  });
});
