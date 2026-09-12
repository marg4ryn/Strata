import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MockService } from 'ng-mocks';

import { LanguageFacade } from './language.facade';
import { LanguageService } from './language/language.service';
import { LanguageStoreService } from './language-store/language-store.service';
import type { LangPreference } from './language.model';

describe('LanguageFacade', () => {
  let service: LanguageFacade;
  let languageService: ReturnType<typeof MockService<LanguageService>>;
  let store: { langPreference: ReturnType<typeof signal<LangPreference>> };

  beforeEach(() => {
    languageService = MockService(LanguageService);
    store = { langPreference: signal('system') };

    TestBed.configureTestingModule({
      providers: [
        { provide: LanguageService, useValue: languageService },
        { provide: LanguageStoreService, useValue: store },
      ],
    });

    service = TestBed.inject(LanguageFacade);
  });

  it('exposes langPreference from the store', () => {
    store.langPreference.set('en');
    expect(service.langPreference()).toBe('en');
  });

  it('delegates loadLangPreference to LanguageService', () => {
    service.loadLangPreference();
    expect(languageService.loadLangPreference).toHaveBeenCalledOnce();
  });

  it('delegates setPreference to LanguageService', () => {
    service.setPreference('en');
    expect(languageService.setPreference).toHaveBeenCalledWith('en');
  });
});
