import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { ConfirmOperationModalComponent } from './confirm-operation-modal.component';

describe('ConfirmOperationModalComponent', () => {
  let component: ConfirmOperationModalComponent;
  let fixture: ComponentFixture<ConfirmOperationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmOperationModalComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmOperationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function getButtons(): { cancel: HTMLButtonElement; confirm: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { cancel: buttons[0], confirm: buttons[1] };
  }

  describe('label input', () => {
    it('displays default label', () => {
      const title = fixture.nativeElement.querySelector('.modal__title');
      expect(title.textContent).toContain('This operation cannot be undone. Are you sure?');
    });

    it('displays custom label via input', async () => {
      fixture.componentRef.setInput('labelKey', 'customKey');
      fixture.detectChanges();
      await fixture.whenStable();

      const title = fixture.nativeElement.querySelector('.modal__title');
      expect(title.textContent).toContain('customKey');
    });
  });

  describe('outputs', () => {
    it('emits cancel when cancel button is clicked', () => {
      const spy = vi.fn();
      component.cancel.subscribe(spy);

      getButtons().cancel.click();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('emits confirm when confirm button is clicked', () => {
      const spy = vi.fn();
      component.confirm.subscribe(spy);

      getButtons().confirm.click();

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('type input', () => {
    it('defaults to "danger"', () => {
      expect(component.type()).toBe('danger');
    });

    it('confirm button gets danger variant, cancel gets initial focus', async () => {
      fixture.componentRef.setInput('type', 'danger');
      fixture.detectChanges();
      await fixture.whenStable();

      const { cancel, confirm } = getButtons();
      expect(confirm.classList).toContain('btn--danger');
      expect(cancel.hasAttribute('cdkFocusInitial')).toBe(true);
      expect(confirm.hasAttribute('cdkFocusInitial')).toBe(false);
    });

    it('confirm button gets primary variant, confirm gets initial focus', async () => {
      fixture.componentRef.setInput('type', 'confirm');
      fixture.detectChanges();
      await fixture.whenStable();

      const { cancel, confirm } = getButtons();
      expect(confirm.classList).toContain('btn--primary');
      expect(confirm.hasAttribute('cdkFocusInitial')).toBe(true);
      expect(cancel.hasAttribute('cdkFocusInitial')).toBe(false);
    });

    it('cancel button always has "secondary" variant regardless of type', async () => {
      fixture.componentRef.setInput('type', 'confirm');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(getButtons().cancel.classList).toContain('btn--secondary');
    });
  });
});
