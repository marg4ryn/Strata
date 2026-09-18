import type {
  AfterViewInit,
  OnDestroy} from '@angular/core';
import {
  ChangeDetectionStrategy,
  EnvironmentInjector,
  Component,
  ViewChild,
  ElementRef,
  input,
  inject,
  effect,
  runInInjectionContext,
} from '@angular/core';
import { CdkPortal } from '@angular/cdk/portal';
import { Overlay } from '@angular/cdk/overlay';

import { PanelOverlayController } from '../../controllers/panel-overlay.controller';
import { PanelCoordinatorService } from '../../services/panel-coordinator.service';
import type { PanelFacade } from '../../services/panel-coordinator.service';

@Component({
  selector: 'app-panel-trigger',
  imports: [CdkPortal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panel-trigger.component.scss',
  templateUrl: './panel-trigger.component.html',
})
export class PanelTriggerComponent implements AfterViewInit, OnDestroy {
  facade = input.required<PanelFacade>();
  label = input.required<string>();

  @ViewChild('trigger', { read: ElementRef }) private triggerEl!: ElementRef<HTMLButtonElement>;
  @ViewChild('portalRef') private portalRef!: CdkPortal;

  private readonly overlay = inject(Overlay);
  private readonly injector = inject(EnvironmentInjector);
  private readonly coordinator = inject(PanelCoordinatorService);
  private controller!: PanelOverlayController;

  ngAfterViewInit(): void {
    this.coordinator.register(this.facade());

    this.controller = new PanelOverlayController({
      overlay: this.overlay,
      portal: this.portalRef,
      trigger: this.triggerEl,
      facade: this.facade(),
    });

    runInInjectionContext(this.injector, () => {
      effect(() =>
        this.facade().showPanel() ? this.controller.attach() : this.controller.detach(),
      );
    });
  }

  toggle(): void {
    if (this.facade().showPanel()) {
      this.facade().closePanel();
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
    this.coordinator.notifyOpened(this.facade());
    this.facade().openPanel();
  }

  ngOnDestroy(): void {
    this.coordinator.unregister(this.facade());
    this.controller?.detach();
  }
}
