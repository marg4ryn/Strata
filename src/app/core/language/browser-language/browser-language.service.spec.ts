import { TestBed } from '@angular/core/testing';

import { BrowserLanguageService } from './browser-language.service';

describe('BrowserLanguageService', () => {
  let service: BrowserLanguageService;

  beforeEach(() => {
    service = TestBed.inject(BrowserLanguageService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns browser language when it is available', () => {
    vi.stubGlobal('navigator', {
      language: 'pl-PL',
    });
    expect(service.getLang(['en', 'pl'], 'en')).toBe('pl');
  });

  it('uses only the language part', () => {
    vi.stubGlobal('navigator', {
      language: 'en-US',
    });
    expect(service.getLang(['en'], 'en')).toBe('en');
  });

  it('returns fallback when browser language is not available', () => {
    vi.stubGlobal('navigator', {
      language: 'pl-PL',
    });
    expect(service.getLang(['en'], 'en')).toBe('en');
  });

  it('returns fallback when navigator.language does not exist', () => {
    vi.stubGlobal('navigator', {});
    expect(service.getLang(['en', 'pl'], 'en')).toBe('en');
  });
});
