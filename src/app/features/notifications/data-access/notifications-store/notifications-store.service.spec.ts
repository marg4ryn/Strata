import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { ContextLogger } from '@app/core/logging/context-logger/context-logger';
import { NotificationsStoreService } from './notifications-store.service';
import { Notification } from '../../notifications.model';

describe('NotificationsStoreService', () => {
  let service: NotificationsStoreService;
  let logger: ReturnType<typeof MockService<ContextLogger>>;

  beforeEach(() => {
    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: loggerService }],
    });

    service = TestBed.inject(NotificationsStoreService);
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

  it('updates computed signals', () => {
    service.unreadNotificationsCount.set(1);
    service.notifications.set([firstNotification]);
    service.showPanel.set(true);

    expect(service.unreadNotificationsCount()).toBe(1);
    expect(service.notifications()).toEqual([firstNotification]);
    expect(service.showPanel()).toBeTruthy();
  });

  describe('addNotification', () => {
    it('adds first notification', () => {
      service.notifications.set(null);
      service.addNotification(firstNotification);
      expect(service.notifications()).toEqual([firstNotification]);
      expect(logger.info).toHaveBeenCalled();
    });

    it('appends notification to existing list', () => {
      service.notifications.set([firstNotification]);
      service.addNotification(secondNotification);
      expect(service.notifications()).toEqual([firstNotification, secondNotification]);
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('removeNotification', () => {
    it('removes last notification', () => {
      service.notifications.set([firstNotification]);
      service.removeNotification(firstNotification.sentAt);
      expect(service.notifications()).toBeNull();
      expect(logger.info).toHaveBeenCalled();
    });

    it('keeps the remaining notifications', () => {
      service.notifications.set([firstNotification, secondNotification]);
      service.removeNotification(firstNotification.sentAt);
      expect(service.notifications()).toEqual([secondNotification]);
      expect(logger.info).toHaveBeenCalled();
    });

    it('does not throw when the notification list is empty', () => {
      service.notifications.set(null);
      expect(() => service.removeNotification(firstNotification.sentAt)).not.toThrow();
    });

    it('does not throw when the notification does not exist', () => {
      service.notifications.set([secondNotification]);
      expect(() => service.removeNotification(firstNotification.sentAt)).not.toThrow();
    });
  });
});
