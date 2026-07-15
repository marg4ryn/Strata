import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPanel } from './info-panel.component';

describe('InfoPanel', () => {
  let component: InfoPanel;
  let fixture: ComponentFixture<InfoPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
