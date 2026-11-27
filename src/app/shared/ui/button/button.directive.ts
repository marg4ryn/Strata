import { computed, Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

@Directive({
  selector: 'button[btn]',
  host: { '[class]': 'variantClass()' },
})
export class ButtonDirective {
  variant = input<ButtonVariant>('primary', { alias: 'btn' });
  variantClass = computed(() => `btn btn--${this.variant()}`);
}
