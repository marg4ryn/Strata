import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataListSectionComponent } from './data-list-section.component';

describe('DataListSectionComponent', () => {
  let component: DataListSectionComponent;
  let fixture: ComponentFixture<DataListSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataListSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataListSectionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
