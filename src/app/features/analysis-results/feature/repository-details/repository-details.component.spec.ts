import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { RepositoryDetailsComponent } from './repository-details.component';
import {
  CACHE_CONFIG,
  CacheConfig,
} from '../../data-access/analysis-results-cached-fetcher/cache.config';

describe('RepositoryDetailsComponent', () => {
  let component: RepositoryDetailsComponent;
  let fixture: ComponentFixture<RepositoryDetailsComponent>;
  let config: CacheConfig;

  beforeEach(async () => {
    config = {
      maxCaches: 2,
      registryCacheName: 'test-reg',
      registryKey: '/test',
    };

    await TestBed.configureTestingModule({
      imports: [RepositoryDetailsComponent, getTranslocoModule()],
      providers: [{ provide: CACHE_CONFIG, useValue: config }],
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoryDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
