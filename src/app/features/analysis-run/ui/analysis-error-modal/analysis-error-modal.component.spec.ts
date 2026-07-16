import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisErrorModal } from './analysis-error-modal.component';

describe('AnalysisErrorModal', () => {
  let component: AnalysisErrorModal;
  let fixture: ComponentFixture<AnalysisErrorModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisErrorModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisErrorModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function getButtons(): { cancel: HTMLButtonElement; retry: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { cancel: buttons[0], retry: buttons[1] };
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display error message via input', async () => {
    fixture.componentRef.setInput('error', 'Server error');
    fixture.detectChanges();
    await fixture.whenStable();

    const body = fixture.nativeElement.querySelector('.modal__body');
    expect(body.textContent).toContain('Server error');
  });

  it('should emit cancel when cancel button is clicked', () => {
    const spy = vi.fn();
    component.cancel.subscribe(spy);

    getButtons().cancel.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should emit retry when retry button is clicked', () => {
    const spy = vi.fn();
    component.retry.subscribe(spy);

    getButtons().retry.click();

    expect(spy).toHaveBeenCalledOnce();
  });
});
