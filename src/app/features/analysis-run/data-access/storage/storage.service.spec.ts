import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { StorageService } from './storage.service';
import { PendingAnalysis, AnalysisTarget, DateRange } from '../../analysis-run.model';

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

  describe('saveSessionId', () => {
    it('saves sessionId', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.saveSessionId('123');
      expect(setItemSpy).toHaveBeenCalledWith('sessionId', '123');
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.saveSessionId('123')).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.saveSessionId('123');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteSessionId', () => {
    it('removes storage item', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.deleteSessionId();
      expect(removeItemSpy).toHaveBeenCalledWith('sessionId');
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.deleteSessionId()).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.deleteSessionId();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getSessionId', () => {
    it('returns sessionId', () => {
      const sessionId = '123';
      const getItemspy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(sessionId);
      const res = service.getSessionId();
      expect(res).toBe(sessionId);
      expect(getItemspy).toHaveBeenCalledWith('sessionId');
    });

    it('returns null when storage is empty', () => {
      const getItemspy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const res = service.getSessionId();
      expect(res).toBeNull();
      expect(getItemspy).toHaveBeenCalledWith('sessionId');
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.getSessionId()).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.getSessionId();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  const range: DateRange = {
    startDate: '2000-01-01',
    endDate: '2000-01-01',
    timezone: 'Europe/Warsaw',
  };
  const target: AnalysisTarget = {
    targetURL: 'https://example.com/Project.git',
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
    it('saves pendingAnalysis when storage is empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.savePendingAnalysis(pendingAnalysis);
      expect(setItemSpy).toHaveBeenCalledWith('pendingAnalyses', JSON.stringify([pendingAnalysis]));
    });

    it('pushes pendingAnalysis to remaining analyses when storage is not empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify([pendingAnalysis]));
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.savePendingAnalysis(newPendingAnalysis);
      expect(setItemSpy).toHaveBeenCalledWith(
        'pendingAnalyses',
        JSON.stringify([pendingAnalysis, newPendingAnalysis]),
      );
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.savePendingAnalysis(pendingAnalysis)).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.savePendingAnalysis(pendingAnalysis);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deletePendingAnalysis', () => {
    it('returns when pendingAnalyses was empty', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue(null);
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.deletePendingAnalysis('1');
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('removes storage item when analysis was the only', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.deletePendingAnalysis('1');
      expect(removeItemSpy).toHaveBeenCalledWith('pendingAnalyses');
    });

    it('spares the remaining analyses', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([
        pendingAnalysis,
        newPendingAnalysis,
      ]);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      service.deletePendingAnalysis('1');
      expect(setItemSpy).toHaveBeenCalledWith(
        'pendingAnalyses',
        JSON.stringify([newPendingAnalysis]),
      );
    });

    it('does not throw on storage error', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([
        pendingAnalysis,
        newPendingAnalysis,
      ]);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.deletePendingAnalysis('1')).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.deletePendingAnalysis('1');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getPendingAnalyses', () => {
    it('returns pendingAnalyses', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
        JSON.stringify([pendingAnalysis, newPendingAnalysis]),
      );
      const res = service.getPendingAnalyses();
      expect(res).toEqual([pendingAnalysis, newPendingAnalysis]);
    });

    it('returns null when storage is empty', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const res = service.getPendingAnalyses();
      expect(res).toBeNull();
    });

    it('returns null when JSON is invalid', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const res = service.getPendingAnalyses();
      expect(res).toBeNull();
    });

    it('clears corrupted data', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.getPendingAnalyses();
      expect(removeSpy).toHaveBeenCalledWith('pendingAnalyses');
    });

    it('logs parse error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      service.getPendingAnalyses();
      expect(logger.error).toHaveBeenCalled();
    });

    it('does not throw on storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.getPendingAnalyses()).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.getPendingAnalyses();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('removePendingAnalysesItem', () => {
    it('removes storage item', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      service.removePendingAnalysesItem();
      expect(removeItemSpy).toHaveBeenCalledWith('pendingAnalyses');
    });

    it('does not throw on storage error', () => {
      vi.spyOn(service, 'getPendingAnalyses').mockReturnValue([pendingAnalysis]);
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(() => service.removePendingAnalysesItem()).not.toThrow();
    });

    it('logs storage error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      service.removePendingAnalysesItem();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
