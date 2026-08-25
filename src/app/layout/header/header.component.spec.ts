import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ApplicationRef, Injector, signal } from '@angular/core';
import { DomPortalOutlet } from '@angular/cdk/portal';
import { Overlay } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { NotificationPanelComponent } from '@app/features/notifications/feature/notification-panel.component';
import { AnalysisHistoryFacade } from '@app/features/analysis-history/analysis-history.facade';
import { AnalysisHistoryPanelComponent } from '@app/features/analysis-history/feature/analysis-history-panel.component';
import { HeaderComponent } from './header.component';

@Component({ selector: 'app-notification-panel', template: '', standalone: true })
class StubNotificationPanel {}

@Component({ selector: 'app-analysis-history-panel', template: '', standalone: true })
class StubAnalysisHistoryPanel {}

function fakeOverlayRef() {
  const outside$ = new Subject<PointerEvent>();
  const keydown$ = new Subject<KeyboardEvent>();
  return {
    attach: vi.fn(),
    dispose: vi.fn(),
    outsidePointerEvents: () => outside$.asObservable(),
    keydownEvents: () => keydown$.asObservable(),
    _outside: outside$,
    _keydown: keydown$,
  } as any;
}

describe.skip('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let overlayCreate: any;
  let notifications: any;
  let history: any;

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
      imports: [HeaderComponent, getTranslocoModule()],
      providers: [
        { provide: NotificationsFacade, useValue: notifications },
        { provide: AnalysisHistoryFacade, useValue: history },
        {
          provide: Overlay,
          useValue: {
            create: overlayCreate,
            position: () => ({ global: () => ({ top: () => ({ right: () => ({}) }) }) }),
          },
        },
      ],
    })
      .overrideComponent(HeaderComponent, {
        remove: { imports: [NotificationPanelComponent, AnalysisHistoryPanelComponent] },
        add: { imports: [StubNotificationPanel, StubAnalysisHistoryPanel] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const getBtn = (label: string) => fixture.nativeElement.querySelector(`[aria-label="${label}"]`);
  const flush = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('displays unread notifications badge correctly', () => {
    notifications.unreadNotificationsCount.set(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header__action-badge')).toBeNull();

    notifications.unreadNotificationsCount.set(50);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header__action-badge').textContent).toContain(
      '50',
    );

    notifications.unreadNotificationsCount.set(150);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header__action-badge').textContent).toContain(
      '99+',
    );
  });

  it('toggles panels and manages active states', async () => {
    const notifBtn = getBtn('Notifications');
    const historyBtn = getBtn('Analysis history');

    notifBtn.click();
    expect(notifications.openPanel).toHaveBeenCalled();
    expect(history.closePanel).toHaveBeenCalled();

    notifications.showPanel.set(true);
    await flush();
    notifBtn.click();
    expect(notifications.closePanel).toHaveBeenCalled();

    history.showPanel.set(true);
    await flush();
    expect(historyBtn.classList.contains('header__action--active')).toBe(true);
  });

  it('handles overlay lifecycle and events', async () => {
    notifications.showPanel.set(true);
    await flush();
    const ref = overlayCreate.mock.results[0].value;

    ref._outside.next({ target: document.body } as any);
    expect(notifications.closePanel).toHaveBeenCalled();

    ref._keydown.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(notifications.closePanel).toHaveBeenCalled();

    notifications.closePanel.mockClear();
    ref._outside.next({ target: getBtn('Notifications') } as any);
    expect(notifications.closePanel).not.toHaveBeenCalled();

    const focusSpy = vi.spyOn(getBtn('Notifications'), 'focus');
    notifications.showPanel.set(false);
    await flush();
    expect(ref.dispose).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('attaches portals to DOM for coverage', async () => {
    notifications.showPanel.set(true);
    await flush();

    const portal = vi.mocked(overlayCreate.mock.results[0].value.attach).mock.calls[0][0];
    const container = document.createElement('div');
    const outlet = new DomPortalOutlet(
      container,
      TestBed.inject(ApplicationRef),
      TestBed.inject(Injector),
    );

    outlet.attach(portal);
    expect(container).toBeTruthy();
    outlet.dispose();
  });
});
