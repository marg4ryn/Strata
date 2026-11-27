import { Service } from '@angular/core';

export interface PanelFacade {
  showPanel: () => boolean;
  openPanel: () => void;
  closePanel: () => void;
}

@Service()
export class PanelCoordinatorService {
  private readonly panels = new Set<PanelFacade>();

  register(facade: PanelFacade): void {
    this.panels.add(facade);
  }

  unregister(facade: PanelFacade): void {
    this.panels.delete(facade);
  }

  notifyOpened(opened: PanelFacade): void {
    this.panels.forEach((facade) => facade !== opened && facade.closePanel());
  }
}
