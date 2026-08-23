import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import type { LangPreference } from '../language.model';
import { LanguageService } from './language.service';
import { LanguageStoreService } from '../language-store/language-store.service';
import { LanguageStorageService } from '../language-storage/language-storage.service';
import { BrowserLanguageService } from '../browser-language/browser-language.service';
import { TranslocoService } from '@ngneat/transloco';

describe('LanguageService', () => {
  let service: LanguageService;
  let logger: Partial<LoggerService>;

  let store: {
    langPreference: ReturnType<typeof signal<LangPreference>>;
  };

  let storage: {
    getLangPreference: ReturnType<typeof vi.fn>;
    saveLangPreference: ReturnType<typeof vi.fn>;
  };

  let browser: {
    getLang: ReturnType<typeof vi.fn>;
  };

  let transloco: {
    setActiveLang: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      langPreference: signal('system'),
    };

    storage = {
      getLangPreference: vi.fn(),
      saveLangPreference: vi.fn(),
    };

    browser = {
      getLang: vi.fn(),
    };

    transloco = {
      setActiveLang: vi.fn(),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LanguageStoreService, useValue: store },
        { provide: LanguageStorageService, useValue: storage },
        { provide: BrowserLanguageService, useValue: browser },
        { provide: TranslocoService, useValue: transloco },
        { provide: LoggerService, useValue: logger },
      ],
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadLangPreference', () => {
    it('loads langPreference from localStorage', () => {
      const langPreference = 'en';
      storage.getLangPreference.mockReturnValue(langPreference);
      service.loadLangPreference();
      expect(store.langPreference()).toBe(langPreference);
      expect(transloco.setActiveLang).toHaveBeenCalledWith(langPreference);
    });

    it('uses browser language when langPreference is "system"', () => {
      storage.getLangPreference.mockReturnValue('system');
      browser.getLang.mockReturnValue('pl');
      service.loadLangPreference();
      expect(store.langPreference()).toBe('system');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('pl');
    });

    it('uses browser language when localStorage is empty', () => {
      storage.getLangPreference.mockReturnValue(null);
      browser.getLang.mockReturnValue('pl');
      service.loadLangPreference();
      expect(store.langPreference()).toBe('system');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('pl');
    });

    it('does not write back to storage on load', () => {
      storage.getLangPreference.mockReturnValue('en');
      service.loadLangPreference();
      expect(storage.saveLangPreference).not.toHaveBeenCalled();
    });
  });

  describe('setPreference', () => {
    it('saves preference and applies exact language', () => {
      const langPreference = 'pl';
      service.setPreference(langPreference);
      expect(storage.saveLangPreference).toHaveBeenCalledWith(langPreference);
      expect(store.langPreference()).toBe(langPreference);
      expect(transloco.setActiveLang).toHaveBeenCalledWith(langPreference);
    });

    it('resolves browser language when preference is "system"', () => {
      browser.getLang.mockReturnValue('en');
      service.setPreference('system');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('en');
    });

    it('falls back to "system" for an invalid preference', () => {
      browser.getLang.mockReturnValue('pl');
      service.setPreference('fr' as unknown as LangPreference);
      expect(storage.saveLangPreference).toHaveBeenCalledWith('system');
      expect(store.langPreference()).toBe('system');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('pl');
    });
  });
});
