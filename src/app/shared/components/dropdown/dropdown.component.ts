import type {
  ElementRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkListbox, CdkListboxModule } from '@angular/cdk/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

export interface DropdownOption<T> {
  value: T;
  label?: string;
  labelKey?: string;
}

@Component({
  selector: 'app-dropdown',
  imports: [A11yModule, CdkListbox, CdkListboxModule, OverlayModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent<T> {
  readonly options = input.required<readonly DropdownOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabelKey = input<string>(marker('common.ariaLabel.selectOption'));

  readonly selectionChange = output<T>();
  readonly openedChange = output<boolean>();

  private readonly listbox = viewChild.required(CdkListbox);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('triggerButton');

  readonly isOpen = signal(false);

  get currentOption(): DropdownOption<T> {
    return this.options().find((option) => option.value === this.value()) ?? this.options()[0];
  }

  onOverlayAttached(): void {
    this.listbox().focus();
  }

  select(values: readonly T[]): void {
    const [selected] = values;
    this.selectionChange.emit(selected);
    this.close();
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.setOpen(false);
    setTimeout(() => this.trigger().nativeElement.focus(), 0);
  }

  toggle(): void {
    this.setOpen(!this.isOpen());
  }

  private setOpen(open: boolean): void {
    this.isOpen.set(open);
    this.openedChange.emit(open);
  }
}
