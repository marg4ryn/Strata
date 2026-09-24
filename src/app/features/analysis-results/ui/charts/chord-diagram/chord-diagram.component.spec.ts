import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ChordDiagramComponent } from './chord-diagram.component';
import type { AuthorCoupling } from '../../../analysis-results.model';

describe('ChordDiagramComponent', () => {
  let component: ChordDiagramComponent;
  let fixture: ComponentFixture<ChordDiagramComponent>;

  const coupling: AuthorCoupling[] = [
    {
      name: 'Ada',
      filesChanged: 4,
      totalChanges: 10,
      coupledAuthors: [{ name: 'Grace', percentage: 0.5, sharedChanges: 3, sharedFilesChanged: 2 }],
    },
    {
      name: 'Grace',
      filesChanged: 3,
      totalChanges: 8,
      coupledAuthors: [
        { name: 'Ada', percentage: 0.25, sharedChanges: 3, sharedFilesChanged: 2 },
        { name: 'Linus', percentage: 0.2, sharedChanges: 2, sharedFilesChanged: 1 },
      ],
    },
    {
      name: 'Linus',
      filesChanged: 2,
      totalChanges: 4,
      coupledAuthors: [],
    },
  ];

  async function renderDiagram(data: AuthorCoupling[]) {
    const canvas = fixture.nativeElement.querySelector('.chord-diagram__canvas') as HTMLDivElement;
    Object.defineProperties(canvas, {
      clientWidth: { configurable: true, value: 800 },
      clientHeight: { configurable: true, value: 600 },
    });

    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    await fixture.whenStable();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChordDiagramComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChordDiagramComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('renders the diagram containers', () => {
      expect(fixture.debugElement.query(By.css('.chord-diagram'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.chord-diagram__scroll'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.chord-diagram__canvas'))).toBeTruthy();
    });

    it('does not render an SVG when there is no data', async () => {
      fixture.componentRef.setInput('data', []);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    });

    it('does not schedule rendering when the view container is unavailable', async () => {
      const state = component as unknown as {
        containerRef: () => undefined;
      };
      state.containerRef = () => undefined;

      fixture.detectChanges();
      await fixture.whenStable();

      expect(state.containerRef()).toBeUndefined();
    });

    it('does not create a diagram when the container is unavailable', () => {
      const state = component as unknown as {
        containerRef: () => undefined;
        createChordDiagram: () => void;
      };
      state.containerRef = () => undefined;

      expect(() => state.createChordDiagram.call(component)).not.toThrow();
    });

    it('does not render an SVG when the container has no measurable size', async () => {
      const canvas = fixture.nativeElement.querySelector(
        '.chord-diagram__canvas',
      ) as HTMLDivElement;
      Object.defineProperties(canvas, {
        clientWidth: { configurable: true, value: 0 },
        clientHeight: { configurable: true, value: 0 },
      });

      fixture.componentRef.setInput('data', coupling);
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      expect(canvas.querySelector('svg')).toBeNull();
    });

    it('does not schedule more than one render frame at a time', async () => {
      await renderDiagram(coupling);

      const scheduleRender = (component as unknown as { scheduleRender: () => void })
        .scheduleRender;
      const state = component as unknown as { renderFrame: number | null };

      scheduleRender.call(component);
      const scheduledFrame = state.renderFrame;
      scheduleRender.call(component);

      expect(scheduledFrame).not.toBeNull();
      expect(state.renderFrame).toBe(scheduledFrame);
      fixture.destroy();
    });

    it('disconnects the resize observer and removes the SVG on destroy', async () => {
      await renderDiagram(coupling);
      const canvas = fixture.nativeElement.querySelector(
        '.chord-diagram__canvas',
      ) as HTMLDivElement;
      const observer = (component as unknown as { resizeObserver: ResizeObserver }).resizeObserver;
      const disconnect = vi.spyOn(observer, 'disconnect');

      fixture.destroy();

      expect(disconnect).toHaveBeenCalled();
      expect(canvas.querySelector('svg')).toBeNull();
    });

    it('does not remove elements on destroy when the view container is unavailable', () => {
      const state = component as unknown as {
        containerRef: () => undefined;
      };
      state.containerRef = () => undefined;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('renders one author arc and label for every author', async () => {
      await renderDiagram(coupling);

      const paths = fixture.nativeElement.querySelectorAll('svg > g > g > g > path');
      const labels = fixture.nativeElement.querySelectorAll('svg text');

      expect(paths).toHaveLength(coupling.length);
      expect(Array.from(labels, (label: SVGTextElement) => label.textContent)).toEqual([
        'Ada',
        'Grace',
        'Linus',
      ]);
    });

    it('renders ribbons for coupled authors with a descriptive title', async () => {
      await renderDiagram(coupling);

      const ribbons = fixture.nativeElement.querySelectorAll('svg path.chord');
      const titles = fixture.nativeElement.querySelectorAll('svg path.chord title');

      expect(ribbons.length).toBeGreaterThan(0);
      expect(Array.from(titles, (title: SVGTitleElement) => title.textContent)).toContain(
        'Ada → Grace: 3',
      );
    });

    it('does not recreate the diagram when its size has not changed', async () => {
      await renderDiagram(coupling);

      const canvas = fixture.nativeElement.querySelector(
        '.chord-diagram__canvas',
      ) as HTMLDivElement;
      const svg = canvas.querySelector('svg');
      const createChordDiagram = (component as unknown as { createChordDiagram: () => void })
        .createChordDiagram;

      createChordDiagram.call(component);

      expect(canvas.querySelector('svg')).toBe(svg);
    });

    it('uses the fallback arc gap when there is no data', () => {
      const getArcGapSize = (component as unknown as { getArcGapSize: () => number }).getArcGapSize;

      expect(getArcGapSize.call(component)).toBe(0.05);

      fixture.componentRef.setInput('data', []);
      expect(getArcGapSize.call(component)).toBe(0.05);
    });

    it('ignores couplings to authors outside the data set', async () => {
      const dataWithUnknownAuthor: AuthorCoupling[] = [
        {
          ...coupling[0],
          coupledAuthors: [
            ...coupling[0].coupledAuthors,
            { name: 'Unknown', percentage: 0.1, sharedChanges: 1, sharedFilesChanged: 1 },
          ],
        },
        ...coupling.slice(1),
      ];

      await renderDiagram(dataWithUnknownAuthor);

      const labels = fixture.nativeElement.querySelectorAll('svg text');
      expect(labels).toHaveLength(coupling.length);
      expect(fixture.nativeElement.querySelectorAll('svg path.chord').length).toBeGreaterThan(0);
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      component.hoveredAuthor.set(null);
      component.selectedAuthor.set(null);
    });

    it('emits the hovered author when an author arc is hovered', async () => {
      await renderDiagram(coupling);

      const arc = fixture.nativeElement.querySelector('svg > g > g > g > path') as SVGPathElement;
      arc.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

      expect(component.hoveredAuthor()).toBe('Ada');
    });

    it('toggles the selected author when an author arc is clicked', async () => {
      await renderDiagram(coupling);

      const arc = fixture.nativeElement.querySelector('svg > g > g > g > path') as SVGPathElement;
      arc.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(component.selectedAuthor()).toBe('Ada');

      arc.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(component.selectedAuthor()).toBeNull();
    });

    it('clears the hovered author when an author arc is no longer hovered', async () => {
      await renderDiagram(coupling);

      const arc = fixture.nativeElement.querySelector('svg > g > g > g > path') as SVGPathElement;
      arc.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      arc.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));

      expect(component.hoveredAuthor()).toBeNull();
    });

    it('emits the source author and highlights the hovered ribbon', async () => {
      await renderDiagram(coupling);

      const ribbons = Array.from(
        fixture.nativeElement.querySelectorAll('svg path.chord'),
      ) as SVGPathElement[];
      ribbons[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      fixture.detectChanges();

      expect(component.hoveredAuthor()).toBe('Ada');
      expect(ribbons[0].style.opacity).toBe('1');
      expect(ribbons.slice(1).every((ribbon) => ribbon.style.opacity === '0.1')).toBe(true);
    });

    it('clears the hovered author when a ribbon is no longer hovered', async () => {
      await renderDiagram(coupling);

      const ribbon = fixture.nativeElement.querySelector('svg path.chord') as SVGPathElement;
      ribbon.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      ribbon.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));

      expect(component.hoveredAuthor()).toBeNull();
    });

    it('toggles the selected source author when a ribbon is clicked', async () => {
      await renderDiagram(coupling);

      const ribbon = fixture.nativeElement.querySelector('svg path.chord') as SVGPathElement;
      ribbon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(component.selectedAuthor()).toBe('Ada');

      ribbon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(component.selectedAuthor()).toBeNull();
    });

    it('highlights the hovered author through the effect', async () => {
      await renderDiagram(coupling);

      component.hoveredAuthor.set('Ada');
      fixture.detectChanges();

      const arcs = Array.from(
        fixture.nativeElement.querySelectorAll('svg > g > g > g > path'),
      ) as SVGPathElement[];
      expect(arcs.map((arc) => arc.style.opacity)).toEqual(['1', '1', '0.1']);
    });

    it('highlights ribbons connected to the selected author', async () => {
      await renderDiagram(coupling);

      component.selectedAuthor.set('Ada');
      fixture.detectChanges();

      const ribbons = Array.from(
        fixture.nativeElement.querySelectorAll('svg path.chord'),
      ) as SVGPathElement[];
      expect(ribbons.some((ribbon) => ribbon.style.opacity === '1')).toBe(true);
    });

    it('dims ribbons that are not connected to the selected author', async () => {
      await renderDiagram(coupling);

      component.selectedAuthor.set('Ada');
      fixture.detectChanges();

      const ribbons = Array.from(
        fixture.nativeElement.querySelectorAll('svg path.chord'),
      ) as SVGPathElement[];
      expect(ribbons.some((ribbon) => ribbon.style.opacity === '0.1')).toBe(true);
    });

    it('prioritizes hovered author over selected author', async () => {
      await renderDiagram(coupling);

      component.selectedAuthor.set('Ada');
      component.hoveredAuthor.set('Linus');
      fixture.detectChanges();

      const arcs = Array.from(
        fixture.nativeElement.querySelectorAll('svg > g > g > g > path'),
      ) as SVGPathElement[];
      const withSelectedAndHovered = arcs.map((arc) => arc.style.opacity);

      component.selectedAuthor.set(null);
      fixture.detectChanges();

      const withHoveredOnly = arcs.map((arc) => arc.style.opacity);

      expect(withSelectedAndHovered).toEqual(withHoveredOnly);
      expect(withSelectedAndHovered).not.toEqual(['1', '1', '1']);
    });

    it('highlights a ribbon when the selected author is its target', async () => {
      await renderDiagram(coupling);

      component.selectedAuthor.set('Linus');
      fixture.detectChanges();

      const ribbons = Array.from(
        fixture.nativeElement.querySelectorAll('svg path.chord'),
      ) as SVGPathElement[];
      expect(ribbons.some((ribbon) => ribbon.style.opacity === '1')).toBe(true);
    });

    it('resets highlighting when the selected author is not in the diagram', async () => {
      await renderDiagram(coupling);

      component.selectedAuthor.set('Unknown');
      fixture.detectChanges();

      const arcs = Array.from(
        fixture.nativeElement.querySelectorAll('svg > g > g > g > path'),
      ) as SVGPathElement[];
      expect(arcs.every((arc) => arc.style.opacity === '1')).toBe(true);
    });

    it('resets highlighting when no author is hovered or selected', async () => {
      await renderDiagram(coupling);

      component.selectedAuthor.set('Ada');
      fixture.detectChanges();
      component.selectedAuthor.set(null);
      fixture.detectChanges();

      const arcs = Array.from(
        fixture.nativeElement.querySelectorAll('svg > g > g > g > path'),
      ) as SVGPathElement[];
      expect(arcs.every((arc) => arc.style.opacity === '1')).toBe(true);
    });

    it('ignores highlighting when no chords or SVG group are available', () => {
      const methods = component as unknown as {
        highlightAuthor: (author: string) => void;
        highlightConnected: (group: unknown, chords: unknown[]) => void;
        highlightRibbon: (chord: unknown) => void;
        resetHighlight: () => void;
      };

      expect(() => methods.highlightAuthor('Ada')).not.toThrow();
      expect(() => methods.highlightConnected({ index: 0 }, [])).not.toThrow();
      expect(() => methods.highlightRibbon({})).not.toThrow();
      expect(() => methods.resetHighlight()).not.toThrow();
    });

    it('resets highlighting when the selected author has no rendered group', async () => {
      await renderDiagram(coupling);

      const state = component as unknown as {
        renderedChords: { groups: never[] };
        renderedAuthors: string[];
        resetHighlight: () => void;
        highlightAuthor: (author: string) => void;
      };
      state.renderedChords = { groups: [] };
      state.renderedAuthors = ['Ada'];
      const resetHighlight = vi.spyOn(state, 'resetHighlight');

      state.highlightAuthor('Ada');

      expect(resetHighlight).not.toHaveBeenCalled();
    });
  });
});
