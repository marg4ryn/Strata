import type { ElementRef } from '@angular/core';
import type { CdkPortal } from '@angular/cdk/portal';
import type { Overlay, OverlayRef } from '@angular/cdk/overlay';

import type { PanelFacade } from '../services/panel-coordinator.service';

export interface PanelOverlayConfig {
  overlay: Overlay;
  portal: CdkPortal;
  trigger: ElementRef<HTMLElement>;
  facade: PanelFacade;
}

export class PanelOverlayController {
  private overlayRef: OverlayRef | null = null;

  constructor(private readonly config: PanelOverlayConfig) {}

  attach(): void {
    if (this.overlayRef) return;

    const { overlay, portal, facade } = this.config;

    this.overlayRef = overlay.create({
      positionStrategy: overlay.position().global().top('0').right('0'),
      scrollStrategy: overlay.scrollStrategies.close(),
      hasBackdrop: false,
    });

    this.overlayRef.attach(portal);

    this.overlayRef.detachments().subscribe(() => facade.closePanel());

    this.overlayRef.outsidePointerEvents().subscribe((event) => this.handleOutsideClick(event));

    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') facade.closePanel();
    });
  }

  detach(): void {
    if (!this.overlayRef) return;

    this.overlayRef.dispose();
    this.overlayRef = null;
    this.config.trigger.nativeElement.focus();
  }

  private handleOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    const trigger = this.config.trigger.nativeElement;

    const clickedInsideTrigger = trigger.contains(target);
    const clickedInsideOverlay = target.closest('.cdk-overlay-container') !== null;

    if (clickedInsideTrigger || clickedInsideOverlay) return;

    this.config.facade.closePanel();
  }
}
