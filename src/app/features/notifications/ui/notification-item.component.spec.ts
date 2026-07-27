import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationItem } from './notification-item.component';

describe.skip('NotificationItem', () => {
  let component: NotificationItem;
  let fixture: ComponentFixture<NotificationItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationItem],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
