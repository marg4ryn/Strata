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
    notifications: ReturnType<typeof signal<Notification[] | null>>;
    addNotification: ReturnType<typeof vi.fn>;
    removeNotification: ReturnType<typeof vi.fn>;
    clearNotifications: ReturnType<typeof vi.fn>;
  };

  let storage: {
    getNotifications: ReturnType<typeof vi.fn>;
    saveNotification: ReturnType<typeof vi.fn>;
    removeNotification: ReturnType<typeof vi.fn>;
    clearNotifications: ReturnType<typeof vi.fn>;
  };

  const notification: Notification = {
    type: 'success',
    message: 'foo',
    sentAt: 42,
  };

  beforeEach(() => {
    store = {
      notifications: signal(null),
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
    };

    storage = {
      getNotifications: vi.fn(),
      saveNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearNotifications: vi.fn(),
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

  describe('loadNotifications', () => {
    it('loads notifications', () => {
      vi.spyOn(storage, 'getNotifications').mockReturnValue([notification]);
      service.loadNotifications();
      expect(store.notifications()).toEqual([notification]);
    });

    it('loads notifications when empty', () => {
      vi.spyOn(storage, 'getNotifications').mockReturnValue(null);
      service.loadNotifications();
      expect(store.notifications()).toBeNull();
    });
  });

  it('removes notification', () => {
    service.removeNotification(notification.sentAt);
    expect(store.removeNotification).toHaveBeenCalledWith(notification.sentAt);
    expect(storage.removeNotification).toHaveBeenCalledWith(notification.sentAt);
  });

  it('clears notifications', () => {
    service.clearNotifications();
    expect(store.clearNotifications).toHaveBeenCalled();
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
      const notification: Notification = {
        type: 'success',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(notification.sentAt);
      service.addNotificationSuccess(notification.message);
      expect(store.addNotification).toHaveBeenCalledWith(notification);
      expect(storage.saveNotification).toHaveBeenCalledWith(notification);
    });

    it('adds info notification', () => {
      const notification: Notification = {
        type: 'info',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(notification.sentAt);
      service.addNotificationInfo(notification.message);
      expect(store.addNotification).toHaveBeenCalledWith(notification);
      expect(storage.saveNotification).toHaveBeenCalledWith(notification);
    });

    it('adds warning notification', () => {
      const notification: Notification = {
        type: 'warning',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(notification.sentAt);
      service.addNotificationWarning(notification.message);
      expect(store.addNotification).toHaveBeenCalledWith(notification);
      expect(storage.saveNotification).toHaveBeenCalledWith(notification);
    });

    it('adds error notification', () => {
      const notification: Notification = {
        type: 'error',
        message: 'foo',
        sentAt: 42,
      };
      vi.setSystemTime(notification.sentAt);
      service.addNotificationError(notification.message);
      expect(store.addNotification).toHaveBeenCalledWith(notification);
      expect(storage.saveNotification).toHaveBeenCalledWith(notification);
    });
  });
});
