import { computed, Directive, input } from '@angular/core';

@Directive({
  selector: 'button[btn]',
  host: { '[class]': 'variantClass()' },
})
export class ButtonDirective {
  variant = input<'primary' | 'secondary' | 'danger'>('primary', { alias: 'btn' });
  variantClass = computed(() => `btn btn--${this.variant()}`);
}
