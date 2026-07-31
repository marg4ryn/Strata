import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusMonitor } from '@angular/cdk/a11y';

import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';
import { AnalysisProgressSpinner } from './analysis-progress-spinner.component';

describe('AnalysisProgressSpinner', () => {
  let component: AnalysisProgressSpinner;
  let fixture: ComponentFixture<AnalysisProgressSpinner>;
  let confirmModal: { confirm: ReturnType<typeof vi.fn> };
  let focusMonitor: {
    focusVia: ReturnType<typeof vi.fn>;
    stopMonitoring: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    confirmModal = { confirm: vi.fn() };
    focusMonitor = { focusVia: vi.fn(), stopMonitoring: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AnalysisProgressSpinner],
      providers: [
        { provide: ConfirmOperationModalService, useValue: confirmModal },
        { provide: FocusMonitor, useValue: focusMonitor },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisProgressSpinner);
    component = fixture.componentInstance;
  });

  function getButtons(): { abort: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { abort: buttons[0] };
  }

  it('focuses the abort button on init via FocusMonitor', () => {
    fixture.detectChanges();

    expect(focusMonitor.focusVia).toHaveBeenCalledOnce();
    expect(focusMonitor.focusVia).toHaveBeenCalledWith(component.firstButton(), 'program');
  });

  it('stops monitoring the abort button on destroy', () => {
    fixture.detectChanges();
    const button = component.firstButton();

    fixture.destroy();

    expect(focusMonitor.stopMonitoring).toHaveBeenCalledOnce();
    expect(focusMonitor.stopMonitoring).toHaveBeenCalledWith(button);
  });

  it('displays label via inputs', () => {
    fixture.componentRef.setInput('label', 'Loading...');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.loading__label');
    expect(label.textContent).toContain('Loading...');
  });

  it('disables abort button and shows aborting text when isAborting is true', () => {
    fixture.componentRef.setInput('isAborting', true);
    fixture.detectChanges();

    const button = getButtons().abort;
    expect(button.disabled).toBe(true);
    expect(button.textContent.trim()).toBe('Aborting...');
  });

  it('enables abort button and shows default text when isAborting is false', () => {
    fixture.componentRef.setInput('isAborting', false);
    fixture.detectChanges();

    const button = getButtons().abort;
    expect(button.disabled).toBe(false);
    expect(button.textContent.trim()).toBe('Abort');
  });

  it('opens confirm modal when abort button is clicked', () => {
    confirmModal.confirm.mockResolvedValue(false);
    fixture.detectChanges();

    getButtons().abort.click();

    expect(confirmModal.confirm).toHaveBeenCalledOnce();
  });

  it('passes destroyRef to confirm modal service', () => {
    confirmModal.confirm.mockResolvedValue(false);
    fixture.detectChanges();

    getButtons().abort.click();

    expect(confirmModal.confirm).toHaveBeenCalledWith(expect.anything());
  });

  it('does not emit abort when confirm modal is cancelled', async () => {
    confirmModal.confirm.mockResolvedValue(false);
    const spy = vi.fn();
    component.abort.subscribe(spy);
    fixture.detectChanges();

    getButtons().abort.click();
    await fixture.whenStable();

    expect(spy).not.toHaveBeenCalled();
  });

  it('emits abort when confirm modal is confirmed', async () => {
    confirmModal.confirm.mockResolvedValue(true);
    const spy = vi.fn();
    component.abort.subscribe(spy);
    fixture.detectChanges();

    getButtons().abort.click();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalledOnce();
  });
});
