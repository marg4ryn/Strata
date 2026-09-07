import { A11yModule } from '@angular/cdk/a11y';
import { CdkListbox, CdkListboxModule } from '@angular/cdk/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

export interface DropdownOption<T> {
  value: T;
  label: string;
  labelKey?: string;
}

@Component({
  selector: 'app-dropdown',
  imports: [A11yModule, CdkListbox, CdkListboxModule, OverlayModule, TranslocoPipe],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent<T> {
  readonly options = input.required<readonly DropdownOption<T>[]>();
  readonly value = input.required<T>();
  readonly classPrefix = input('dropdown');
  readonly ariaLabel = input('Select an option');

  readonly selectionChange = output<readonly T[]>();
  readonly openedChange = output<boolean>();

  private readonly listbox = viewChild.required(CdkListbox);
  private readonly triggerButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('triggerButton');

  readonly isOpen = signal(false);

  get currentOption(): DropdownOption<T> {
    return this.options().find((option) => option.value === this.value()) ?? this.options()[0];
  }

  toggle(): void {
    this.setOpen(!this.isOpen());
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.setOpen(false);
    setTimeout(() => this.triggerButton().nativeElement.focus(), 0);
  }

  onOverlayAttached(): void {
    this.listbox().focus();
  }

  select(values: readonly T[]): void {
    this.selectionChange.emit(values);
    this.close();
  }

  private setOpen(open: boolean): void {
    this.isOpen.set(open);
    this.openedChange.emit(open);
  }
}
