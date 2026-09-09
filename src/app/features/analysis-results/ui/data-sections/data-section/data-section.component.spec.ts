import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSectionComponent } from './data-section.component';

describe('DataSectionComponent', () => {
  let component: DataSectionComponent;
  let fixture: ComponentFixture<DataSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
