import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';

export interface HttpRequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

@Service()
export class HttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(this.buildUrl(path), {
        params: this.buildParams(options?.params),
        headers: options?.headers,
      }),
    );
  }

  post<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(this.buildUrl(path), body, {
        params: this.buildParams(options?.params),
        headers: options?.headers,
      }),
    );
  }

  put<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T> {
    return firstValueFrom(
      this.http.put<T>(this.buildUrl(path), body, {
        params: this.buildParams(options?.params),
        headers: options?.headers,
      }),
    );
  }

  delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return firstValueFrom(
      this.http.delete<T>(this.buildUrl(path), {
        params: this.buildParams(options?.params),
        headers: options?.headers,
      }),
    );
  }

  private buildUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  private buildParams(params?: Record<string, string | number | boolean>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
