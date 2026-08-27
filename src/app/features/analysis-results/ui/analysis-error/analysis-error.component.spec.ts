import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';

import { AnalysisErrorComponent } from './analysis-error.component';

describe('AnalysisErrorComponent', () => {
  let component: AnalysisErrorComponent;
  let fixture: ComponentFixture<AnalysisErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisErrorComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisErrorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
