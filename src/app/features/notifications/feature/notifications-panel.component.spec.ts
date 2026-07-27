import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsPanel } from './notifications-panel.component';

describe('NotificationsPanel', () => {
  let component: NotificationsPanel;
  let fixture: ComponentFixture<NotificationsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
