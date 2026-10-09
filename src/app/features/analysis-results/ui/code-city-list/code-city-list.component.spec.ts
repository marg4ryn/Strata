import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { CodeCityListComponent } from './code-city-list.component';

describe.skip('CodeCityListComponent', () => {
  let component: CodeCityListComponent;
  let fixture: ComponentFixture<CodeCityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeCityListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeCityListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
