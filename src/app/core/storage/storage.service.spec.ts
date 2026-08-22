import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let logger: Partial<LoggerService>;

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

  describe('getItem', () => {
    it('returns parsed value', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify('value'));
      const res = service.getItem<string>(sessionStorage, 'key');
      expect(res).toBe('value');
    });

    it('returns null when key does not exist', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const res = service.getItem<string>(sessionStorage, 'key');
      expect(res).toBeNull();
    });

    it('returns null when JSON is invalid', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const res = service.getItem<string>(sessionStorage, 'key');
      expect(res).toBeNull();
    });

    it('clears corrupted data', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.getItem<string>(sessionStorage, 'key');
      expect(removeSpy).toHaveBeenCalledWith('key');
    });

    it('logs parse error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      service.getItem<string>(sessionStorage, 'key');
      expect(logger.error).toHaveBeenCalled();
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.getItem<string>(sessionStorage, 'key')).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.getItem<string>(sessionStorage, 'key');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('setItem', () => {
    it('stringifies and saves value', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.setItem<string>(localStorage, 'key', 'value');
      expect(setItemSpy).toHaveBeenCalledWith('key', JSON.stringify('value'));
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.setItem<string>(localStorage, 'key', 'value')).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.setItem<string>(localStorage, 'key', 'value');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('removes storage item', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.removeItem(localStorage, 'key');
      expect(removeItemSpy).toHaveBeenCalledWith('key');
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.removeItem(localStorage, 'key')).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.removeItem(localStorage, 'key');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
