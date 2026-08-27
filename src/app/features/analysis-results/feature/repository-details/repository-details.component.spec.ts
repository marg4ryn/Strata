import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';

import { RepositoryDetailsComponent } from './repository-details.component';

describe('RepositoryDetailsComponent', () => {
  let component: RepositoryDetailsComponent;
  let fixture: ComponentFixture<RepositoryDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryDetailsComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoryDetailsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
