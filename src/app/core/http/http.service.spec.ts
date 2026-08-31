import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { HttpService } from './http.service';

describe('HttpService', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('get', () => {
    it('sends GET request to the correct URL built from baseUrl and path', async () => {
      const mockResponse = { id: 1, name: 'test' };

      const promise = service.get<{ id: number; name: string }>('/users/1');

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      await expect(promise).resolves.toEqual(mockResponse);
    });

    it('adds "/" prefix to path without a leading slash', async () => {
      const promise = service.get('users/1');

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      req.flush({});

      await promise;
    });

    it('serializes params correctly into the query string', async () => {
      const promise = service.get('/users', {
        params: { page: 2, limit: 10, active: true },
      });

      const req = httpMock.expectOne(
        (r) =>
          r.url === `${environment.apiUrl}/users` &&
          r.params.get('page') === '2' &&
          r.params.get('limit') === '10' &&
          r.params.get('active') === 'true',
      );
      req.flush([]);

      await promise;
    });

    it('passes custom headers', async () => {
      const promise = service.get('/users', {
        headers: { 'X-Custom-Header': 'value' },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.headers.get('X-Custom-Header')).toBe('value');
      req.flush({});

      await promise;
    });

    it('rejects the promise on HTTP error', async () => {
      const promise = service.get('/users/999');

      const req = httpMock.expectOne(`${environment.apiUrl}/users/999`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('post', () => {
    it('sends POST request with body', async () => {
      const body = { name: 'nowy user' };
      const promise = service.post('/users', body);

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 1, ...body });

      await promise;
    });
  });

  describe('put', () => {
    it('sends PUT request with body', async () => {
      const body = { name: 'zaktualizowany' };
      const promise = service.put('/users/1', body);

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush(body);

      await promise;
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      const promise = service.delete('/users/1');

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      req.flush(null);

      await promise;
    });
  });
});
