import { TestBed } from '@angular/core/testing';

import { StorageService } from '@app/core/storage/storage.service';
import { LoggerService } from '@app/core/logging/logger.service';
import { LanguageStorageService } from './language-storage.service';

describe('LanguageStorageService', () => {
  let service: LanguageStorageService;
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
    service = TestBed.inject(LanguageStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const langPref = 'en';
  const langPrefKey = 'langPref';

  describe('getLangPref', () => {
    it('returns langPref', () => {
      storage.getItem.mockReturnValue(langPref);
      const res = service.getLangPref();
      expect(res).toBe(langPref);
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, langPrefKey);
    });

    it('returns null when storage is empty', () => {
      storage.getItem.mockReturnValue(null);
      const res = service.getLangPref();
      expect(res).toBeNull();
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, langPrefKey);
    });
  });

  describe('saveLangPref', () => {
    it('saves langPref', () => {
      service.saveLangPref(langPref);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, langPrefKey, langPref);
    });
  });
});
