import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { App } from './app';
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

    const header = fixture.debugElement.query(By.css('app-header'));
    expect(header).toBeTruthy();
  });

  it('renders the footer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const footer = fixture.debugElement.query(By.css('app-footer'));
    expect(footer).toBeTruthy();
  });

  it('renders the router outlet inside the main content area', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const main = fixture.debugElement.query(By.css('main.content'));
    const outlet = main.query(By.css('router-outlet'));
    expect(outlet).toBeTruthy();
  });
});
