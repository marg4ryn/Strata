import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let logger: ReturnType<typeof MockService<LoggerService>>;

  beforeEach(() => {
    logger = MockService(LoggerService);

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: logger }],
    });

    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('getItem', () => {
    it('returns parsed value', () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      expect(service.getItem<string>(sessionStorage, 'key')).toBe('value');
    });

    it('returns null when key does not exist', () => {
      expect(service.getItem<string>(sessionStorage, 'key')).toBeNull();
    });

    it('recovers from corrupted data by clearing it', () => {
      sessionStorage.setItem('key', 'invalid json');
      const res = service.getItem<string>(sessionStorage, 'key');
      expect(res).toBeNull();
      expect(sessionStorage.getItem('key')).toBeNull();
      expect(logger.error).toHaveBeenCalledOnce();
    });

    it('logs and swallows error when storage read fails', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.getItem<string>(sessionStorage, 'key')).not.toThrow();
      expect(logger.error).toHaveBeenCalledOnce();
    });
  });

  describe('setItem', () => {
    it('stringifies and saves value', () => {
      service.setItem<string>(localStorage, 'key', 'value');
      expect(localStorage.getItem('key')).toBe(JSON.stringify('value'));
    });

    it('logs and swallows error when storage write fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.setItem<string>(localStorage, 'key', 'value')).not.toThrow();
      expect(logger.error).toHaveBeenCalledOnce();
    });
  });

  describe('removeItem', () => {
    it('removes storage item', () => {
      localStorage.setItem('key', JSON.stringify('value'));
      service.removeItem(localStorage, 'key');
      expect(localStorage.getItem('key')).toBeNull();
    });

    it('logs and swallows error when storage removal fails', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.removeItem(localStorage, 'key')).not.toThrow();
      expect(logger.error).toHaveBeenCalledOnce();
    });
  });
});
