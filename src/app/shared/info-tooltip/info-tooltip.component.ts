import { Component, input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ConnectionPositionPair, OverlayModule } from '@angular/cdk/overlay';
import { TranslocoPipe } from '@ngneat/transloco';

let nextId = 0;

@Component({
  selector: 'app-info-tooltip',
  imports: [OverlayModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-tooltip.component.html',
  styleUrls: ['./info-tooltip.component.scss'],
})
export class InfoTooltipComponent implements OnInit {
  textKey = input.required<string>();
  position = input<'top' | 'bottom' | 'left' | 'right'>('top');
  width = input<number>(200);
  iconSize = input<number>(16);

  private isHovered = false;
  private isFocused = false;

  tooltipId = `info-tooltip-${nextId++}`;
  positions: ConnectionPositionPair[] = [];

  get visible(): boolean {
    return this.isHovered || this.isFocused;
  }

  ngOnInit(): void {
    this.positions = [this.getPosition(this.position())];
  }

  onButtonEnter(): void {
    this.isHovered = true;
  }
  onButtonLeave(): void {
    this.isHovered = false;
  }
  onTooltipEnter(): void {
    this.isHovered = true;
  }
  onTooltipLeave(): void {
    this.isHovered = false;
  }
  onFocus(): void {
    this.isFocused = true;
  }
  onBlur(): void {
    this.isFocused = false;
  }
  onEscape(): void {
    this.isHovered = false;
    this.isFocused = false;
  }

  private getPosition(pos: string): ConnectionPositionPair {
    switch (pos) {
      case 'bottom':
        return {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 8,
        };
      case 'left':
        return {
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -8,
        };
      case 'right':
        return {
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 8,
        };
      default:
        return {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        };
    }
  }
}
