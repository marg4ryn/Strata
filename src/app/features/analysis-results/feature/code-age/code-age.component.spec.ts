import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { CodeAgeComponent } from './code-age.component';

describe('CodeAgeComponent', () => {
  let component: CodeAgeComponent;
  let fixture: ComponentFixture<CodeAgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeAgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeAgeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
