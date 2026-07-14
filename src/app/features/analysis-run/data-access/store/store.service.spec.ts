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

  describe('resetStateOmitShowModal', () => {
    it('should reset state', () => {
      store.isBusy.set(true);
      store.progress.set('QUEUED');
      store.result.set('foo');
      store.error.set('bar');

      store.resetStateOmitShowModal();

      expect(store.isBusy()).toBeFalsy();
      expect(store.progress()).toBeNull();
      expect(store.result()).toBeNull();
      expect(store.error()).toBeNull();
    });

    it('should omit showModal', () => {
      store.showModal.set(true);
      store.resetStateOmitShowModal();
      expect(store.showModal()).toBeTruthy();
    });

    it('should log on state reset', () => {
      const infoSpy = vi.spyOn(logger, 'info');
      store.resetStateOmitShowModal();
      expect(infoSpy).toHaveBeenCalled();
    });
  });
});
