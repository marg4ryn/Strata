import { TestBed } from '@angular/core/testing';

import { PanelCoordinatorService } from './panel-coordinator.service';
import type { PanelFacade } from './panel-coordinator.service';

describe('PanelCoordinatorService', () => {
  let service: PanelCoordinatorService;

  const fakeFacade = (): PanelFacade => ({
    showPanel: vi.fn(() => false),
    openPanel: vi.fn(),
    closePanel: vi.fn(),
  });

  beforeEach(() => {
    service = TestBed.inject(PanelCoordinatorService);
  });

  it('does nothing when no panels are registered', () => {
    const opened = fakeFacade();
    expect(() => service.notifyOpened(opened)).not.toThrow();
  });

  it('closes all registered panels except the one that was opened', () => {
    const notifications = fakeFacade();
    const history = fakeFacade();
    const settings = fakeFacade();

    service.register(notifications);
    service.register(history);
    service.register(settings);

    service.notifyOpened(history);

    expect(notifications.closePanel).toHaveBeenCalled();
    expect(settings.closePanel).toHaveBeenCalled();
    expect(history.closePanel).not.toHaveBeenCalled();
  });

  it('does not call closePanel on an unregistered facade', () => {
    const notifications = fakeFacade();
    const history = fakeFacade();

    service.register(notifications);

    service.notifyOpened(history);

    expect(notifications.closePanel).toHaveBeenCalled();
    expect(history.closePanel).not.toHaveBeenCalled();
  });

  it('stops notifying a facade after it is unregistered', () => {
    const notifications = fakeFacade();
    const history = fakeFacade();

    service.register(notifications);
    service.register(history);

    service.unregister(notifications);
    service.notifyOpened(history);

    expect(notifications.closePanel).not.toHaveBeenCalled();
  });

  it('registering the same facade twice does not duplicate closePanel calls', () => {
    const notifications = fakeFacade();
    const history = fakeFacade();

    service.register(notifications);
    service.register(notifications);
    service.register(history);

    service.notifyOpened(history);

    expect(notifications.closePanel).toHaveBeenCalledTimes(1);
  });

  it('unregistering a facade that was never registered does not throw', () => {
    const neverRegistered = fakeFacade();
    expect(() => service.unregister(neverRegistered)).not.toThrow();
  });
});
