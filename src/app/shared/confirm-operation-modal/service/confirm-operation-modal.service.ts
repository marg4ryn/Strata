import { Service, inject, DestroyRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { ConfirmOperationModalComponent } from '../component/confirm-operation-modal.component';

export type ModalType = 'confirm' | 'danger';

@Service()
export class ConfirmOperationModalService {
  private overlay = inject(Overlay);

  confirm(
    destroyRef: DestroyRef,
    labelKey?: string,
    type?: ModalType,
    params?: Record<string, unknown>,
  ): Promise<boolean> {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    return new Promise((resolve) => {
      const overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-dark-backdrop',
      });

      const portal = new ComponentPortal(ConfirmOperationModalComponent);
      const componentRef = overlayRef.attach(portal);

      if (labelKey) {
        componentRef.setInput('labelKey', labelKey);
      }
      if (type) {
        componentRef.setInput('type', type);
      }
      if (params) {
        componentRef.setInput('params', params);
      }

      componentRef.changeDetectorRef.detectChanges();

      const cleanup = (result: boolean) => {
        overlayRef.dispose();
        previouslyFocused?.focus();
        resolve(result);
      };

      const cancelSub = componentRef.instance.cancel.subscribe(() => cleanup(false));
      const confirmSub = componentRef.instance.confirm.subscribe(() => cleanup(true));

      overlayRef.backdropClick().subscribe(() => cleanup(false));
      overlayRef.keydownEvents().subscribe((e) => {
        if (e.key === 'Escape') cleanup(false);
      });

      overlayRef.detachments().subscribe(() => {
        cancelSub.unsubscribe();
        confirmSub.unsubscribe();
      });

      destroyRef?.onDestroy(() => cleanup(false));
    });
  }
}
