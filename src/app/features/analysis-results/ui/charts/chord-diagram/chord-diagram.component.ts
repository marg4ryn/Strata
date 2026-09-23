import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  afterNextRender,
} from '@angular/core';
import type { ElementRef, OnDestroy } from '@angular/core';
import * as d3 from 'd3';

import type { AuthorCoupling } from './../../../analysis-results.model';

type ChordGroupWithAngle = d3.ChordGroup & { angle: number };

const DIAGRAM_SIZE = 0.25;

const ARC_TRANSPARENCY_NORMAL = 1.0;
const ARC_TRANSPARENCY_DISABLED = 0.1;
const ARC_THICKNESS = 0.85;

const LABEL_TRANSPARENCY_NORMAL = 1.0;
const LABEL_TRANSPARENCY_DISABLED = 0.1;
const LABEL_DISTANCE = 15;

const RIBBON_TRANSPARENCY_NORMAL = 0.7;
const RIBBON_TRANSPARENCY_HIGHLIGHT = 1.0;
const RIBBON_TRANSPARENCY_DISABLED = 0.1;

@Component({
  selector: 'app-chord-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chord-diagram.component.scss',
  templateUrl: './chord-diagram.component.html',
})
export class ChordDiagramComponent implements OnDestroy {
  data = input<AuthorCoupling[] | null>(null);
  authorHover = output<string | null>();

  private containerRef = viewChild<ElementRef<HTMLDivElement>>('container');

  private svgGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private colors = d3.schemeCategory10.concat(d3.schemePaired);
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.createChordDiagram();

      const el = this.containerRef()?.nativeElement;
      if (el) {
        this.resizeObserver = new ResizeObserver(() => this.createChordDiagram());
        this.resizeObserver.observe(el);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    const el = this.containerRef()?.nativeElement;
    if (el) {
      d3.select(el).selectAll('*').remove();
    }
  }

  private createChordDiagram(): void {
    const authorData = this.data();
    const container = this.containerRef()?.nativeElement;
    if (!container || !authorData || authorData.length === 0) return;

    d3.select(container).selectAll('*').remove();

    const size = this.getContainerSize(container);
    if (!size) return;

    const { width, height } = size;
    const minDimension = Math.min(width, height);
    const outerRadius = minDimension * DIAGRAM_SIZE;
    const innerRadius = outerRadius * ARC_THICKNESS;

    const { authors, matrix } = this.buildAdjacencyMatrix(authorData);
    const chords = this.computeChords(matrix, this.getArcGapSize());

    this.svgGroup = this.createSvgRoot(container, width, height);
    this.renderBackgroundGlow(this.svgGroup, outerRadius);

    const arcGroups = this.renderArcGroups(this.svgGroup, chords.groups);
    this.renderArcs(arcGroups, innerRadius, outerRadius, chords, authors);
    this.renderLabels(arcGroups, outerRadius, minDimension, authors);
    this.renderRibbons(this.svgGroup, chords, innerRadius, authors);
  }

  private getContainerSize(container: HTMLDivElement): { width: number; height: number } | null {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width < 100 || height < 100) {
      console.log(`width: ${width}; height: ${height}`);
      return null;
    }

