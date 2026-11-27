import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { AbandonedCodeComponent } from './abandoned-code.component';

describe('AbandonedCodeComponent', () => {
  let component: AbandonedCodeComponent;
  let fixture: ComponentFixture<AbandonedCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbandonedCodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AbandonedCodeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
