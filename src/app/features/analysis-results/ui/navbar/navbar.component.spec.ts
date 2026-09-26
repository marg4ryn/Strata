import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { Component, ViewChild } from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { of } from 'rxjs';

import { getTranslocoModule } from '@app/core/transloco';
import { NavbarComponent } from './navbar.component';
import type { NavLinkGroup } from './navbar.component';

@Component({
  standalone: true,
  template: `<ng-template #tpl></ng-template>`,
})
class TemplateRefHostComponent {
  @ViewChild('tpl', { static: true }) templateRef!: TemplateRef<void>;
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let overlayContainer: OverlayContainer;
  let mockGroups: NavLinkGroup[];

  async function setup(options: { url?: string; isMobile?: boolean } = {}) {
    const { url = '/settings/profile', isMobile = false } = options;

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, TemplateRefHostComponent, getTranslocoModule()],
      providers: [
        provideRouter([
          { path: 'settings/profile', component: TemplateRefHostComponent },
          { path: 'settings/billing', component: TemplateRefHostComponent },
          { path: 'dashboard', component: TemplateRefHostComponent },
        ]),
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: isMobile, breakpoints: {} }) },
        },
      ],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);

    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);

    const hostFixture = TestBed.createComponent(TemplateRefHostComponent);
    hostFixture.detectChanges();

    mockGroups = [
      {
        icon: hostFixture.componentInstance.templateRef,
        labelKey: 'nav.group.settings',
        links: [
          { labelKey: 'nav.link.profile', path: '/settings/profile' },
          { labelKey: 'nav.link.billing', path: '/settings/billing' },
        ],
      },
    ];
  }

  function createComponent(groups: NavLinkGroup[] = mockGroups) {
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('groups', groups);
    fixture.detectChanges();
  }

  function getToggleButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.navbar__group-toggle');
  }

  function getOverlayPanel(): HTMLElement | null {
    return overlayContainer.getContainerElement().querySelector('.dropdown__panel-wrapper');
  }

  function dispatchPointer(
    el: Element,
    type: 'pointerenter' | 'pointerleave',
    pointerType: 'mouse' | 'touch',
  ) {
    el.dispatchEvent(new PointerEvent(type, { pointerType, bubbles: true }));
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
    overlayContainer.ngOnDestroy();
  });

  it('creates', async () => {
    await setup();
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('isGroupActive / activeLinkKey', () => {
    it('marks group and link as active when current url matches', async () => {
      await setup({ url: '/settings/billing' });
      createComponent();

      expect(component.isGroupActive(mockGroups[0])).toBe(true);
      expect(component.activeLinkKey(mockGroups[0])).toEqual(['nav.link.billing']);
    });

    it('marks group as inactive when url does not match any link', async () => {
      await setup({ url: '/dashboard' });
      createComponent();

      expect(component.isGroupActive(mockGroups[0])).toBe(false);
      expect(component.activeLinkKey(mockGroups[0])).toEqual([]);
    });

    it('updates the active link after navigation', async () => {
      await setup();
      createComponent();

      await TestBed.inject(Router).navigateByUrl('/settings/billing');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.isGroupActive(mockGroups[0])).toBe(true);
      expect(component.activeLinkKey(mockGroups[0])).toEqual(['nav.link.billing']);
    });
  });

  describe('isMobile', () => {
    it('reflects BreakpointObserver match', async () => {
      await setup({ isMobile: true });
      createComponent();
      expect(component.isMobile()).toBe(true);
    });

    it('defaults to desktop layout', async () => {
      await setup({ isMobile: false });
      createComponent();
      expect(component.isMobile()).toBe(false);
    });
  });

  describe('pointer hover handling (unit)', () => {
    it('opens trigger on mouse pointer enter when closed', async () => {
      await setup();
      createComponent();

      const trigger = {
        isOpen: vi.fn().mockReturnValue(false),
        open: vi.fn(),
        close: vi.fn(),
      } as any;
      component.onTriggerHover({ pointerType: 'mouse' } as PointerEvent, trigger);
      expect(trigger.open).toHaveBeenCalledTimes(1);
    });

    it('ignores touch pointer on hover', async () => {
      await setup();
      createComponent();

      const trigger = {
        isOpen: vi.fn().mockReturnValue(false),
        open: vi.fn(),
        close: vi.fn(),
      } as any;
      component.onTriggerHover({ pointerType: 'touch' } as PointerEvent, trigger);
      expect(trigger.open).not.toHaveBeenCalled();
    });

    it('does not reopen an already open trigger', async () => {
      await setup();
      createComponent();

      const trigger = {
        isOpen: vi.fn().mockReturnValue(true),
        open: vi.fn(),
        close: vi.fn(),
      } as any;
      component.onTriggerHover({ pointerType: 'mouse' } as PointerEvent, trigger);

      expect(trigger.open).not.toHaveBeenCalled();
    });

    it('closes trigger after delay on mouse pointer leave', async () => {
      vi.useFakeTimers();
      await setup();
      createComponent();

      const trigger = {
        isOpen: vi.fn().mockReturnValue(true),
        open: vi.fn(),
        close: vi.fn(),
      } as any;
      component.onTriggerLeave({ pointerType: 'mouse' } as PointerEvent, trigger);
      expect(trigger.close).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(trigger.close).toHaveBeenCalledTimes(1);
    });

    it('ignores touch pointer on leave', async () => {
      vi.useFakeTimers();
      await setup();
      createComponent();

      const trigger = {
        isOpen: vi.fn().mockReturnValue(true),
        open: vi.fn(),
        close: vi.fn(),
      } as any;
      component.onTriggerLeave({ pointerType: 'touch' } as PointerEvent, trigger);
      vi.advanceTimersByTime(500);
      expect(trigger.close).not.toHaveBeenCalled();
    });

    it('cancels pending close via clearHoverTimeout', async () => {
      vi.useFakeTimers();
      await setup();
      createComponent();

      const trigger = {
        isOpen: vi.fn().mockReturnValue(true),
        open: vi.fn(),
        close: vi.fn(),
      } as any;
      component.onTriggerLeave({ pointerType: 'mouse' } as PointerEvent, trigger);
      component.clearHoverTimeout();

      vi.advanceTimersByTime(300);
      expect(trigger.close).not.toHaveBeenCalled();
    });
  });

  describe('pointer events via DOM (button)', () => {
    it('opens the menu panel on real pointerenter with mouse', async () => {
      await setup();
      createComponent();

      const button = getToggleButton();
      dispatchPointer(button, 'pointerenter', 'mouse');

      expect(getOverlayPanel()).toBeTruthy();
    });

    it('does not open the menu panel on pointerenter with touch', async () => {
      await setup();
      createComponent();

      const button = getToggleButton();
      dispatchPointer(button, 'pointerenter', 'touch');

      expect(getOverlayPanel()).toBeFalsy();
    });

    it('closes the menu panel after pointerleave with mouse', async () => {
      vi.useFakeTimers();
      await setup();
      createComponent();

      const button = getToggleButton();
      dispatchPointer(button, 'pointerenter', 'mouse');
      expect(getOverlayPanel()).toBeTruthy();

      dispatchPointer(button, 'pointerleave', 'mouse');
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      expect(getOverlayPanel()).toBeFalsy();
    });
  });

  describe('pointer events via DOM (menu panel)', () => {
    it('clears the close timeout on mouse enter and closes after mouse leave', async () => {
      vi.useFakeTimers();
      await setup();
      createComponent();

      dispatchPointer(getToggleButton(), 'pointerenter', 'mouse');
      const panel = getOverlayPanel()!;
      expect(panel).toBeTruthy();
      const clearHoverTimeout = vi.spyOn(component, 'clearHoverTimeout');
      const onTriggerLeave = vi.spyOn(component, 'onTriggerLeave');

      dispatchPointer(panel, 'pointerenter', 'mouse');
      expect(clearHoverTimeout).toHaveBeenCalledOnce();

      dispatchPointer(panel, 'pointerleave', 'mouse');
      expect(onTriggerLeave).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayPanel()).toBeFalsy();
    });

    it('ignores touch pointer events on the panel', async () => {
      vi.useFakeTimers();
      await setup();
      createComponent();

      dispatchPointer(getToggleButton(), 'pointerenter', 'mouse');
      const panel = getOverlayPanel()!;
      const clearHoverTimeout = vi.spyOn(component, 'clearHoverTimeout');
      const onTriggerLeave = vi.spyOn(component, 'onTriggerLeave');

      dispatchPointer(panel, 'pointerenter', 'touch');
      dispatchPointer(panel, 'pointerleave', 'touch');
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(clearHoverTimeout).not.toHaveBeenCalled();
      expect(onTriggerLeave).not.toHaveBeenCalled();
      expect(onTriggerLeave).not.toHaveBeenCalled();
    });
  });

  describe('menu panel content (ng-template)', () => {
    it('renders links inside the menu panel', async () => {
      await setup();
      createComponent();

      dispatchPointer(getToggleButton(), 'pointerenter', 'mouse');
      await fixture.whenStable();
      fixture.detectChanges();

      const panel = getOverlayPanel();
      expect(panel).toBeTruthy();

      const links = panel!.querySelectorAll('a.navbar__dropdown-link');
      expect(links.length).toBe(mockGroups[0].links.length);
    });

    it('marks active link inside panel based on current url', async () => {
      await setup({ url: '/settings/billing' });
      createComponent();

      dispatchPointer(getToggleButton(), 'pointerenter', 'mouse');
      await fixture.whenStable();
      fixture.detectChanges();

      const panel = getOverlayPanel();
      const activeLink = panel!.querySelector('.navbar__dropdown-link--active');

      expect(activeLink?.textContent?.trim()).toContain('nav.link.billing');
    });
  });
});
