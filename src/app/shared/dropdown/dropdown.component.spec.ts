import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { DropdownComponent, DropdownOption } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent<string>;
  let fixture: ComponentFixture<DropdownComponent<string>>;

  const options: DropdownOption<string>[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'a');
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('starts closed', () => {
    expect(component.isOpen()).toBe(false);
  });

  it('returns matching option for current value', () => {
    expect(component.currentOption).toEqual(options[0]);
  });

  it('falls back to first option when value does not match', async () => {
    fixture.componentRef.setInput('value', 'missing');
    await fixture.whenStable();
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
    const triggerButton = fixture.debugElement.query(By.css('.dropdown__trigger'))
      .nativeElement as HTMLButtonElement;
    const focusSpy = vi.spyOn(triggerButton, 'focus');

    component.close();
    vi.runAllTimers();

    expect(focusSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('emits selectionChange with selected values on select', () => {
    const spy = vi.fn();
    component.selectionChange.subscribe(spy);
    component.select(['b']);
    expect(spy).toHaveBeenCalledWith(['b']);
  });

  it('closes the panel after select', () => {
    component.toggle();
    component.select(['b']);
    expect(component.isOpen()).toBe(false);
  });

  it('renders trigger with default aria-label', () => {
    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger')).nativeElement;
    expect(trigger.getAttribute('aria-label')).toBe('Select an option');
  });

  it('renders trigger with custom aria-label', async () => {
    fixture.componentRef.setInput('ariaLabelKey', 'Choose item');
    await fixture.whenStable();
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger')).nativeElement;
    expect(trigger.getAttribute('aria-label')).toBe('Choose item');
  });

  it('reflects isOpen state via aria-expanded', () => {
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.css('.dropdown__trigger')).nativeElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    component.toggle();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
