import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import type { Translation } from '@jsverse/transloco';
import { MockService } from 'ng-mocks';
import { of } from 'rxjs';

import { LoggerService } from '@app/core/logging/logger.service';
import { LanguageService } from './language.service';
import { LanguageStoreService } from '../language-store/language-store.service';
import { LanguageStorageService } from '../language-storage/language-storage.service';
import { BrowserLanguageService } from '../browser-language/browser-language.service';
import type { LangPreference } from '../language.model';

describe('LanguageService', () => {
  let service: LanguageService;
  let logger: ReturnType<typeof MockService<LoggerService>>;
  let storage: ReturnType<typeof MockService<LanguageStorageService>>;
  let browser: ReturnType<typeof MockService<BrowserLanguageService>>;
  let transloco: ReturnType<typeof MockService<TranslocoService>>;
  let meta: ReturnType<typeof MockService<Meta>>;
  let store: { langPreference: ReturnType<typeof signal<LangPreference>> };

  beforeEach(() => {
    logger = MockService(LoggerService);
    storage = MockService(LanguageStorageService);
    browser = MockService(BrowserLanguageService);
    transloco = MockService(TranslocoService);
    meta = MockService(Meta);
    store = { langPreference: signal('system') };

    vi.mocked(transloco.load).mockReturnValue(of({} as Translation));

    TestBed.configureTestingModule({
      providers: [
        { provide: LanguageStoreService, useValue: store },
        { provide: LanguageStorageService, useValue: storage },
        { provide: BrowserLanguageService, useValue: browser },
        { provide: TranslocoService, useValue: transloco },
        { provide: LoggerService, useValue: logger },
        { provide: Meta, useValue: meta },
      ],
    });

    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadLangPreference', () => {
    it('loads langPreference from storage', () => {
      vi.mocked(storage.getLangPreference).mockReturnValue('en');
      service.loadLangPreference();
      expect(store.langPreference()).toBe('en');
      expect(transloco.load).toHaveBeenCalledWith('en');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('en');
      expect(storage.saveLangPreference).not.toHaveBeenCalled();
    });

    it('uses browser language when langPreference is "system"', () => {
      vi.mocked(storage.getLangPreference).mockReturnValue('system');
      vi.mocked(browser.getLang).mockReturnValue('pl');
      service.loadLangPreference();
      expect(store.langPreference()).toBe('system');
      expect(transloco.load).toHaveBeenCalledWith('pl');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('pl');
      expect(storage.saveLangPreference).not.toHaveBeenCalled();
    });

    it('uses browser language when storage is empty', () => {
      vi.mocked(storage.getLangPreference).mockReturnValue(null);
      vi.mocked(browser.getLang).mockReturnValue('pl');
      service.loadLangPreference();
      expect(store.langPreference()).toBe('system');
      expect(transloco.load).toHaveBeenCalledWith('pl');
      expect(storage.saveLangPreference).not.toHaveBeenCalled();
    });

    it('sets active lang only after translations are loaded', () => {
      vi.mocked(storage.getLangPreference).mockReturnValue('en');
      const callOrder: string[] = [];
      vi.mocked(transloco.load).mockImplementation(() => {
        callOrder.push('load');
        return of({} as Translation);
      });
      vi.mocked(transloco.setActiveLang).mockImplementation(() => {
        callOrder.push('setActiveLang');
        return transloco;
      });
      service.loadLangPreference();
      expect(callOrder).toEqual(['load', 'setActiveLang']);
    });

    it('falls back to empty string for meta description when translation is missing', () => {
      vi.mocked(storage.getLangPreference).mockReturnValue('en');
      vi.mocked(transloco.translate).mockReturnValue(undefined);
      service.loadLangPreference();
      expect(meta.updateTag).toHaveBeenCalledWith({ name: 'description', content: '' });
    });
  });

  describe('setPreference', () => {
    it('saves preference and applies exact language', () => {
      service.setPreference('pl');
      expect(storage.saveLangPreference).toHaveBeenCalledWith('pl');
      expect(store.langPreference()).toBe('pl');
      expect(transloco.load).toHaveBeenCalledWith('pl');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('pl');
    });

    it('resolves browser language when preference is "system"', () => {
      vi.mocked(browser.getLang).mockReturnValue('en');
      service.setPreference('system');
      expect(storage.saveLangPreference).toHaveBeenCalledWith('system');
      expect(store.langPreference()).toBe('system');
      expect(transloco.load).toHaveBeenCalledWith('en');
      expect(transloco.setActiveLang).toHaveBeenCalledWith('en');
    });

    it('falls back to "system" for an invalid preference and logs a warning', () => {
      vi.mocked(browser.getLang).mockReturnValue('pl');
      service.setPreference('fr' as unknown as LangPreference);
      expect(storage.saveLangPreference).toHaveBeenCalledWith('system');
      expect(store.langPreference()).toBe('system');
      expect(transloco.load).toHaveBeenCalledWith('pl');
      expect(logger.warn).toHaveBeenCalledOnce();
    });
  });
});
