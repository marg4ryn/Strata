import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { InfoTooltipComponent } from './info-tooltip.component';

describe('InfoTooltipComponent', () => {
  let component: InfoTooltipComponent;
  let fixture: ComponentFixture<InfoTooltipComponent>;
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoTooltipComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoTooltipComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('textKey', 'Przykładowa treść tooltipa');

    overlayContainer = TestBed.inject(OverlayContainer);
    overlayContainerElement = overlayContainer.getContainerElement();

    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  function getButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button.info-button');
  }

  function getTooltip(): HTMLElement | null {
    return overlayContainerElement.querySelector('.tooltip');
  }

  it('should not render tooltip initially', () => {
    expect(getTooltip()).toBeNull();
  });

  it('should show tooltip on button mouseenter', async () => {
    getButton().dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();

    const tooltip = getTooltip();
    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain('Przykładowa treść tooltipa');
  });

  it('should hide tooltip on button mouseleave', async () => {
    getButton().dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getTooltip()).not.toBeNull();

    getButton().dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getTooltip()).toBeNull();
  });

  it('should show tooltip on button focus and hide on blur', async () => {
    getButton().dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getTooltip()).not.toBeNull();

    getButton().dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getTooltip()).toBeNull();
  });

  it('onTooltipEnter() should set visible to true', () => {
    expect(component.visible).toBe(false);

    component.onTooltipEnter();

    expect(component.visible).toBe(true);
  });

  it('onTooltipLeave() should set visible to false when nothing else keeps it open', () => {
    component.onTooltipEnter();
    expect(component.visible).toBe(true);

    component.onTooltipLeave();

    expect(component.visible).toBe(false);
  });

  it('onTooltipLeave() should not hide tooltip if button is still focused', () => {
    component.onFocus();
    component.onTooltipEnter();
    expect(component.visible).toBe(true);

    component.onTooltipLeave();

    expect(component.visible).toBe(true);
  });

  it('should invoke onTooltipEnter() and onTooltipLeave() via their template bindings on the tooltip element', async () => {
    vi.spyOn(component, 'onTooltipEnter');
    vi.spyOn(component, 'onTooltipLeave');

    getButton().dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();

    const tooltip = getTooltip();
    tooltip?.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.onTooltipEnter).toHaveBeenCalled();

    tooltip?.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.onTooltipLeave).toHaveBeenCalled();
  });

  it('should keep tooltip visible when cursor moves from button to tooltip itself', async () => {
    getButton().dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();

    getButton().dispatchEvent(new MouseEvent('mouseleave'));
    getTooltip()?.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getTooltip()).not.toBeNull();
  });

  it('should hide tooltip after leaving both button and tooltip', async () => {
    getButton().dispatchEvent(new MouseEvent('mouseenter'));
    getButton().dispatchEvent(new MouseEvent('mouseleave'));
    getTooltip()?.dispatchEvent(new MouseEvent('mouseenter'));
    getTooltip()?.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getTooltip()).toBeNull();
  });

  it('should hide tooltip on Escape key even if focused and hovered at once', async () => {
    getButton().dispatchEvent(new FocusEvent('focus'));
    getButton().dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getTooltip()).not.toBeNull();

    getButton().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getTooltip()).toBeNull();
  });

  it('should link button to tooltip via aria-describedby', () => {
    expect(getButton().getAttribute('aria-describedby')).toBe(component.tooltipId);
  });

  it('should apply width input to the rendered tooltip element', async () => {
    fixture.componentRef.setInput('width', 320);
    getButton().dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getTooltip()?.style.width).toBe('320px');
  });

  describe('position input', () => {
    it('should build a top-anchored ConnectionPositionPair by default', () => {
      fixture.componentRef.setInput('position', 'top');
      component.ngOnInit();

      expect(component.positions[0]).toEqual(
        expect.objectContaining({ originY: 'top', overlayY: 'bottom' }),
      );
    });

    it('should build a right-anchored ConnectionPositionPair for position="right"', () => {
      fixture.componentRef.setInput('position', 'right');
      component.ngOnInit();

      expect(component.positions[0]).toEqual(
        expect.objectContaining({ originX: 'end', overlayX: 'start' }),
      );
    });

    it('should build a left-anchored ConnectionPositionPair for position="left"', () => {
      fixture.componentRef.setInput('position', 'left');
      component.ngOnInit();

      expect(component.positions[0]).toEqual(
        expect.objectContaining({ originX: 'start', overlayX: 'end' }),
      );
    });

    it('should build a bottom-anchored ConnectionPositionPair for position="bottom"', () => {
      fixture.componentRef.setInput('position', 'bottom');
      component.ngOnInit();

      expect(component.positions[0]).toEqual(
        expect.objectContaining({ originY: 'bottom', overlayY: 'top' }),
      );
    });
  });
});
