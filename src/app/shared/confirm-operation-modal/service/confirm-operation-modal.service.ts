import { Service, inject, DestroyRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { ConfirmOperationModal } from '../confirm-operation-modal/confirm-operation-modal.component';

export type ModalType = 'confirm' | 'danger';

@Service()
export class ConfirmOperationModalService {
  private overlay = inject(Overlay);

  confirm(destroyRef: DestroyRef, label?: string, type?: ModalType): Promise<boolean> {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    return new Promise((resolve) => {
      const overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-dark-backdrop',
      });

      const portal = new ComponentPortal(ConfirmOperationModal);
      const componentRef = overlayRef.attach(portal);

      if (label) {
        componentRef.setInput('label', label);
      }
      if (type) {
        componentRef.setInput('type', type);
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
