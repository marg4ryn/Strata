import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { CodeCityComponent } from './code-city.component';

describe.skip('CodeCityComponent', () => {
  let component: CodeCityComponent;
  let fixture: ComponentFixture<CodeCityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeCityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeCityComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
