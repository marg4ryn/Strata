import { TestBed } from '@angular/core/testing';

import { LanguageStoreService } from './language-store.service';

describe('LanguageStoreService', () => {
  let service: LanguageStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageStoreService);
  });

  it('defaults the langPreference signal to "system"', () => {
    expect(service.langPreference()).toBe('system');
  });
});
