import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoryDetails } from './repository-details.component';

describe('RepositoryDetails', () => {
  let component: RepositoryDetails;
  let fixture: ComponentFixture<RepositoryDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoryDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
