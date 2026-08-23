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

  const langPreference = 'en';
  const langPreferenceKey = 'langPreference';

  describe('getLangPreference', () => {
    it('returns langPreference', () => {
      storage.getItem.mockReturnValue(langPreference);
      const res = service.getLangPreference();
      expect(res).toBe(langPreference);
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, langPreferenceKey);
    });

    it('returns null when storage is empty', () => {
      storage.getItem.mockReturnValue(null);
      const res = service.getLangPreference();
      expect(res).toBeNull();
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, langPreferenceKey);
    });
  });

  describe('saveLangPreference', () => {
    it('saves langPreference', () => {
      service.saveLangPreference(langPreference);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, langPreferenceKey, langPreference);
    });
  });
});
