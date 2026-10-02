import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

import type { CityItem } from '../../analysis-results.model';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  items = input<readonly CityItem[]>([]);
  maxResults = input(10);

  selectedNode = model<string | null>(null);
  hoveredNode = model<string | null>(null);
  keyboardNavigationActive = model(false);

  query = signal('');
  isFocused = signal(false);

  filteredItems = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) return [];
    return this.items().filter((item) => item.name.toLocaleLowerCase().includes(query));
  });

  showDropdown = computed(() => this.isFocused());
  visibleItems = computed(() => this.filteredItems().slice(0, this.maxResults()));

  handleFocusOut(event: FocusEvent): void {
    const container = event.currentTarget;
    const nextTarget = event.relatedTarget;
    if (
      container instanceof HTMLElement &&
      nextTarget instanceof Node &&
      container.contains(nextTarget)
    ) {
      return;
    }
    this.isFocused.set(false);
    this.keyboardNavigationActive.set(false);
  }

  handleKeydown(event: KeyboardEvent): void {
    const container = event.currentTarget;
    const target = event.target;
    if (!(container instanceof HTMLElement) || !(target instanceof HTMLElement)) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.isFocused.set(false);
      this.keyboardNavigationActive.set(false);
      target.blur();
      return;
    }

    const results = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.search-bar__result'),
    );
    if (results.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.keyboardNavigationActive.set(true);
      const focusedResult = target.closest<HTMLButtonElement>('.search-bar__result');
      const currentIndex = focusedResult ? results.indexOf(focusedResult) : -1;
      const nextIndex =
        currentIndex < 0
          ? event.key === 'ArrowDown'
            ? 0
            : results.length - 1
          : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      results[nextIndex].focus();
      return;
    }

    if (event.key === 'Enter') {
      const focusedResult = target.closest<HTMLButtonElement>('.search-bar__result');
      const result = focusedResult ?? (target instanceof HTMLInputElement ? results[0] : null);
      if (result) {
        event.preventDefault();
        result.click();
      }
    }
  }

  selectCityNode(item: CityItem): void {
    this.selectedNode.set(item.path);
    this.query.set('');
    this.isFocused.set(false);
    this.keyboardNavigationActive.set(false);
  }

  setCityNodeHover(item: CityItem): void {
    this.hoveredNode.set(item.path);
  }

  setCityNodePointerHover(item: CityItem): void {
    this.keyboardNavigationActive.set(false);
    this.setCityNodeHover(item);
  }

  resetCityNodeHover(): void {
    this.hoveredNode.set(null);
  }
}
