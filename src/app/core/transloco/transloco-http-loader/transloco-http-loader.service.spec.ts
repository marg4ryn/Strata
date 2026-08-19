import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TranslocoHttpLoaderService } from './transloco-http-loader.service';

describe('TranslocoHttpLoaderService', () => {
  let service: TranslocoHttpLoaderService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslocoHttpLoaderService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TranslocoHttpLoaderService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads translation for given language', () => {
    const translation = {
      hello: 'Hello',
      goodbye: 'Goodbye',
    };

    service.getTranslation('en').subscribe((result) => {
      expect(result).toEqual(translation);
    });

    const request = httpTesting.expectOne('/assets/i18n/en.json');

    expect(request.request.method).toBe('GET');

    request.flush(translation);
  });
});
