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
} from '@angular/core';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { CdkPortal } from '@angular/cdk/portal';
import { Router } from '@angular/router';

import { NotificationsFacade } from '@app/features/notifications/notifications.facade';
import { NotificationPanel } from '@app/features/notifications/feature/notification-panel.component';
import { AnalysisHistoryFacade } from '@app/features/analysis-history/analysis-history.facade';
import { AnalysisHistoryPanel } from '@app/features/analysis-history/feature/analysis-history-panel.component';
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
  imports: [CdkPortal, NotificationPanel, AnalysisHistoryPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {
  @ViewChild('notifBtn', { read: ElementRef }) notifBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('historyBtn', { read: ElementRef }) historyBtn!: ElementRef<HTMLButtonElement>;

  @ViewChild('notifPortal') notifPortalRef!: CdkPortal;
  @ViewChild('historyPortal') historyPortalRef!: CdkPortal;

  private readonly router = inject(Router);
  private readonly confirmModal = inject(ConfirmOperationModalService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly notifications = inject(NotificationsFacade);
  protected readonly history = inject(AnalysisHistoryFacade);
  private readonly injector = inject(EnvironmentInjector);

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
    ];

    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.panels.forEach((p) => (p.facade.showPanel() ? this.attach(p) : this.detach(p)));
      });
    });
  }

  async startNewAnalysis(): Promise<void> {
    const confirmed = await this.confirmModal.confirm(
      this.destroyRef,
      `Start a new analysis?`,
      'confirm',
    );
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

      if (trigger && trigger.contains(target)) return;
      if (target.closest('.cdk-overlay-pane')) return;

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
}
