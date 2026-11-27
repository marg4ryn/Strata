import { Component, signal } from '@angular/core';
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { ButtonDirective } from './button.directive';
import type { ButtonVariant } from './button.directive';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'danger'];

@Component({
  template: `<button [btn]="variant()">Click</button>`,
  imports: [ButtonDirective],
})
class TestHostComponent {
  variant = signal<ButtonVariant>('primary');
}

@Component({
  template: `<button btn="primary">Click</button>`,
  imports: [ButtonDirective],
})
class DefaultHostComponent {}

function getButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button');
}

function expectOnlyVariantClass(fixture: ComponentFixture<unknown>, active: ButtonVariant): void {
  const button = getButton(fixture);
  expect(button.classList.contains('btn')).toBe(true);

  for (const variant of VARIANTS) {
    expect(button.classList.contains(`btn--${variant}`)).toBe(variant === active);
  }
}

describe('ButtonDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('applies default class', () => {
    expectOnlyVariantClass(fixture, 'primary');
  });

  it('applies secondary class', () => {
    fixture.componentInstance.variant.set('secondary');
    fixture.detectChanges();

    expectOnlyVariantClass(fixture, 'secondary');
  });

  it('applies danger class', () => {
    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();

    expectOnlyVariantClass(fixture, 'danger');
  });

  it('reacts to repeated changes on the same instance', () => {
    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();
    expectOnlyVariantClass(fixture, 'danger');

    fixture.componentInstance.variant.set('secondary');
    fixture.detectChanges();
    expectOnlyVariantClass(fixture, 'secondary');

    fixture.componentInstance.variant.set('primary');
    fixture.detectChanges();
    expectOnlyVariantClass(fixture, 'primary');
  });
});

describe('ButtonDirective', () => {
  it('applies the class when the directive is used as a static attribute', async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultHostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(DefaultHostComponent);
    fixture.detectChanges();

    expectOnlyVariantClass(fixture, 'primary');
  });
});
