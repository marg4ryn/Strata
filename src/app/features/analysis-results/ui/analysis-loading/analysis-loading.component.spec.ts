import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';

import { AnalysisLoadingComponent } from './analysis-loading.component';

describe('AnalysisLoadingComponent', () => {
  let component: AnalysisLoadingComponent;
  let fixture: ComponentFixture<AnalysisLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalysisLoadingComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisLoadingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
