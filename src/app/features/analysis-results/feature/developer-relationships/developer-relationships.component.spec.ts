import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { getTranslocoModule } from '@app/core/transloco';
import { DeveloperRelationshipsComponent } from './developer-relationships.component';
import { AnalysisResultsFacade } from '../../analysis-results.facade';

describe('DeveloperRelationshipsComponent', () => {
  let component: DeveloperRelationshipsComponent;
  let fixture: ComponentFixture<DeveloperRelationshipsComponent>;
  let facade: { getRepositorySummary: Mock };

  beforeEach(async () => {
    facade = { getRepositorySummary: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DeveloperRelationshipsComponent, getTranslocoModule()],
      providers: [{ provide: AnalysisResultsFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperRelationshipsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
