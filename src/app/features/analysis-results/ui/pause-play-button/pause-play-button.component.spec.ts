import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco';
import { PausePlayButtonComponent } from './pause-play-button.component';

describe('PausePlayButtonComponent', () => {
  let component: PausePlayButtonComponent;
  let fixture: ComponentFixture<PausePlayButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PausePlayButtonComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(PausePlayButtonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
