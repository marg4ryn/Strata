import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LanguageFacade } from './language.facade';
import type { LangPreference } from './language.model';
import { LanguageService } from './service/language.service';
import { LanguageStoreService } from './language-store/language-store.service';

describe('LanguageFacade', () => {
  let service: LanguageFacade;
  let languageService: {
    loadLangPreference: ReturnType<typeof vi.fn>;
    setPreference: ReturnType<typeof vi.fn>;
  };

  let store: {
    langPreference: ReturnType<typeof signal<LangPreference>>;
  };

  beforeEach(() => {
    languageService = {
      loadLangPreference: vi.fn(),
      setPreference: vi.fn(),
    };

    store = {
      langPreference: signal('system'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LanguageService, useValue: languageService },
        { provide: LanguageStoreService, useValue: store },
      ],
    });
    service = TestBed.inject(LanguageFacade);
  });

  const preference = 'en';

  it('updates computed signals', () => {
    store.langPreference.set(preference);
    expect(service.langPreference()).toBe(preference);
  });

  it('handles loadLangPreference', () => {
    service.loadLangPreference();
    expect(languageService.loadLangPreference).toHaveBeenCalledOnce();
  });

  it('handles setPreference', () => {
    service.setPreference(preference);
    expect(languageService.setPreference).toHaveBeenCalledWith(preference);
  });
});
