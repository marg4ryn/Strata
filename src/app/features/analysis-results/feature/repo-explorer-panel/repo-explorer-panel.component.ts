import {
  ChangeDetectionStrategy,
  Component,
  signal,
  input,
  model,
  computed,
  effect,
  inject,
  resource,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { LocalizedNumberPipe, LocalizedDatePipe } from '@app/shared/pipes';
import { InfoTooltipComponent, LoadingSpinnerComponent } from '@app/shared/components';
import type {
  CityNode,
  FileDetails,
  KnowledgeRisk,
} from '@app/features/analysis-results/analysis-results.model';
import { AnalysisResultsFacade } from '../../analysis-results.facade';

type NodePathMap = Map<string, CityNode>;

const KNOWLEDGE_RISK_KEYS: Record<KnowledgeRisk, string> = {
  ABANDONED: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.abandoned'),
  SINGLE_OWNER: marker(
    'analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.singleOwner',
  ),
  BALANCED: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.balanced'),
  DIFFUSED: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.diffused'),
  UNKNOWN: marker('analysisResults.codeCity.explorer.metrics.knowledgeRisk.values.unknown'),
};

@Component({
  selector: 'app-repo-explorer-panel',
  imports: [
    TranslocoPipe,
    LoadingSpinnerComponent,
    LocalizedNumberPipe,
    LocalizedDatePipe,
    InfoTooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './repo-explorer-panel.component.scss',
  templateUrl: './repo-explorer-panel.component.html',
})
export class RepoExplorerPanelComponent {
  private readonly facade = inject(AnalysisResultsFacade);
  private readonly transloco = inject(TranslocoService);

  id = input.required<string>();
  cityNode = input<CityNode | null>(null);
  delay = input<number>(200);
  minDisplay = input<number>(300);

  selectedNodePath = model<string | null>(null);
  hoveredNodePath = model<string | null>(null);

  selectedNode = signal<CityNode | null>(null);
  showLoading = signal(false);

  private loadingShownAt: number | null = null;

  private nodePathMap: NodePathMap = new Map();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  constructor() {
    effect(() => {
      const cityNode = this.cityNode();
      if (cityNode !== null) {
        this.nodePathMap.clear();
        this.createNodePathMap(cityNode);
      }
    });

    effect(() => {
      this.selectCityNodeByPath(this.selectedNodePath());
    });

    effect((onCleanup) => {
      const isLoading = this.fileDetails.isLoading();

      if (isLoading) {
        if (!untracked(() => this.showLoading())) {
          const id = setTimeout(() => {
            this.showLoading.set(true);
            this.loadingShownAt = Date.now();
          }, this.delay());
          onCleanup(() => clearTimeout(id));
        }
      } else {
        if (this.showLoading() && this.loadingShownAt !== null) {
          const elapsed = Date.now() - this.loadingShownAt;
          const remaining = Math.max(this.minDisplay() - elapsed, 0);
          const id = setTimeout(() => {
            this.showLoading.set(false);
            this.loadingShownAt = null;
          }, remaining);
          onCleanup(() => clearTimeout(id));
        } else {
          this.showLoading.set(false);
        }
      }
    });
  }

  fileDetails = resource<FileDetails, { analysisId: string; filePath: string } | undefined>({
    params: () => {
      const node = this.selectedNode();
      return node?.type === 'file' ? { analysisId: this.id(), filePath: node.path } : undefined;
    },
    loader: ({ params }) => this.facade.getFileDetails(params.analysisId, params.filePath),
  });

  details = computed(() => (this.fileDetails.hasValue() ? this.fileDetails.value() : undefined));

  sortedChildren = computed(() => {
    const children = this.selectedNode()?.children;
    if (children !== undefined) {
      return [...children].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name, this.activeLang(), { sensitivity: 'accent' });
      });
    }
    return [];
  });

  navigateUp(): void {
    const path = this.selectedNodePath();
    if (path === null) return;

    const idx = path.lastIndexOf('/');
    this.selectedNodePath.set(idx > 0 ? path.slice(0, idx) : '/');
  }

  getChildrenCount(node: CityNode): number {
    return node.children?.length || 0;
  }

  selectChildNode(node: CityNode): void {
    this.selectedNodePath.set(node.path);
    this.hoveredNodePath.set(node.path);
  }

  handleChildKeydown(event: KeyboardEvent, node: CityNode): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectChildNode(node);
    }
  }

  getKnowledgeRiskKey(value: string): string {
    return KNOWLEDGE_RISK_KEYS[value as KnowledgeRisk] ?? KNOWLEDGE_RISK_KEYS.UNKNOWN;
  }

  private selectCityNodeByPath(path: string | null): void {
    if (!path) {
      this.selectedNode.set(null);
      return;
    }

    const target = this.findNodeByPath(path);
    if (!target) return;

    this.selectedNode.set(target);
  }

  private findNodeByPath(path: string): CityNode | undefined {
    return this.nodePathMap.get(path);
  }

  private createNodePathMap(root: CityNode): void {
    if (root.children) {
      for (const child of root.children) {
        this.createNodePathMap(child);
      }
    }

    if (!this.nodePathMap.has(root.path)) {
      this.nodePathMap.set(root.path, root);
    }
  }
}
