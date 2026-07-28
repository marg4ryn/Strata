import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationItem } from './notification-item.component';
import { Notification } from '../notifications.model';

describe('NotificationItem', () => {
  let component: NotificationItem;
  let fixture: ComponentFixture<NotificationItem>;

  const baseNotification: Notification = {
    sentAt: 1706438400000, // 2024-01-28T08:00:00.000Z
    type: 'info',
    message: 'Test message',
  };

  function setNotification(overrides: Partial<Notification> = {}): void {
    fixture.componentRef.setInput('notification', { ...baseNotification, ...overrides });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationItem],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationItem);
    component = fixture.componentInstance;
  });

  it('renders notification message', () => {
    setNotification({ message: 'Hello world' });

    const messageEl = fixture.nativeElement.querySelector('.notification-item__message');
    expect(messageEl.textContent.trim()).toBe('Hello world');
  });

  it('renders formatted timestamp based on sentAt', () => {
    setNotification({ sentAt: baseNotification.sentAt });

    const expected = new Date(baseNotification.sentAt).toLocaleString();
    const timeEl = fixture.nativeElement.querySelector('.notification-item__time');
    expect(timeEl.textContent.trim()).toBe(expected);
  });

  it('emits sentAt when close button is clicked', () => {
    setNotification({ sentAt: 999 });

    const emitSpy = vi.spyOn(component.remove, 'emit');
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.notification-item__close',
    );
    closeBtn.click();

    expect(emitSpy).toHaveBeenCalledWith(999);
  });

  it('close button has accessible label', () => {
    setNotification();

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.notification-item__close',
    );
    expect(closeBtn.getAttribute('aria-label')).toBe('Remove notification');
  });

  describe('host classes by type', () => {
    const cases: Array<{ type: Notification['type']; className: string }> = [
      { type: 'success', className: 'notification-item--success' },
      { type: 'info', className: 'notification-item--info' },
      { type: 'error', className: 'notification-item--error' },
      { type: 'warning', className: 'notification-item--warning' },
    ];

    it.each(cases)('applies $className for type $type', ({ type, className }) => {
      setNotification({ type });

      expect(fixture.nativeElement.classList.contains(className)).toBeTruthy();
    });

    it('applies only the matching type class, not others', () => {
      setNotification({ type: 'error' });

      const host: HTMLElement = fixture.nativeElement;
      expect(host.classList.contains('notification-item--error')).toBeTruthy();
      expect(host.classList.contains('notification-item--success')).toBeFalsy();
      expect(host.classList.contains('notification-item--info')).toBeFalsy();
      expect(host.classList.contains('notification-item--warning')).toBeFalsy();
    });
  });
});
