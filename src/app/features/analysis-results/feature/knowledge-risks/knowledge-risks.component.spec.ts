import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { KnowledgeRisksComponent } from './knowledge-risks.component';

describe('KnowledgeRisksComponent', () => {
  let component: KnowledgeRisksComponent;
  let fixture: ComponentFixture<KnowledgeRisksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeRisksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KnowledgeRisksComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
