import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from '@app/core/storage/storage.service';
import { NotificationsStorageService } from './notifications-storage.service';
import { Notification } from '../../notifications.model';

describe('NotificationsStorageService', () => {
  let service: NotificationsStorageService;
  let logger: Partial<LoggerService>;

  let storage: {
    setItem: ReturnType<typeof vi.fn>;
    getItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    storage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: logger },
        { provide: StorageService, useValue: storage },
      ],
    });
    service = TestBed.inject(NotificationsStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const firstNotification: Notification = {
    type: 'info',
    messageKey: 'foo',
    sentAt: 42,
  };
  const secondNotification: Notification = {
    type: 'success',
    messageKey: 'bar',
    sentAt: 43,
  };

  const notificationsKey = 'notifications';

  describe('getNotifications', () => {
    it('returns notifications', () => {
      storage.getItem.mockReturnValue([firstNotification, secondNotification]);
      const res = service.getNotifications();
      expect(res).toEqual([firstNotification, secondNotification]);
      expect(storage.getItem).toHaveBeenCalledWith(sessionStorage, notificationsKey);
    });

    it('returns null when storage is empty', () => {
      storage.getItem.mockReturnValue(null);
      const res = service.getNotifications();
      expect(res).toBeNull();
      expect(storage.getItem).toHaveBeenCalledWith(sessionStorage, notificationsKey);
    });
  });

  describe('saveNotification', () => {
    it('saves first notification', () => {
      storage.getItem.mockReturnValue(null);
      service.saveNotification(firstNotification);
      expect(storage.setItem).toHaveBeenCalledWith(sessionStorage, notificationsKey, [
        firstNotification,
      ]);
    });

    it('appends notification to existing list', () => {
      storage.getItem.mockReturnValue([firstNotification]);
      service.saveNotification(secondNotification);
      expect(storage.setItem).toHaveBeenCalledWith(sessionStorage, notificationsKey, [
        firstNotification,
        secondNotification,
      ]);
    });
  });

  describe('removeNotification', () => {
    it('returns when there are no notifications', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue(null);
      service.removeNotification(firstNotification.sentAt);
      expect(storage.removeItem).not.toHaveBeenCalled();
    });

    it('removes the storage item when removing the last notification', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([firstNotification]);
      service.removeNotification(firstNotification.sentAt);
      expect(storage.removeItem).toHaveBeenCalledWith(sessionStorage, notificationsKey);
    });

    it('keeps the remaining notifications', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([
        firstNotification,
        secondNotification,
      ]);
      service.removeNotification(firstNotification.sentAt);
      expect(storage.setItem).toHaveBeenCalledWith(sessionStorage, notificationsKey, [
        secondNotification,
      ]);
    });

    it('does not throw when the notification does not exist', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([firstNotification]);
      expect(() => service.removeNotification(secondNotification.sentAt)).not.toThrow();
    });
  });

  describe('clearNotifications', () => {
    it('removes the storage item', () => {
      service.clearNotifications();
      expect(storage.removeItem).toHaveBeenCalledWith(sessionStorage, notificationsKey);
    });
  });

  const unreadNotificationsCountKey = 'unreadNotificationsCount';

  describe('getUnreadNotificationsCount', () => {
    it('returns unread notifications count', () => {
      storage.getItem.mockReturnValue(42);
      const res = service.getUnreadNotificationsCount();
      expect(res).toBe(42);
      expect(storage.getItem).toHaveBeenCalledWith(sessionStorage, unreadNotificationsCountKey);
    });

    it('returns null when storage is empty', () => {
      storage.getItem.mockReturnValue(null);
      const res = service.getUnreadNotificationsCount();
      expect(res).toBeNull();
      expect(storage.getItem).toHaveBeenCalledWith(sessionStorage, unreadNotificationsCountKey);
    });
  });

  describe('saveUnreadNotificationsCount', () => {
    it('saves unread notifications count', () => {
      storage.getItem.mockReturnValue(null);
      service.saveUnreadNotificationsCount(1);
      expect(storage.setItem).toHaveBeenCalledWith(sessionStorage, unreadNotificationsCountKey, 1);
    });
  });

  describe('clearUnreadNotificationsCount', () => {
    it('removes the storage item', () => {
      const removeItemSpy = vi.spyOn(storage, 'removeItem');
      service.clearUnreadNotificationsCount();
      expect(removeItemSpy).toHaveBeenCalledWith(sessionStorage, unreadNotificationsCountKey);
    });
  });
});
