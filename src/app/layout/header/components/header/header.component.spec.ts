import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { MockService } from 'ng-mocks';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { ConfirmOperationService } from '@app/shared/confirm-operation/services/confirm-operation.service';
import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { AnalysisHistoryFacade } from '@app/features/analysis-history/analysis-history.facade';
import { SettingsFacade } from '@app/features/settings/settings.facade';
import { PanelTriggerComponent } from '../panel-trigger/panel-trigger.component';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  let unreadNotificationsCountSignal: ReturnType<typeof signal<number>>;

  let confirm: ReturnType<typeof MockService<ConfirmOperationService>>;
  let notifications: ReturnType<typeof MockService<NotificationsFacade>>;
  let history: ReturnType<typeof MockService<AnalysisHistoryFacade>>;
  let settings: ReturnType<typeof MockService<SettingsFacade>>;
  let overlay: ReturnType<typeof MockService<Overlay>>;
  let router: ReturnType<typeof MockService<Router>>;

  beforeEach(async () => {
    unreadNotificationsCountSignal = signal(0);

    notifications = MockService(NotificationsFacade, {
      showPanel: signal(false),
      unreadNotificationsCount: unreadNotificationsCountSignal,
      notifications: signal([]),
    });

    history = MockService(AnalysisHistoryFacade, {
      showPanel: signal(false),
      analysisHistory: signal([]),
    });

    settings = MockService(SettingsFacade, {
      showPanel: signal(false),
    });

    confirm = MockService(ConfirmOperationService);
    overlay = MockService(Overlay);
    router = MockService(Router);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, getTranslocoModule()],
      providers: [
        { provide: Router, useValue: router },
        { provide: ConfirmOperationService, useValue: confirm },
        { provide: NotificationsFacade, useValue: notifications },
        { provide: AnalysisHistoryFacade, useValue: history },
        { provide: SettingsFacade, useValue: settings },
        { provide: Overlay, useValue: overlay },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders exactly three panel triggers', () => {
    const triggers = fixture.debugElement.queryAll(By.directive(PanelTriggerComponent));
    expect(triggers.length).toBe(3);
  });

  it('passes notifications facade to the first panel trigger', () => {
    const triggers = fixture.debugElement.queryAll(By.directive(PanelTriggerComponent));
    const notifTrigger = triggers[0].componentInstance as PanelTriggerComponent;
    expect(notifTrigger.facade()).toBe(notifications);
  });

  it('passes history facade to the second panel trigger', () => {
    const triggers = fixture.debugElement.queryAll(By.directive(PanelTriggerComponent));
    const historyTrigger = triggers[1].componentInstance as PanelTriggerComponent;
    expect(historyTrigger.facade()).toBe(history);
  });

  it('passes settings facade to the third panel trigger', () => {
    const triggers = fixture.debugElement.queryAll(By.directive(PanelTriggerComponent));
    const settingsTrigger = triggers[2].componentInstance as PanelTriggerComponent;
    expect(settingsTrigger.facade()).toBe(settings);
  });

  it('renders unread notifications badge when count is above zero', () => {
    unreadNotificationsCountSignal.set(3);
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('[trigger-badge]'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent).toContain('3');
  });

  it('caps the badge at "9+" when unread count exceeds nine', () => {
    unreadNotificationsCountSignal.set(15);
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('[trigger-badge]'));
    expect(badge.nativeElement.textContent).toContain('9+');
  });

  it('does not render badge when there are no unread notifications', () => {
    const badge = fixture.debugElement.query(By.css('[trigger-badge]'));
    expect(badge).toBeFalsy();
  });

  it('navigates to root when confirmed', async () => {
    (confirm.confirm as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['']);
  });

  it('does not navigate when confirmation is rejected', async () => {
    (confirm.confirm as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    await component.startNewAnalysis();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('passes destroyRef and correct params to confirmModal', async () => {
    (confirm.confirm as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    await component.startNewAnalysis();

    expect(confirm.confirm).toHaveBeenCalledWith(
      expect.anything(),
      'confirmations.startNewAnalysis',
      'confirm',
    );
  });
});
