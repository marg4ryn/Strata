import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { NotificationsService } from './notifications.service';
import { StoreService } from '../store/store.service';
import { StorageService } from '../storage/storage.service';
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
        { provide: StoreService, useValue: store },
        { provide: StorageService, useValue: storage },
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
    message: 'foo',
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

  it('clears notifications', () => {
    store.notifications.set([notification]);
    service.clearNotifications();
    expect(store.notifications()).toBeNull();
    expect(storage.clearNotifications).toHaveBeenCalled();
  });

  describe('add notification', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('adds success notification', () => {
      const successNotification: Notification = {
        type: 'success',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(successNotification.sentAt);
      service.addNotificationSuccess(successNotification.message);
      expect(store.addNotification).toHaveBeenCalledWith(successNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(successNotification);
    });

    it('adds info notification', () => {
      const infoNotification: Notification = {
        type: 'info',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(infoNotification.sentAt);
      service.addNotificationInfo(infoNotification.message);
      expect(store.addNotification).toHaveBeenCalledWith(infoNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(infoNotification);
    });

    it('adds warning notification', () => {
      const warningNotification: Notification = {
        type: 'warning',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(warningNotification.sentAt);
      service.addNotificationWarning(warningNotification.message);
      expect(store.addNotification).toHaveBeenCalledWith(warningNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(warningNotification);
    });

    it('adds error notification', () => {
      const errorNotification: Notification = {
        type: 'error',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(errorNotification.sentAt);
      service.addNotificationError(errorNotification.message);
      expect(store.addNotification).toHaveBeenCalledWith(errorNotification);
      expect(storage.saveNotification).toHaveBeenCalledWith(errorNotification);
    });
  });
});