    return { width, height };
  }

  private buildAdjacencyMatrix(authorData: AuthorCoupling[]): {
    authors: string[];
    matrix: number[][];
  } {
    const authors = authorData.map((d) => d.name);
    const authorsCount = authors.length;
    const matrix: number[][] = Array(authorsCount)
      .fill(0)
      .map(() => Array(authorsCount).fill(0));

    authorData.forEach((author, i) => {
      author.coupledAuthors.forEach((coupled) => {
        const j = authors.indexOf(coupled.name);
        if (j !== -1) {
          matrix[i][j] = coupled.sharedChanges;
        }
      });
    });

    return { authors, matrix };
  }

  private getArcGapSize(): number {
    const authorData = this.data();
    if (!authorData || authorData.length === 0) return 0.05;
    const n = authorData.length;
    return 2 * Math.exp(-n / 4);
  }

  private computeChords(matrix: number[][], arcGapSize: number): d3.Chords {
    const chord = d3.chord().padAngle(arcGapSize).sortSubgroups(d3.descending);
    return chord(matrix);
  }

  private createSvgRoot(
    container: HTMLDivElement,
    width: number,
    height: number,
  ): d3.Selection<SVGGElement, unknown, null, undefined> {
    return d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
  }

  private renderBackgroundGlow(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    outerRadius: number,
  ): void {
    svg
      .append('defs')
      .append('filter')
      .attr('id', 'blur')
      .append('feGaussianBlur')
      .attr('stdDeviation', 20);

    svg
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', outerRadius + 10)
      .attr('fill', 'rgba(0, 0, 0, 0.5)')
      .attr('filter', 'url(#blur)')
      .attr('class', 'background-circle');
  }

  private renderArcGroups(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    chordGroups: d3.ChordGroup[],
  ): d3.Selection<SVGGElement, ChordGroupWithAngle, SVGGElement, unknown> {
    return svg
      .append('g')
      .selectAll<SVGGElement, ChordGroupWithAngle>('g')
      .data(chordGroups as ChordGroupWithAngle[])
      .enter()
      .append('g');
  }

  private renderArcs(
    groups: d3.Selection<SVGGElement, ChordGroupWithAngle, SVGGElement, unknown>,
    innerRadius: number,
    outerRadius: number,
    chords: d3.Chords,
    authors: string[],
  ): void {
    const arc = d3.arc<ChordGroupWithAngle>().innerRadius(innerRadius).outerRadius(outerRadius);

    groups
      .append('path')
      .style('fill', (d) => this.colors[d.index % this.colors.length])
      .style('stroke', (d) =>
        d3
          .rgb(this.colors[d.index % this.colors.length])
          .darker()
          .toString(),
      )
      .attr('d', arc)
      .style('cursor', 'pointer')
      .on('mouseover', (_event, d) => this.highlightConnected(d, chords))
      .on('mouseout', () => this.resetHighlight())
      .on('mouseover.emit', (_event, d) => this.authorHover.emit(authors[d.index]))
      .on('mouseout.emit', () => this.authorHover.emit(null));
  }

  private highlightConnected(group: d3.ChordGroup, chords: d3.Chords): void {
    if (!this.svgGroup) return;

    const connectedIndices = new Set<number>([group.index]);
    chords.forEach((c) => {
      if (c.source.index === group.index) connectedIndices.add(c.target.index);
      if (c.target.index === group.index) connectedIndices.add(c.source.index);
    });

    this.svgGroup
      .selectAll<SVGPathElement, ChordGroupWithAngle>('g > path')
      .style('opacity', (d) =>
        connectedIndices.has(d.index) ? ARC_TRANSPARENCY_NORMAL : ARC_TRANSPARENCY_DISABLED,
      );

    this.svgGroup
      .selectAll<SVGTextElement, ChordGroupWithAngle>('g > text')
      .style('opacity', (d) =>
        connectedIndices.has(d.index) ? LABEL_TRANSPARENCY_NORMAL : LABEL_TRANSPARENCY_DISABLED,
      );

    this.svgGroup
      .selectAll<SVGPathElement, d3.Chord>('.chord')
      .style('opacity', (c) =>
        c.source.index === group.index || c.target.index === group.index
          ? RIBBON_TRANSPARENCY_HIGHLIGHT
          : RIBBON_TRANSPARENCY_DISABLED,
      );
  }

  private resetHighlight(): void {
    if (!this.svgGroup) return;

    this.svgGroup.selectAll('g > path').style('opacity', ARC_TRANSPARENCY_NORMAL);
    this.svgGroup.selectAll('g > text').style('opacity', LABEL_TRANSPARENCY_NORMAL);
    this.svgGroup.selectAll('.chord').style('opacity', RIBBON_TRANSPARENCY_NORMAL);
  }

  private renderLabels(
    groups: d3.Selection<SVGGElement, ChordGroupWithAngle, SVGGElement, unknown>,
    outerRadius: number,
    minDimension: number,
    authors: string[],
  ): void {
    const labelRadius = outerRadius + LABEL_DISTANCE;

    groups
      .append('text')
      .each((d) => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.35em')
      .attr('text-anchor', (d) => {
        const degrees = (d.angle * 180) / Math.PI;
        return degrees > 0 && degrees < 180 ? 'start' : 'end';
      })
      .attr('transform', (d) => {
        const angle = (d.angle * 180) / Math.PI - 90;
        const rotate = angle > 90 ? angle + 180 : angle;
        const x = Math.cos(d.angle - Math.PI / 2) * labelRadius;
        const y = Math.sin(d.angle - Math.PI / 2) * labelRadius;
        return `translate(${x}, ${y}) rotate(${rotate})`;
      })
      .text((d) => authors[d.index])
      .style('font-size', `${Math.max(10, minDimension * 0.03)}px`)
      .style('fill', (d) => this.colors[d.index % this.colors.length])
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)');
  }

  private renderRibbons(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    chords: d3.Chords,
    innerRadius: number,
    authors: string[],
  ): void {
    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(innerRadius);

    svg
      .append('g')
      .attr('fill-opacity', RIBBON_TRANSPARENCY_NORMAL)
      .selectAll<SVGPathElement, d3.Chord>('path')
      .data(chords)
      .enter()
      .append('path')
      .attr('class', 'chord')
      .attr('d', ribbon)
      .style('fill', (d) => this.colors[d.source.index % this.colors.length])
      .style('stroke', (d) =>
        d3
          .rgb(this.colors[d.source.index % this.colors.length])
          .darker()
          .toString(),
      )
      .style('opacity', RIBBON_TRANSPARENCY_NORMAL)
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).style('opacity', RIBBON_TRANSPARENCY_HIGHLIGHT);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', RIBBON_TRANSPARENCY_NORMAL);
      })
      .on('mouseover.emit', (_event, d) => {
        this.authorHover.emit(`${authors[d.source.index]}; ${authors[d.target.index]}`);
      })
      .on('mouseout.emit', () => this.authorHover.emit(null))
      .append('title')
      .text((d) => `${authors[d.source.index]} → ${authors[d.target.index]}: ${d.source.value}`);
  }
}
