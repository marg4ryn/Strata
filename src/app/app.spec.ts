import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ngMocks } from 'ng-mocks';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { App } from './app';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { CACHE_CONFIG } from './features/analysis-results/data-access/analysis-results-cached-fetcher/cache.config';
import type { CacheConfig } from './features/analysis-results/data-access/analysis-results-cached-fetcher/cache.config';

describe('App', () => {
  const config: CacheConfig = {
    maxCaches: 2,
    registryCacheName: 'test-reg',
    registryKey: '/test',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, getTranslocoModule()],
      providers: [provideRouter([]), { provide: CACHE_CONFIG, useValue: config }],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the header', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(ngMocks.find(fixture, HeaderComponent)).toBeTruthy();
  });

  it('renders the footer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(ngMocks.find(fixture, FooterComponent)).toBeTruthy();
  });

  it('renders the router outlet inside the main content area', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const main = ngMocks.find(fixture, 'main.app-content');
    expect(ngMocks.find(main, 'router-outlet')).toBeTruthy();
  });
});
