import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { Header } from './header.component';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  let notifications: {
    unreadNotificationsCount: ReturnType<typeof signal<number>>;
    showPanel: ReturnType<typeof signal<boolean>>;
    openPanel: ReturnType<typeof vi.fn>;
    closePanel: ReturnType<typeof vi.fn>;
    loadNotifications: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    notifications = {
      unreadNotificationsCount: signal(0),
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
    fixture.detectChanges();
  });

  function getButtons() {
    const root: HTMLElement = fixture.nativeElement;
    return {
      startNewAnalysis: root.querySelector<HTMLButtonElement>(
        '[aria-label="Start a new analysis"]',
      )!,
      notifications: root.querySelector<HTMLButtonElement>('[aria-label="Notifications"]')!,
      history: root.querySelector<HTMLButtonElement>('[aria-label="Analysis history"]')!,
      profile: root.querySelector<HTMLButtonElement>('[aria-label="Your profile"]')!,
      settings: root.querySelector<HTMLButtonElement>('[aria-label="Settings"]')!,
    };
  }

  it('calls loadNotifications on init', () => {
    expect(notifications.loadNotifications).toHaveBeenCalledOnce();
  });

  describe('notifications button state', () => {
    it('reflects showPanel in aria-expanded and active class', () => {
      const btn = getButtons().notifications;
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(btn.classList.contains('header__action--active')).toBeFalsy();

      notifications.showPanel.set(true);
      fixture.detectChanges();

      expect(btn.getAttribute('aria-expanded')).toBe('true');
      expect(btn.classList.contains('header__action--active')).toBeTruthy();
    });

    it('does not render badge when unread count is 0', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.header__action-badge')).toBeNull();
    });

    it('renders unread count in badge', () => {
      notifications.unreadNotificationsCount.set(5);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.header__action-badge');
      expect(badge?.textContent?.trim()).toBe('5');
    });

    it('renders "99+" when unread count exceeds 99', () => {
      notifications.unreadNotificationsCount.set(150);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.header__action-badge');
      expect(badge?.textContent?.trim()).toBe('99+');
    });
  });

  describe('toggleNotificationsPanel', () => {
    it('opens panel when closed', () => {
      getButtons().notifications.click();
      expect(notifications.openPanel).toHaveBeenCalledOnce();
      expect(notifications.closePanel).not.toHaveBeenCalled();
    });

    it('closes panel and refocuses button when open', () => {
      notifications.showPanel.set(true);
      fixture.detectChanges();

      const btn = getButtons().notifications;
      const focusSpy = vi.spyOn(btn, 'focus');

      btn.click();

      expect(notifications.closePanel).toHaveBeenCalledOnce();
      expect(focusSpy).toHaveBeenCalledOnce();
    });
  });
});
