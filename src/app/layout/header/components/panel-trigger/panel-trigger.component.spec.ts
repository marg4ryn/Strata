import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import { PanelTriggerComponent } from './panel-trigger.component';
import { PanelCoordinatorService } from '../../services/panel-coordinator.service';
import type { PanelFacade } from '../../services/panel-coordinator.service';

@Component({
  standalone: true,
  imports: [PanelTriggerComponent],
  template: `
    <app-panel-trigger [facade]="facade" [label]="'Test label'">
      <span trigger-icon>icon</span>
      <span trigger-badge>badge</span>
      <div panel-content>panel content</div>
    </app-panel-trigger>
  `,
})
class HostComponent {
  showPanelSignal = signal(false);

  facade: PanelFacade = {
    showPanel: this.showPanelSignal,
    openPanel: vi.fn(() => this.showPanelSignal.set(true)),
    closePanel: vi.fn(() => this.showPanelSignal.set(false)),
  };
}

describe('PanelTriggerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let coordinator: PanelCoordinatorService;
  let detachments$: Subject<void>;
  let keydownEvents$: Subject<KeyboardEvent>;
  let outsidePointerEvents$: Subject<MouseEvent>;
  let overlayRefMock: any;
  let overlayMock: any;
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    detachments$ = new Subject();
    keydownEvents$ = new Subject();
    outsidePointerEvents$ = new Subject();

    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    overlayRefMock = {
      attach: vi.fn(),
      dispose: vi.fn(),
      detachments: vi.fn(() => detachments$),
      keydownEvents: vi.fn(() => keydownEvents$),
      outsidePointerEvents: vi.fn(() => outsidePointerEvents$),
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

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: Overlay, useValue: overlayMock }, PanelCoordinatorService],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    coordinator = TestBed.inject(PanelCoordinatorService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('projects trigger icon, badge and panel content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[trigger-icon]')?.textContent).toContain('icon');
    expect(compiled.querySelector('[trigger-badge]')?.textContent).toContain('badge');
  });

  it('registers facade with orchestrator on init', () => {
    const registerSpy = vi.spyOn(coordinator, 'register');
    const secondFixture = TestBed.createComponent(HostComponent);
    secondFixture.detectChanges();
    expect(registerSpy).toHaveBeenCalledWith(secondFixture.componentInstance.facade);
  });

  it('creates and attaches overlay when facade.showPanel() becomes true', async () => {
    host.showPanelSignal.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(overlayMock.create).toHaveBeenCalled();
    expect(overlayRefMock.attach).toHaveBeenCalled();
  });

  it('does not create overlay while showPanel() stays false', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(overlayMock.create).not.toHaveBeenCalled();
  });

  it('disposes overlay when facade.showPanel() goes back to false', async () => {
    host.showPanelSignal.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    host.showPanelSignal.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(overlayRefMock.dispose).toHaveBeenCalled();
  });

  it('closes panel via facade when overlay reports detachment', async () => {
    host.showPanelSignal.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    detachments$.next();
    expect(host.facade.closePanel).toHaveBeenCalled();
  });

  it('closes panel on Escape keydown', async () => {
    host.showPanelSignal.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    keydownEvents$.next({ key: 'Escape' } as KeyboardEvent);
    expect(host.facade.closePanel).toHaveBeenCalled();
  });

  it('unregisters facade and disposes overlay on destroy', async () => {
    host.showPanelSignal.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const unregisterSpy = vi.spyOn(coordinator, 'unregister');
    fixture.destroy();

    expect(unregisterSpy).toHaveBeenCalledWith(host.facade);
    expect(overlayRefMock.dispose).toHaveBeenCalled();
  });

  it('projects panel-content into portal template', () => {
    const triggerCmp = fixture.debugElement.query(
      By.directive(PanelTriggerComponent),
    ).componentInstance;
    const portal = triggerCmp.portalRef;
    const viewRef = portal.templateRef.createEmbeddedView({});
    fixture.detectChanges();

    const container = document.createElement('div');
    viewRef.rootNodes.forEach((node: Node) => container.appendChild(node));

    expect(container.textContent).toContain('panel content');
    viewRef.destroy();
  });

  describe('toggle()', () => {
    it('notifies orchestrator and opens panel when currently closed', () => {
      const notifySpy = vi.spyOn(coordinator, 'notifyOpened');
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(notifySpy).toHaveBeenCalledWith(host.facade);
      expect(host.facade.openPanel).toHaveBeenCalled();
    });

    it('closes panel without notifying orchestrator when currently open', () => {
      host.showPanelSignal.set(true);
      fixture.detectChanges();

      const notifySpy = vi.spyOn(coordinator, 'notifyOpened');
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(host.facade.closePanel).toHaveBeenCalled();
      expect(notifySpy).not.toHaveBeenCalled();
    });

    it('scrolls to top when opening the panel', () => {
      const trigger = fixture.nativeElement.querySelector('.panel-trigger');
      trigger.click();

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    });
  });
});
