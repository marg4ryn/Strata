import {
  ChangeDetectionStrategy,
  Component,
  signal,
  input,
  model,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

import type { CityNode } from '@app/features/analysis-results/analysis-results.model';

type NodePathMap = Map<string, CityNode>;

@Component({
  selector: 'app-repo-explorer-panel',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './repo-explorer-panel.component.scss',
  templateUrl: './repo-explorer-panel.component.html',
})
export class RepoExplorerPanelComponent {
  private readonly transloco = inject(TranslocoService);

  cityNode = input<CityNode | null>(null);

  selectedNodePath = model<string | null>(null);
  hoveredNodePath = model<string | null>(null);

  selectedNode = signal<CityNode | null>(null);

  private nodePathMap: NodePathMap = new Map();

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

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
  }

  navigateUp(): void {
    const path = this.selectedNodePath();
    if (path === null) return;

    const idx = path.lastIndexOf('/');
    this.selectedNodePath.set(idx > 0 ? path.slice(0, idx) : '/');
  }

  getChildrenCount(node: CityNode): number {
    return node.children?.length || 0;
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
