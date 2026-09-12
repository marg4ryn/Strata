import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TranslocoLoaderService } from './transloco-loader.service';

describe('TranslocoLoaderService', () => {
  let service: TranslocoLoaderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TranslocoLoaderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches translation file for given lang', () => {
    const mockTranslation = { hello: 'world' };

    service.getTranslation('en').subscribe((res) => {
      expect(res).toEqual(mockTranslation);
    });

    const req = httpMock.expectOne('/assets/i18n/en.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockTranslation);
  });
});
