import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { NotificationPanel } from '@app/features/notifications/feature/notification-panel.component';
import { AnalysisHistoryFacade } from '@app/features/analysis-history/analysis-history.facade';
import { AnalysisHistoryPanel } from '@app/features/analysis-history/feature/analysis-history-panel.component';
import { Header } from './header.component';

@Component({ selector: 'app-notification-panel', template: '', standalone: true })
class StubNotificationPanel {}

@Component({ selector: 'app-analysis-history-panel', template: '', standalone: true })
class StubAnalysisHistoryPanel {}

function fakeEmitter<T>() {
  const listeners: Array<(v: T) => void> = [];
  return {
    subscribe: (cb: (v: T) => void) => {
      listeners.push(cb);
      return { unsubscribe: () => {} };
    },
    emit: (v: T) => listeners.forEach((cb) => cb(v)),
  };
}

function fakeOverlayRef() {
  const outside = fakeEmitter<PointerEvent>();
  const keydown = fakeEmitter<KeyboardEvent>();
  return {
    attach: vi.fn(),
    dispose: vi.fn(),
    outsidePointerEvents: () => outside,
    keydownEvents: () => keydown,
    _outside: outside,
    _keydown: keydown,
  } as unknown as OverlayRef & {
    _outside: ReturnType<typeof fakeEmitter<PointerEvent>>;
    _keydown: ReturnType<typeof fakeEmitter<KeyboardEvent>>;
  };
}

describe.skip('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let overlayCreate: ReturnType<typeof vi.fn>;

  let notifications: {
    unreadNotificationsCount: ReturnType<typeof signal<number>>;
    showPanel: ReturnType<typeof signal<boolean>>;
    openPanel: ReturnType<typeof vi.fn>;
    closePanel: ReturnType<typeof vi.fn>;
  };

  let history: {
    showPanel: ReturnType<typeof signal<boolean>>;
    openPanel: ReturnType<typeof vi.fn>;
    closePanel: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    notifications = {
      unreadNotificationsCount: signal(0),
      showPanel: signal(false),
      openPanel: vi.fn().mockImplementation(() => notifications.showPanel.set(true)),
      closePanel: vi.fn().mockImplementation(() => notifications.showPanel.set(false)),
    };

    history = {
      showPanel: signal(false),
      openPanel: vi.fn().mockImplementation(() => history.showPanel.set(true)),
      closePanel: vi.fn().mockImplementation(() => history.showPanel.set(false)),
    };

    overlayCreate = vi.fn(() => fakeOverlayRef());

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: NotificationsFacade, useValue: notifications },
        { provide: AnalysisHistoryFacade, useValue: history },
        {
          provide: Overlay,
          useValue: {
            create: overlayCreate,
            position: () => ({
              global: () => ({ top: () => ({ right: () => ({}) }) }),
            }),
          },
        },
      ],
    })
      .overrideComponent(Header, {
        remove: { imports: [NotificationPanel, AnalysisHistoryPanel] },
        add: { imports: [StubNotificationPanel, StubAnalysisHistoryPanel] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

  function getButtons() {
    const root: HTMLElement = fixture.nativeElement;
    return {
      notifications: root.querySelector<HTMLButtonElement>('[aria-label="Notifications"]')!,
      history: root.querySelector<HTMLButtonElement>('[aria-label="Analysis history"]')!,
    };
  }

  async function flush() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function refAt(index: number) {
    return overlayCreate.mock.results[index].value as ReturnType<typeof fakeOverlayRef>;
  }

  describe('notifications button state', () => {
    it('reflects showPanel in aria-expanded and active class', () => {
      const btn = getButtons().notifications;
      expect(btn.getAttribute('aria-expanded')).toBe('false');

      notifications.showPanel.set(true);
      fixture.detectChanges();

      expect(btn.getAttribute('aria-expanded')).toBe('true');
      expect(btn.classList.contains('header__action--active')).toBeTruthy();
    });

    it('renders unread count / 99+ badge', () => {
      notifications.unreadNotificationsCount.set(5);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.header__action-badge')?.textContent?.trim(),
      ).toBe('5');

      notifications.unreadNotificationsCount.set(150);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.header__action-badge')?.textContent?.trim(),
      ).toBe('99+');
    });
  });

  describe('toggle*Panel', () => {
    it('opens notifications panel when closed', () => {
      getButtons().notifications.click();
      expect(notifications.openPanel).toHaveBeenCalledOnce();
    });

    it('closes notifications panel and refocuses button when open', async () => {
      notifications.showPanel.set(true);
      await flush();

      const btn = getButtons().notifications;
      const focusSpy = vi.spyOn(btn, 'focus');

      btn.click();
      expect(notifications.closePanel).toHaveBeenCalledOnce();

      await flush();
      expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('closes history panel when opening notifications (closeOthers)', () => {
      getButtons().notifications.click();

      expect(history.closePanel).toHaveBeenCalledOnce();
      expect(notifications.openPanel).toHaveBeenCalledOnce();
    });

    it('closes notifications panel when opening history (closeOthers)', () => {
      getButtons().history.click();

      expect(notifications.closePanel).toHaveBeenCalledOnce();
      expect(history.openPanel).toHaveBeenCalledOnce();
    });
  });

  describe('overlay attach/detach (effect)', () => {
    it('creates and attaches overlay when showPanel becomes true, disposes on false', async () => {
      notifications.showPanel.set(true);
      await flush();

      expect(overlayCreate).toHaveBeenCalledOnce();
      const ref = refAt(0);
      expect(ref.attach).toHaveBeenCalledOnce();

      notifications.showPanel.set(false);
      await flush();

      expect(ref.dispose).toHaveBeenCalledOnce();
    });

    it('closes panel on Escape keydown from overlay', async () => {
      notifications.showPanel.set(true);
      await flush();

      const ref = refAt(0);
      ref._keydown.emit(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(notifications.closePanel).toHaveBeenCalledOnce();
    });

    it('ignores Escape-unrelated keys', async () => {
      notifications.showPanel.set(true);
      await flush();

      const ref = refAt(0);
      ref._keydown.emit(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(notifications.closePanel).not.toHaveBeenCalled();
    });

    it('closes panel on outside pointer event, ignores click on trigger', async () => {
      notifications.showPanel.set(true);
      await flush();

      const ref = refAt(0);
      const btn = getButtons().notifications;

      ref._outside.emit({ target: btn } as unknown as PointerEvent);
      expect(notifications.closePanel).not.toHaveBeenCalled();

      ref._outside.emit({ target: document.body } as unknown as PointerEvent);
      expect(notifications.closePanel).toHaveBeenCalledOnce();
    });

    it('refocuses trigger button after detach', async () => {
      notifications.showPanel.set(true);
      await flush();
      const btn = getButtons().notifications;
      const focusSpy = vi.spyOn(btn, 'focus');

      notifications.showPanel.set(false);
      await flush();

      expect(focusSpy).toHaveBeenCalledOnce();
    });
  });
});
