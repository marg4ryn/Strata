import { ComponentFixture, TestBed } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { AnalysisNotFoundComponent } from './analysis-not-found.component';

describe('AnalysisNotFoundComponent', () => {
  let component: AnalysisNotFoundComponent;
  let fixture: ComponentFixture<AnalysisNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisNotFoundComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisNotFoundComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
