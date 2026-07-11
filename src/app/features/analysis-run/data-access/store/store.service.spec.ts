import { TestBed } from '@angular/core/testing';

import { StoreService } from './store.service';
import { LoggerService } from '@app/core/logging/logger.service';

describe('StoreService', () => {
  let store: StoreService;
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(StoreService);
    logger = TestBed.inject(LoggerService);
  });

  describe('resetState', () => {
    it('should reset state', () => {
      store.showModal.set(true);
      store.isBusy.set(true);
      store.progress.set('foo');
      store.result.set('bar');
      store.error.set('baz');

      store.resetState();

      expect(store.showModal()).toBeFalsy();
      expect(store.isBusy()).toBeFalsy();
      expect(store.progress()).toBe('');
      expect(store.result()).toBe('');
      expect(store.error()).toBe('');
    });

    it('should log on state reset', () => {
      const infoSpy = vi.spyOn(logger, 'info');
      store.resetState();
      expect(infoSpy).toHaveBeenCalled();
    });
  });
});
