import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { App } from './app';
import {
  CACHE_CONFIG,
  CacheConfig,
} from './features/analysis-results/data-access/analysis-results-cached-fetcher/cache.config';

describe('App', () => {
  let config: CacheConfig;

  beforeEach(async () => {
    config = {
      maxCaches: 2,
      registryCacheName: 'test-reg',
      registryKey: '/test',
    };

    await TestBed.configureTestingModule({
      imports: [App, getTranslocoModule()],
      providers: [provideRouter([]), { provide: CACHE_CONFIG, useValue: config }],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
