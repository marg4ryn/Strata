import { TestBed } from '@angular/core/testing';

import { StorageService } from './storage.service';
import { LoggerService } from '@app/core/logging/logger.service';
import { PendingAnalysis, AnalysisTarget, DateRange } from '../analysis-run.model';

describe('StorageService', () => {
  let storage: StorageService;
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    logger = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveSessionId', () => {
    it('should save sessionId', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      storage.saveSessionId('123');
      expect(setItemSpy).toHaveBeenCalledWith('sessionId', '123');
    });

    it('should not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => storage.saveSessionId('123')).not.toThrow();
    });

    it('should log storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const errorSpy = vi.spyOn(logger, 'error');
      +storage.saveSessionId('123');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('deleteSessionId', () => {
    it('should remove storage item', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      storage.deleteSessionId();
      expect(removeItemSpy).toHaveBeenCalledWith('sessionId');
    });

    it('should not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => storage.deleteSessionId()).not.toThrow();
    });

    it('should log storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const errorSpy = vi.spyOn(logger, 'error');
      storage.deleteSessionId();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('getSessionId', () => {
    it('should return sessionId', () => {
      const sessionId = '123';
      const getItemspy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(sessionId);
      const res = storage.getSessionId();
      expect(res).toBe(sessionId);
      expect(getItemspy).toHaveBeenCalledWith('sessionId');
    });

    it('should return null when storage is empty', () => {
      const getItemspy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const res = storage.getSessionId();
      expect(res).toBeNull();
      expect(getItemspy).toHaveBeenCalledWith('sessionId');
    });

    it('should not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => storage.getSessionId()).not.toThrow();
    });

    it('should log storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const errorSpy = vi.spyOn(logger, 'error');
      storage.getSessionId();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  const range: DateRange = {
    startDate: '2000-01-01',
    endDate: '2000-01-01',
    timezone: 'Europe/Warsaw',
  };
  const target: AnalysisTarget = {
    targetURL: 'https://example.com',
    limitRange: true,
    range: range,
  };
  const pendingAnalysis: PendingAnalysis = {
    sessionId: '1',
    startedAt: 42,
    target: target,
  };
  const newPendingAnalysis: PendingAnalysis = {
    sessionId: '2',
    startedAt: 43,
    target: target,
  };

  describe('savePendingAnalysis', () => {
    it('should save pendingAnalysis when storage is empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      storage.savePendingAnalysis(pendingAnalysis);
      expect(setItemSpy).toHaveBeenCalledWith('pendingAnalyses', JSON.stringify([pendingAnalysis]));
    });

    it('should push pendingAnalysis to remaining analyses when storage is not empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify([pendingAnalysis]));
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      storage.savePendingAnalysis(newPendingAnalysis);
      expect(setItemSpy).toHaveBeenCalledWith(
        'pendingAnalyses',
        JSON.stringify([pendingAnalysis, newPendingAnalysis]),
      );
    });

    it('should not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => storage.savePendingAnalysis(pendingAnalysis)).not.toThrow();
    });

    it('should log storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const errorSpy = vi.spyOn(logger, 'error');
      storage.savePendingAnalysis(pendingAnalysis);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('deletePendingAnalysis', () => {
    it('should return when pendingAnalyses was empty', () => {
      vi.spyOn(storage, 'getPendingAnalyses').mockReturnValue(null);
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      storage.deletePendingAnalysis('1');
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('should remove storage item when analysis was the only', () => {
      vi.spyOn(storage, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      storage.deletePendingAnalysis('1');
      expect(removeItemSpy).toHaveBeenCalledWith('pendingAnalyses');
    });

    it('should spare the remaining analyses', () => {
      vi.spyOn(storage, 'getPendingAnalyses').mockReturnValue([
        pendingAnalysis,
        newPendingAnalysis,
      ]);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      storage.deletePendingAnalysis('1');
      expect(setItemSpy).toHaveBeenCalledWith(
        'pendingAnalyses',
        JSON.stringify([newPendingAnalysis]),
      );
    });

    it('should not throw on remove item storage error', () => {
      vi.spyOn(storage, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => storage.deletePendingAnalysis('1')).not.toThrow();
    });

    it('should not throw on set item storage error', () => {
      vi.spyOn(storage, 'getPendingAnalyses').mockReturnValue([
        pendingAnalysis,
        newPendingAnalysis,
      ]);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => storage.deletePendingAnalysis('1')).not.toThrow();
    });

    it('should log storage error', () => {
      vi.spyOn(storage, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const errorSpy = vi.spyOn(logger, 'error');
      storage.deletePendingAnalysis('1');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('getPendingAnalyses', () => {
    it('should return pendingAnalyses', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
        JSON.stringify([pendingAnalysis, newPendingAnalysis]),
      );
      const res = storage.getPendingAnalyses();
      expect(res).toEqual([pendingAnalysis, newPendingAnalysis]);
    });

    it('should return null when storage is empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const res = storage.getPendingAnalyses();
      expect(res).toBeNull();
    });

    it('should return null when JSON is invalid', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const res = storage.getPendingAnalyses();
      expect(res).toBeNull();
    });

    it('should clear corrupted data', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
      storage.getPendingAnalyses();
      expect(removeSpy).toHaveBeenCalledWith('pendingAnalyses');
    });

    it('should log parse error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const errorSpy = vi.spyOn(logger, 'error');
      storage.getPendingAnalyses();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to parse pendingAnalyses JSON, clearing corrupted data: ',
        expect.any(SyntaxError),
      );
    });

    it('should not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => storage.getPendingAnalyses()).not.toThrow();
    });

    it('should log storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const errorSpy = vi.spyOn(logger, 'error');
      storage.getPendingAnalyses();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
