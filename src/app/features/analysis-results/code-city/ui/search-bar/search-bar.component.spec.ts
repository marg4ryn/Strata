import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { getTranslocoModule } from '@app/core/transloco';
import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the dropdown when the search input receives focus', () => {
    const input = fixture.nativeElement.querySelector('input');

    input.focus();

    expect(component.showDropdown()).toBe(true);
  });

  it('navigates results with arrow keys and selects with Enter', () => {
    const firstItem = { name: 'README.md', path: '/README.md', type: 'file' };
    const secondItem = { name: 'readme-guide.md', path: '/readme-guide.md', type: 'file' };
    fixture.componentRef.setInput('items', [firstItem, secondItem]);
    component.query.set('readme');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    const results = fixture.nativeElement.querySelectorAll('.search-bar__result');
    expect(document.activeElement).toBe(results[0]);

    results[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(results[1]);

    results[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(component.selectedNodePath()).toBe(secondItem.path);
  });

  it('closes the search bar on Escape', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(component.showDropdown()).toBe(false);
    expect(document.activeElement).not.toBe(input);
  });

  it('filters items by name only', () => {
    const matchingItem = { name: 'README.md', path: '/docs/README.md', type: 'file' };
    const pathOnlyMatch = { name: 'guide.md', path: '/README.md/guide.md', type: 'file' };
    fixture.componentRef.setInput('items', [matchingItem, pathOnlyMatch]);
    component.query.set('readme');

    expect(component.filteredItems()).toEqual([matchingItem]);
  });
});
