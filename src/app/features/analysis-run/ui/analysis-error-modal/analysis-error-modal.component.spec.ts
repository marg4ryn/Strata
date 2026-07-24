import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusMonitor } from '@angular/cdk/a11y';

import { AnalysisErrorModal } from './analysis-error-modal.component';

describe('AnalysisErrorModal', () => {
  let component: AnalysisErrorModal;
  let fixture: ComponentFixture<AnalysisErrorModal>;
  let focusMonitor: FocusMonitor;
  let focusViaSpy: ReturnType<typeof vi.spyOn>;
  let stopMonitoringSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisErrorModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisErrorModal);
    component = fixture.componentInstance;

    focusMonitor = TestBed.inject(FocusMonitor);
    focusViaSpy = vi.spyOn(focusMonitor, 'focusVia');
    stopMonitoringSpy = vi.spyOn(focusMonitor, 'stopMonitoring');
  });

  function getButtons(): { cancel: HTMLButtonElement; retry: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { cancel: buttons[0], retry: buttons[1] };
  }

  describe('default behavior', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('displays error message via input', async () => {
      fixture.componentRef.setInput('error', 'Server error');
      fixture.detectChanges();
      await fixture.whenStable();

      const body = fixture.nativeElement.querySelector('.modal__body');
      expect(body.textContent).toContain('Server error');
    });

    it('emits cancel when cancel button is clicked', () => {
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      getButtons().cancel.click();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('emits retry when retry button is clicked during connection error', () => {
      const spy = vi.fn();
      component.retry.subscribe(spy);
      fixture.componentRef.setInput('errorType', 'connection');
      fixture.detectChanges();

      getButtons().retry.click();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('does not emit retry when server error occurs', () => {
      const spy = vi.fn();
      component.retry.subscribe(spy);
      fixture.componentRef.setInput('errorType', 'server');
      fixture.detectChanges();

      expect(getButtons().retry).toBeUndefined();
    });

    it('focuses cancel button on init when retry button does not exist', () => {
      expect(focusViaSpy).toHaveBeenCalledOnce();
      expect(focusViaSpy).toHaveBeenCalledWith(
        expect.objectContaining({ nativeElement: getButtons().cancel }),
        'program',
      );
    });

    it('stops monitoring cancel button on destroy', () => {
      const cancelButton = getButtons().cancel;
      fixture.destroy();

      expect(stopMonitoringSpy).toHaveBeenCalledOnce();
      expect(stopMonitoringSpy).toHaveBeenCalledWith(
        expect.objectContaining({ nativeElement: cancelButton }),
      );
    });
  });

  describe('connection error on init', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('errorType', 'connection');
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('focuses retry button on init when retry button exists', () => {
      expect(focusViaSpy).toHaveBeenCalledOnce();
      expect(focusViaSpy).toHaveBeenCalledWith(
        expect.objectContaining({ nativeElement: getButtons().retry }),
        'program',
      );
    });

    it('stops monitoring retry button on destroy', () => {
      const retryButton = getButtons().retry;
      fixture.destroy();

      expect(stopMonitoringSpy).toHaveBeenCalledOnce();
      expect(stopMonitoringSpy).toHaveBeenCalledWith(
        expect.objectContaining({ nativeElement: retryButton }),
      );
    });
  });
});
