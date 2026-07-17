import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisProgressSpinner } from './analysis-progress-spinner.component';

describe('AnalysisProgressSpinner', () => {
  let component: AnalysisProgressSpinner;
  let fixture: ComponentFixture<AnalysisProgressSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisProgressSpinner],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisProgressSpinner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function getButtons(): { abort: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { abort: buttons[0] };
  }

  function getConfirmModal(): HTMLElement | null {
    return fixture.nativeElement.querySelector('app-confirm-operation-modal');
  }

  function getConfirmModalButtons(): { cancel: HTMLButtonElement; confirm: HTMLButtonElement } {
    const modal = getConfirmModal()!;
    const buttons = modal.querySelectorAll('button');
    return { cancel: buttons[0], confirm: buttons[1] };
  }

  function setInput(value: string): void {
    fixture.componentRef.setInput('label', value);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display label via inputs', () => {
    fixture.detectChanges();
    setInput('Loading...');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.loading-label');
    expect(label.textContent).toContain('Loading...');
  });

  it('should not render confirm modal initially', () => {
    expect(getConfirmModal()).toBeNull();
  });

  it('should show confirm modal when abort button is clicked', () => {
    getButtons().abort.click();
    fixture.detectChanges();

    expect(component.showModal).toBe(true);
    expect(getConfirmModal()).not.toBeNull();
  });

  it('should hide confirm modal and not emit abort on cancel', () => {
    const spy = vi.fn();
    component.abort.subscribe(spy);

    getButtons().abort.click();
    fixture.detectChanges();

    getConfirmModalButtons().cancel.click();
    fixture.detectChanges();

    expect(component.showModal).toBe(false);
    expect(getConfirmModal()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should hide confirm modal and emit abort on confirm', () => {
    const spy = vi.fn();
    component.abort.subscribe(spy);

    getButtons().abort.click();
    fixture.detectChanges();

    getConfirmModalButtons().confirm.click();
    fixture.detectChanges();

    expect(component.showModal).toBe(false);
    expect(getConfirmModal()).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });
});
