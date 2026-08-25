import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { NotificationsFacade } from '../notifications.facade';
import { NotificationPanelComponent } from './notification-panel.component';
import { Notification } from '../notifications.model';

describe('NotificationPanelComponent', () => {
  let component: NotificationPanelComponent;
  let fixture: ComponentFixture<NotificationPanelComponent>;

  let facade: {
    showPanel: ReturnType<typeof signal<boolean>>;
    notifications: ReturnType<typeof signal<Notification[]>>;
    closePanel: ReturnType<typeof vi.fn>;
    clearNotifications: ReturnType<typeof vi.fn>;
    removeNotification: ReturnType<typeof vi.fn>;
  };

  const notification = (overrides: Partial<Notification> = {}): Notification => ({
    sentAt: 1706438400000, // 2024-01-28T08:00:00.000Z
    type: 'info',
    message: 'Test message',
    ...overrides,
  });

  beforeEach(async () => {
    facade = {
      showPanel: signal(false),
      notifications: signal<Notification[]>([]),
      closePanel: vi.fn(),
      clearNotifications: vi.fn(),
      removeNotification: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationPanelComponent, getTranslocoModule()],
      providers: [{ provide: NotificationsFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getPanel(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.notification-panel');
  }

  it('has cdkTrapFocus applied to container', () => {
    expect(getPanel()?.getAttribute('cdktrapfocus')).not.toBeNull();
  });

  it('calls closePanel when close button is clicked', () => {
    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.notification-panel__close',
    );
    closeBtn.click();

    expect(facade.closePanel).toHaveBeenCalledOnce();
  });

  describe('without notifications', () => {
    it('shows empty state when there are no notifications', () => {
      const empty = fixture.nativeElement.querySelector('.notification-panel__empty');
      expect(empty).not.toBeNull();
      expect(empty.textContent.trim()).toBe('No notifications');
    });

    it('does not show clear all button when there are no notifications', () => {
      const clearBtn = fixture.nativeElement.querySelector('.notification-panel__clear-all');
      expect(clearBtn).toBeNull();
    });

    it('does not render notification items when list is empty', () => {
      const items = fixture.nativeElement.querySelectorAll('app-notification-item');
      expect(items.length).toBe(0);
    });
  });

  describe('with notifications', () => {
    beforeEach(() => {
      facade.notifications.set([notification({ sentAt: 1 }), notification({ sentAt: 2 })]);
      fixture.detectChanges();
    });

    it('renders one notification item per notification', () => {
      const items = fixture.nativeElement.querySelectorAll('app-notification-item');
      expect(items.length).toBe(2);
    });

    it('does not show empty state', () => {
      expect(fixture.nativeElement.querySelector('.notification-panel__empty')).toBeNull();
    });

    it('shows clear all button and calls clearNotifications on click', () => {
      const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
        '.notification-panel__clear-all',
      );
      expect(clearBtn).not.toBeNull();

      clearBtn.click();
      expect(facade.clearNotifications).toHaveBeenCalledOnce();
    });

    it('calls removeNotification with sentAt when item emits remove', () => {
      const item = fixture.debugElement.children
        .find((el) => el.nativeElement.matches('.notification-panel'))!
        .query((el) => el.name === 'app-notification-item');

      item.triggerEventHandler('remove', 1);

      expect(facade.removeNotification).toHaveBeenCalledWith(1);
    });
  });
});
