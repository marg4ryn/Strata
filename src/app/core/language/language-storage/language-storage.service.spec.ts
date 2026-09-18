import { TestBed } from '@angular/core/testing';
import { MockService } from 'ng-mocks';

import { StorageService } from '@app/core/storage';
import { LoggerService, ContextLogger } from '@app/core/logging';
import { LanguageStorageService } from './language-storage.service';

describe('LanguageStorageService', () => {
  let service: LanguageStorageService;
  let logger: ReturnType<typeof MockService<ContextLogger>>;
  let storage: ReturnType<typeof MockService<StorageService>>;

  const langPreference = 'en';
  const langPreferenceKey = 'langPreference';

  beforeEach(() => {
    logger = MockService(ContextLogger);
    storage = MockService(StorageService);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: loggerService },
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
      expect(logger.debug).toHaveBeenCalledOnce();
    });
  });
});
