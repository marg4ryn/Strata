import { ElementRef } from '@angular/core';
import { Subject } from 'rxjs';

import { PanelOverlayController } from './panel-overlay-controller';
import type { PanelFacade } from '../services/panel-coordinator.service';

describe('PanelOverlayController', () => {
  let controller: PanelOverlayController;
  let facadeMock: PanelFacade;
  let detachments$: Subject<void>;
  let keydownEvents$: Subject<KeyboardEvent>;
  let outsidePointerEvents$: Subject<MouseEvent>;
  let triggerEl: ElementRef<HTMLButtonElement>;
  let overlayRefMock: any;
  let overlayMock: any;

  beforeEach(() => {
    detachments$ = new Subject();
    keydownEvents$ = new Subject();
    outsidePointerEvents$ = new Subject();

    const button = document.createElement('button');
    triggerEl = new ElementRef(button);

    facadeMock = {
      showPanel: vi.fn(),
      openPanel: vi.fn(),
      closePanel: vi.fn(),
    };

    overlayRefMock = {
      attach: vi.fn(),
      dispose: vi.fn(),
      detachments: vi.fn(() => detachments$),
      outsidePointerEvents: vi.fn(() => outsidePointerEvents$),
      keydownEvents: vi.fn(() => keydownEvents$),
    };

    overlayMock = {
      create: vi.fn(() => overlayRefMock),
      position: vi.fn(() => ({
        global: vi.fn().mockReturnThis(),
        top: vi.fn().mockReturnThis(),
        right: vi.fn().mockReturnThis(),
      })),
      scrollStrategies: { close: vi.fn() },
    };

    controller = new PanelOverlayController({
      overlay: overlayMock,
      portal: {} as any,
      trigger: triggerEl,
      facade: facadeMock,
    });
  });

  it('creates overlay and attaches portal on attach()', () => {
    controller.attach();
    expect(overlayMock.create).toHaveBeenCalled();
    expect(overlayRefMock.attach).toHaveBeenCalled();
  });

  it('does not create overlay twice if already attached', () => {
    controller.attach();
    controller.attach();
    expect(overlayMock.create).toHaveBeenCalledTimes(1);
  });

  it('closes panel on detachments', () => {
    controller.attach();
    detachments$.next();
    expect(facadeMock.closePanel).toHaveBeenCalled();
  });

  it('closes panel on Escape', () => {
    controller.attach();
    keydownEvents$.next({ key: 'Escape' } as KeyboardEvent);
    expect(facadeMock.closePanel).toHaveBeenCalled();
  });

  it('ignores non-Escape keys', () => {
    controller.attach();
    keydownEvents$.next({ key: 'Enter' } as KeyboardEvent);
    expect(facadeMock.closePanel).not.toHaveBeenCalled();
  });

  it('disposes overlay and refocuses trigger on detach()', () => {
    const focusSpy = vi.spyOn(triggerEl.nativeElement, 'focus');
    controller.attach();
    controller.detach();
    expect(overlayRefMock.dispose).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('does nothing on detach() if never attached', () => {
    controller.detach();
    expect(overlayRefMock.dispose).not.toHaveBeenCalled();
  });

  it('click outside trigger and overlay closes panel', () => {
    controller.attach();
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);

    outsidePointerEvents$.next({ target: outsideEl } as unknown as MouseEvent);
    expect(facadeMock.closePanel).toHaveBeenCalled();
  });

  it('click inside trigger does not dispose overlay', () => {
    controller.attach();
    outsidePointerEvents$.next({ target: triggerEl.nativeElement } as unknown as MouseEvent);
    expect(facadeMock.closePanel).not.toHaveBeenCalled();
  });

  it('click inside overlay container does not dispose overlay', () => {
    controller.attach();
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'cdk-overlay-container';
    const innerEl = document.createElement('span');
    overlayContainer.appendChild(innerEl);
    document.body.appendChild(overlayContainer);

    outsidePointerEvents$.next({ target: innerEl } as unknown as MouseEvent);
    expect(facadeMock.closePanel).not.toHaveBeenCalled();
  });
});
