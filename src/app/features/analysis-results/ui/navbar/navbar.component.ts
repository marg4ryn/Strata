import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkMenuModule } from '@angular/cdk/menu';
import type { CdkMenuTrigger } from '@angular/cdk/menu';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { TranslocoPipe } from '@jsverse/transloco';

export interface NavLinkGroup {
  icon: TemplateRef<void>;
  labelKey: string;
  links: NavLink[];
}

export interface NavLink {
  labelKey: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  imports: [CdkMenuModule, NgTemplateOutlet, RouterLink, RouterLinkActive, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './navbar.component.scss',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);

  groups = input.required<NavLinkGroup[]>();

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private hoverCloseTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly menuPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 3,
    },
  ];

  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 600px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  activeLinkKey(group: NavLinkGroup): string[] {
    const active = group.links.find((link) => this.currentUrl().includes(link.path));
    return active ? [active.labelKey] : [];
  }

  isGroupActive(group: NavLinkGroup): boolean {
    const url = this.currentUrl();
    return group.links.some((link) => url.includes(link.path));
  }

  onTriggerHover(event: PointerEvent, trigger: CdkMenuTrigger): void {
    if (event.pointerType === 'touch') return;
    this.clearHoverTimeout();
    if (!trigger.isOpen()) {
      trigger.open();
    }
  }

  onTriggerLeave(event: PointerEvent, trigger: CdkMenuTrigger): void {
    if (event.pointerType === 'touch') return;
    this.hoverCloseTimeout = setTimeout(() => trigger.close(), 200);
  }

  clearHoverTimeout(): void {
    if (this.hoverCloseTimeout) {
      clearTimeout(this.hoverCloseTimeout);
      this.hoverCloseTimeout = null;
    }
  }
}
