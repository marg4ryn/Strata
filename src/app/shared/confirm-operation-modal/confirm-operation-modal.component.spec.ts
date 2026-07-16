import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmOperationModal } from './confirm-operation-modal.component';

describe('ConfirmOperationModal', () => {
  let component: ConfirmOperationModal;
  let fixture: ComponentFixture<ConfirmOperationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmOperationModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmOperationModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function getButtons(): { cancel: HTMLButtonElement; confirm: HTMLButtonElement } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return { cancel: buttons[0], confirm: buttons[1] };
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default label', () => {
    const title = fixture.nativeElement.querySelector('.modal__title');
    expect(title.textContent).toContain('This operation cannot be undone. Are you sure?');
  });

  it('should display custom label via input', async () => {
    fixture.componentRef.setInput('label', 'Delete this item?');
    fixture.detectChanges();
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector('.modal__title');
    expect(title.textContent).toContain('Delete this item?');
  });

  it('should render dialog with correct a11y attributes', () => {
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
  });

  it('should render cancel and confirm buttons with correct variants', () => {
    const { cancel, confirm } = getButtons();
    expect(cancel.classList.contains('btn--secondary')).toBeTruthy();
    expect(confirm.classList.contains('btn--danger')).toBeTruthy();
  });

  it('should emit cancel when cancel button is clicked', () => {
    const spy = vi.fn();
    component.cancel.subscribe(spy);

    getButtons().cancel.click();

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should emit confirm when confirm button is clicked', () => {
    const spy = vi.fn();
    component.confirm.subscribe(spy);

    getButtons().confirm.click();

    expect(spy).toHaveBeenCalledOnce();
  });
});
