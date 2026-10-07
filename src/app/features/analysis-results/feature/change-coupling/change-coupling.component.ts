import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';

import { LocalizedNumberPipe } from '@app/shared/pipes';
import type { CoupledFile } from '../../models/change-coupling.model';
import { pageResource } from '../../utils/page-resource/page-resource.utils';
import { CodeCityStateService } from '../code-city-shell/services/code-city-state.service';
import { CodeCityTemplateDirective } from '../code-city-shell/directives/code-city-template.directive';
import { AnalysisResultsFacade } from '../../analysis-results.facade';
import type { PathColorData } from '../../ui/code-city/code-city.model';

interface FileCouplingItem {
  path: string;
  count: number;
  color: string;
}

interface CoupledFileItem extends CoupledFile {
  color: string;
}

function getGradientColor(value: number): number {
  const normalizedValue = Math.min(1, Math.max(0, value));

  const startR = 0xff,
    startG = 0xee,
    startB = 0x44;
  const endR = 0xbf,
    endG = 0x1b,
    endB = 0x1b;

  const r = Math.round(startR + (endR - startR) * normalizedValue);
  const g = Math.round(startG + (endG - startG) * normalizedValue);
  const b = Math.round(startB + (endB - startB) * normalizedValue);

  return (r << 16) | (g << 8) | b;
}

function getIntensityColorForFiles(files: number): number {
  const maxFiles = 5;
  const value = Math.min(files, maxFiles) / maxFiles;
  return getGradientColor(value);
}

function getIntensityColorForCommits(percentage: number): number {
  const maxPercentage = 80;
  const value = Math.min(percentage, maxPercentage) / maxPercentage;
  return getGradientColor(value);
}

@Component({
  selector: 'app-change-coupling',
  imports: [CodeCityTemplateDirective, LocalizedNumberPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './change-coupling.component.scss',
  templateUrl: './change-coupling.component.html',
})
export class ChangeCouplingComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  private readonly transloco = inject(TranslocoService);
  readonly state = inject(CodeCityStateService);

  id = input.required<string>();

  resource = pageResource(
    () => this.facade.getChangeCoupling(this.id()),
    () => this.id(),
  );

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  fileCouplingItems = computed<FileCouplingItem[]>(() => {
    if (!this.resource.hasValue()) return [];

    return this.resource
      .value()
      .map((item) => ({
        path: item.path,
        count: item.coupledFiles.length,
        color: toHex(getIntensityColorForFiles(item.coupledFiles.length)),
      }))
      .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path, this.activeLang()));
  });

  selectedFile = computed(() => {
    const selectedPath = this.state.selectedNodePath();
    if (selectedPath === null || !this.resource.hasValue()) return null;

    return this.resource.value().find((item) => item.path === selectedPath) ?? null;
  });

  selectedCoupledFiles = computed<CoupledFileItem[]>(() =>
    (this.selectedFile()?.coupledFiles ?? []).map((item) => ({
      ...item,
      color: toHex(getIntensityColorForCommits(item.percentage)),
    })),
  );

  colorData = computed<PathColorData[]>(() => {
    if (!this.resource.hasValue()) return [];

    const selectedFile = this.selectedFile();
    if (!selectedFile) {
      return this.resource.value().map((item) => ({
        path: item.path,
        color: getIntensityColorForFiles(item.coupledFiles.length),
        intensity: 1,
      }));
    }

    return selectedFile.coupledFiles
      .filter((item) => item.path !== selectedFile.path)
      .map((item) => ({
        path: item.path,
        color: getIntensityColorForCommits(item.percentage),
        intensity: 1,
      }));
  });

  constructor() {
    effect((onCleanup) => {
      this.state.colorData.set(this.colorData());
      onCleanup(() => this.state.colorData.set([]));
    });
  }
}

const toHex = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;
