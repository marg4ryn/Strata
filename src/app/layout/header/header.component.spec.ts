import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { Header } from './header.component';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  let notifications: {
    showPanel: ReturnType<typeof signal<boolean>>;
    openPanel: ReturnType<typeof vi.fn>;
    closePanel: ReturnType<typeof vi.fn>;
    loadNotifications: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    notifications = {
      showPanel: signal(false),
      openPanel: vi.fn(),
      closePanel: vi.fn(),
      loadNotifications: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [{ provide: NotificationsFacade, useValue: notifications }],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function getButtons(): {
    startNewAnalysis: HTMLButtonElement;
    notifications: HTMLButtonElement;
    history: HTMLButtonElement;
    profile: HTMLButtonElement;
    settings: HTMLButtonElement;
  } {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    return {
      startNewAnalysis: buttons[0],
      notifications: buttons[1],
      history: buttons[2],
      profile: buttons[3],
      settings: buttons[4],
    };
  }

  it('calls loadNotifications on init', () => {
    fixture.detectChanges();
    expect(notifications.loadNotifications).toHaveBeenCalledOnce();
  });

  it('calls notification facade when notifications button is clicked', () => {
    getButtons().notifications.click();
    expect(notifications.openPanel).toHaveBeenCalledOnce();
    notifications.showPanel.set(true);
    getButtons().notifications.click();
    expect(notifications.closePanel).toHaveBeenCalledOnce();
    notifications.showPanel.set(false);
    getButtons().notifications.click();
    expect(notifications.openPanel).toHaveBeenCalledTimes(2);
  });
});
