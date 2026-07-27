import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { NotificationsFacade } from './notifications.facade';
import { StoreService } from './data-access/store/store.service';
import { NotificationsService } from './data-access/service/notifications.service';
import { Notification } from './notifications.model';

describe('NotificationsFacade', () => {
  let service: NotificationsFacade;

  let store: {
    notifications: ReturnType<typeof signal<Notification[] | null>>;
    showPanel: ReturnType<typeof signal<boolean>>;
    openPanel: ReturnType<typeof vi.fn>;
    closePanel: ReturnType<typeof vi.fn>;
  };

  let notificationsService: {
    loadNotifications: ReturnType<typeof vi.fn>;
    removeNotification: ReturnType<typeof vi.fn>;
    clearNotifications: ReturnType<typeof vi.fn>;
    addNotificationSuccess: ReturnType<typeof vi.fn>;
    addNotificationInfo: ReturnType<typeof vi.fn>;
    addNotificationWarning: ReturnType<typeof vi.fn>;
    addNotificationError: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      notifications: signal(null),
      showPanel: signal(false),
      openPanel: vi.fn(),
      closePanel: vi.fn(),
    };

    notificationsService = {
      loadNotifications: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
      addNotificationSuccess: vi.fn(),
      addNotificationInfo: vi.fn(),
      addNotificationWarning: vi.fn(),
      addNotificationError: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationsFacade,
        { provide: StoreService, useValue: store },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    });
    service = TestBed.inject(NotificationsFacade);
  });

  it('updates computed signals', () => {
    const notification: Notification = {
      type: 'info',
      message: 'foo',
      sentAt: 42,
    };
    store.notifications.set([notification]);
    store.showPanel.set(true);

    expect(service.notifications()).toEqual([notification]);
    expect(service.showPanel()).toBeTruthy();
  });

  it('handles openPanel', () => {
    service.openPanel();
    expect(store.openPanel).toHaveBeenCalledOnce();
  });

  it('handles closePanel', () => {
    service.closePanel();
    expect(store.closePanel).toHaveBeenCalledOnce();
  });

  it('handles loadNotifications', () => {
    service.loadNotifications();
    expect(notificationsService.loadNotifications).toHaveBeenCalledOnce();
  });

  it('handles removeNotification', () => {
    service.removeNotification(42);
    expect(notificationsService.removeNotification).toHaveBeenCalledWith(42);
  });

  it('handles clearNotifications', () => {
    service.clearNotifications();
    expect(notificationsService.clearNotifications).toHaveBeenCalledOnce();
  });

  it('handles sendNotificationSuccess', () => {
    service.sendNotificationSuccess('foo');
    expect(notificationsService.addNotificationSuccess).toHaveBeenCalledWith('foo');
  });

  it('handles sendNotificationInfo', () => {
    service.sendNotificationInfo('foo');
    expect(notificationsService.addNotificationInfo).toHaveBeenCalledWith('foo');
  });

  it('handles sendNotificationWarning', () => {
    service.sendNotificationWarning('foo');
    expect(notificationsService.addNotificationWarning).toHaveBeenCalledWith('foo');
  });

  it('handles sendNotificationError', () => {
    service.sendNotificationError('foo');
    expect(notificationsService.addNotificationError).toHaveBeenCalledWith('foo');
  });
});
