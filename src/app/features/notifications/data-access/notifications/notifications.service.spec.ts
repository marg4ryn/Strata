import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { NotificationsService } from './notifications.service';
import { NotificationsStoreService } from '../notifications-store/notifications-store.service';
import { NotificationsStorageService } from '../notifications-storage/notifications-storage.service';
import { Notification } from '../../notifications.model';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let logger: Partial<LoggerService>;

  let store: {
    unreadNotificationsCount: ReturnType<typeof signal<number>>;
    notifications: ReturnType<typeof signal<Notification[] | null>>;
    showPanel: ReturnType<typeof signal<boolean>>;
    addNotification: ReturnType<typeof vi.fn>;
    removeNotification: ReturnType<typeof vi.fn>;
  };

  let storage: {
    getNotifications: ReturnType<typeof vi.fn>;
    saveNotification: ReturnType<typeof vi.fn>;
    removeNotification: ReturnType<typeof vi.fn>;
    clearNotifications: ReturnType<typeof vi.fn>;
    getUnreadNotificationsCount: ReturnType<typeof vi.fn>;
    saveUnreadNotificationsCount: ReturnType<typeof vi.fn>;
    clearUnreadNotificationsCount: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      unreadNotificationsCount: signal(0),
      notifications: signal(null),
      showPanel: signal(false),
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
    };

    storage = {
      getNotifications: vi.fn(),
      saveNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
      getUnreadNotificationsCount: vi.fn(),
      saveUnreadNotificationsCount: vi.fn(),
      clearUnreadNotificationsCount: vi.fn(),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationsStoreService, useValue: store },
        { provide: NotificationsStorageService, useValue: storage },
        { provide: LoggerService, useValue: logger },
      ],
    });
    service = TestBed.inject(NotificationsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const notification: Notification = {
    type: 'success',
    messageKey: 'foo',
    sentAt: 42,
  };

  describe('loadNotifications', () => {
    it('loads notifications', () => {
      vi.spyOn(storage, 'getNotifications').mockReturnValue([notification]);
      vi.spyOn(storage, 'getUnreadNotificationsCount').mockReturnValue(1);
      service.loadNotifications();
      expect(store.notifications()).toEqual([notification]);
      expect(store.unreadNotificationsCount()).toBe(1);
    });

    it('loads notifications when empty', () => {
      vi.spyOn(storage, 'getNotifications').mockReturnValue(null);
      vi.spyOn(storage, 'getUnreadNotificationsCount').mockReturnValue(null);
      service.loadNotifications();
      expect(store.notifications()).toBeNull();
      expect(store.unreadNotificationsCount()).toBe(0);
    });
  });

  describe('panel toggling', () => {
    it('handles notifications panel opening', () => {
      store.unreadNotificationsCount.set(1);
      service.openPanel();
      expect(store.showPanel()).toBeTruthy();
      expect(store.unreadNotificationsCount()).toBe(0);
      expect(storage.clearUnreadNotificationsCount).toHaveBeenCalled();
    });

    it('does not reset unread notifications count when it is 0', () => {
      store.unreadNotificationsCount.set(0);
      service.openPanel();
      expect(storage.clearUnreadNotificationsCount).not.toHaveBeenCalled();
    });

    it('handles notifications panel closing', () => {
      service.closePanel();
      expect(store.showPanel()).toBeFalsy();
    });
  });

  describe('removeNotification', () => {
    it('removes notification', () => {
      store.notifications.set([notification]);
      service.removeNotification(notification.sentAt);
      expect(store.removeNotification).toHaveBeenCalledWith(notification.sentAt);
      expect(storage.removeNotification).toHaveBeenCalledWith(notification.sentAt);
    });

    it('removes notification that does not exist', () => {
      store.notifications.set(null);
      service.removeNotification(notification.sentAt);
      expect(store.removeNotification).toHaveBeenCalledWith(notification.sentAt);
      expect(storage.removeNotification).toHaveBeenCalledWith(notification.sentAt);
    });
  });

  describe('clearNotifications', () => {
    it('clears notifications', () => {
      store.notifications.set([notification]);
      service.clearNotifications();
      expect(store.notifications()).toBeNull();
      expect(storage.clearNotifications).toHaveBeenCalled();
    });
  });

  describe('adds notifications', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('increases unread notifications count', () => {
      store.unreadNotificationsCount.set(0);
      service.addNotificationSuccess(notification.messageKey);
      expect(store.unreadNotificationsCount()).toBe(1);
    });

    it('does not increase unread notifications count when panel is opened', () => {
      store.showPanel.set(true);
      store.unreadNotificationsCount.set(0);
      service.addNotificationSuccess(notification.messageKey);
      expect(store.unreadNotificationsCount()).toBe(0);
    });

    it('adds success notification', () => {
      const successNotification: Notification = {
        type: 'success',
        messageKey: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(successNotification.sentAt);
      service.addNotificationSuccess(successNotification.messageKey);
      expect(store.addNotification).toHaveBeenCalledWith(successNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(successNotification);
    });

    it('adds info notification', () => {
      const infoNotification: Notification = {
        type: 'info',
        messageKey: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(infoNotification.sentAt);
      service.addNotificationInfo(infoNotification.messageKey);
      expect(store.addNotification).toHaveBeenCalledWith(infoNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(infoNotification);
    });

    it('adds warning notification', () => {
      const warningNotification: Notification = {
        type: 'warning',
        messageKey: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(warningNotification.sentAt);
      service.addNotificationWarning(warningNotification.messageKey);
      expect(store.addNotification).toHaveBeenCalledWith(warningNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(warningNotification);
    });

    it('adds error notification', () => {
      const errorNotification: Notification = {
        type: 'error',
        messageKey: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(errorNotification.sentAt);
      service.addNotificationError(errorNotification.messageKey);
      expect(store.addNotification).toHaveBeenCalledWith(errorNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(errorNotification);
    });
  });
});
