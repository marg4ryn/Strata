import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { RepositoryDetailsComponent } from './repository-details.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';

describe('RepositoryDetailsComponent', () => {
  let component: RepositoryDetailsComponent;
  let fixture: ComponentFixture<RepositoryDetailsComponent>;
  let facade: { getRepositorySummary: Mock };

  beforeEach(async () => {
    facade = { getRepositorySummary: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RepositoryDetailsComponent, getTranslocoModule()],
      providers: [{ provide: AnalysisResultsFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoryDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
