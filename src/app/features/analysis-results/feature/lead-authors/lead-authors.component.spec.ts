import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { LeadAuthorsComponent } from './lead-authors.component';

describe('LeadAuthorsComponent', () => {
  let component: LeadAuthorsComponent;
  let fixture: ComponentFixture<LeadAuthorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadAuthorsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadAuthorsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
