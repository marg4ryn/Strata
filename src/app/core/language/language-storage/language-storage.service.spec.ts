import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { StorageService } from '@app/core/storage/storage.service';
import { LoggerService } from '@app/core/logging/logger.service';
import { LanguageStorageService } from './language-storage.service';

describe('LanguageStorageService', () => {
  let service: LanguageStorageService;
  let logger: ReturnType<typeof MockService<LoggerService>>;
  let storage: ReturnType<typeof MockService<StorageService>>;

  const langPreference = 'en';
  const langPreferenceKey = 'langPreference';

  beforeEach(() => {
    logger = MockService(LoggerService);
    storage = MockService(StorageService);

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

  describe('getLangPreference', () => {
    it('returns langPreference read from storage', () => {
      vi.mocked(storage.getItem).mockReturnValue(langPreference);
      const res = service.getLangPreference();
      expect(res).toBe(langPreference);
      expect(storage.getItem).toHaveBeenCalledWith(localStorage, langPreferenceKey);
      expect(logger.debug).toHaveBeenCalledOnce();
    });

    it('returns null when storage is empty', () => {
      vi.mocked(storage.getItem).mockReturnValue(null);
      expect(service.getLangPreference()).toBeNull();
    });
  });

  describe('saveLangPreference', () => {
    it('saves langPreference to storage', () => {
      service.saveLangPreference(langPreference);
      expect(storage.setItem).toHaveBeenCalledWith(localStorage, langPreferenceKey, langPreference);
      expect(logger.info).toHaveBeenCalledOnce();
    });
  });
});
