import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from './storage.service';
import { Notification } from '../../notifications.model';

describe('StorageService', () => {
  let service: StorageService;
  let logger: Partial<LoggerService>;

  const firstNotification: Notification = {
    type: 'info',
    message: 'foo',
    sentAt: 42,
  };
  const secondNotification: Notification = {
    type: 'success',
    message: 'bar',
    sentAt: 43,
  };

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: logger }],
    });
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNotifications', () => {
    it('returns notifications', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
        JSON.stringify([firstNotification, secondNotification]),
      );
      const res = service.getNotifications();
      expect(res).toEqual([firstNotification, secondNotification]);
    });

    it('returns null when storage is empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const res = service.getNotifications();
      expect(res).toBeNull();
    });

    it('returns null when JSON is invalid', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const res = service.getNotifications();
      expect(res).toBeNull();
    });

    it('clears corrupted data', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.getNotifications();
      expect(removeSpy).toHaveBeenCalledWith('notifications');
    });

    it('logs parse error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      service.getNotifications();
      expect(logger.error).toHaveBeenCalled();
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.getNotifications()).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.getNotifications();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('saveNotification', () => {
    it('saves first notification', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.saveNotification(firstNotification);
      expect(setItemSpy).toHaveBeenCalledWith('notifications', JSON.stringify([firstNotification]));
    });

    it('appends notification to existing list', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify([firstNotification]));
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.saveNotification(secondNotification);
      expect(setItemSpy).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify([firstNotification, secondNotification]),
      );
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.saveNotification(firstNotification)).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.saveNotification(firstNotification);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('removeNotification', () => {
    it('returns when notification list is empty', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue(null);
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.removeNotification(firstNotification.sentAt);
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('removes storage item when notification was the only', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([firstNotification]);
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.removeNotification(firstNotification.sentAt);
      expect(removeItemSpy).toHaveBeenCalledWith('notifications');
    });

    it('spares the remaining analyses', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([
        firstNotification,
        secondNotification,
      ]);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.removeNotification(firstNotification.sentAt);
      expect(setItemSpy).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify([secondNotification]),
      );
    });

    it('does not throw on non existing notification', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([firstNotification]);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.removeNotification(secondNotification.sentAt)).not.toThrow();
    });

    it('does not throw on storage error', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([firstNotification]);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.removeNotification(firstNotification.sentAt)).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(service, 'getNotifications').mockReturnValue([firstNotification]);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.removeNotification(firstNotification.sentAt);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('clearNotifications', () => {
    it('removes storage item', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.clearNotifications();
      expect(removeItemSpy).toHaveBeenCalledWith('notifications');
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.clearNotifications()).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.clearNotifications();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
