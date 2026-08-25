import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewChild,
  ElementRef,
  effect,
  EnvironmentInjector,
  runInInjectionContext,
  DestroyRef,
  AfterViewInit,
} from '@angular/core';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { CdkPortal } from '@angular/cdk/portal';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';

import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { NotificationPanelComponent } from '@app/features/notifications/feature/notification-panel.component';
import { AnalysisHistoryFacade } from '@app/features/analysis-history/analysis-history.facade';
import { AnalysisHistoryPanelComponent } from '@app/features/analysis-history/feature/analysis-history-panel.component';
import { SettingsFacade } from '@app/features/settings/settings.facade';
import { SettingsPanelComponent } from '@app/features/settings/feature/settings-panel/settings-panel.component';
import { ConfirmOperationModalService } from '@app/shared/confirm-operation-modal/service/confirm-operation-modal.service';

interface PanelFacade {
  showPanel: () => boolean;
  openPanel: () => void;
  closePanel: () => void;
}

interface PanelEntry {
  facade: PanelFacade;
  portal: CdkPortal;
  trigger?: ElementRef<HTMLElement>;
  overlayRef: OverlayRef | null;
}

@Component({
  selector: 'app-header',
  imports: [
    CdkPortal,
    NotificationPanelComponent,
    AnalysisHistoryPanelComponent,
    SettingsPanelComponent,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements AfterViewInit {
  @ViewChild('notifBtn', { read: ElementRef }) notifBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('historyBtn', { read: ElementRef }) historyBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('settingsBtn', { read: ElementRef }) settingsBtn!: ElementRef<HTMLButtonElement>;

  @ViewChild('notifPortal') notifPortalRef!: CdkPortal;
  @ViewChild('historyPortal') historyPortalRef!: CdkPortal;
  @ViewChild('settingsPortal') settingsPortalRef!: CdkPortal;

  private readonly router = inject(Router);
  private readonly confirmModal = inject(ConfirmOperationModalService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly notifications = inject(NotificationsFacade);
  protected readonly history = inject(AnalysisHistoryFacade);
  protected readonly settings = inject(SettingsFacade);
  private readonly injector = inject(EnvironmentInjector);
  private readonly transloco = inject(TranslocoService);

  private panels: PanelEntry[] = [];

  constructor(private overlay: Overlay) {}

  ngAfterViewInit() {
    this.panels = [
      {
        facade: this.notifications,
        portal: this.notifPortalRef,
        trigger: this.notifBtn,
        overlayRef: null,
      },
      {
        facade: this.history,
        portal: this.historyPortalRef,
        trigger: this.historyBtn,
        overlayRef: null,
      },
      {
        facade: this.settings,
        portal: this.settingsPortalRef,
        trigger: this.settingsBtn,
        overlayRef: null,
      },
    ];

    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.panels.forEach((p) => (p.facade.showPanel() ? this.attach(p) : this.detach(p)));
      });
    });
  }

  private readonly label = toSignal(
    this.transloco.selectTranslate('confirmations.startNewAnalysis.label', { initialValue: '' }),
  );

  async startNewAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(this.destroyRef, this.label(), 'confirm');
    if (!confirmed) return;
    this.router.navigate(['']);
  }

  private attach(entry: PanelEntry) {
    if (entry.overlayRef) return;

    entry.overlayRef = this.overlay.create(this.panelConfig());
    entry.overlayRef.attach(entry.portal);

    entry.overlayRef.detachments().subscribe(() => entry.facade.closePanel());

    entry.overlayRef.outsidePointerEvents().subscribe((event) => {
      const target = event.target as HTMLElement;
      const trigger = entry.trigger?.nativeElement;

      const clickedInsideTrigger = trigger?.contains(target);
      const clickedInsideOverlay = target.closest('.cdk-overlay-container') !== null;

      if (clickedInsideTrigger || clickedInsideOverlay) {
        return;
      }

      entry.facade.closePanel();
    });

    entry.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') entry.facade.closePanel();
    });
  }

  private detach(entry: PanelEntry) {
    if (!entry.overlayRef) return;

    entry.overlayRef?.dispose();
    entry.overlayRef = null;
    entry.trigger?.nativeElement.focus();
  }

  private panelConfig(): OverlayConfig {
    return {
      positionStrategy: this.overlay.position().global().top('0').right('0'),
      scrollStrategy: this.overlay.scrollStrategies.close(),
      hasBackdrop: false,
    };
  }

  private closeOthers(except: PanelFacade) {
    this.panels.forEach((p) => p.facade !== except && p.facade.closePanel());
  }

  toggleNotificationsPanel(): void {
    if (this.notifications.showPanel()) {
      this.notifications.closePanel();
    } else {
      this.closeOthers(this.notifications);
      this.notifications.openPanel();
    }
  }

  toggleHistoryPanel(): void {
    if (this.history.showPanel()) {
      this.history.closePanel();
    } else {
      this.closeOthers(this.history);
      this.history.openPanel();
    }
  }

  toggleSettingsPanel(): void {
    if (this.settings.showPanel()) {
      this.settings.closePanel();
    } else {
      this.closeOthers(this.settings);
      this.settings.openPanel();
    }
  }
}
