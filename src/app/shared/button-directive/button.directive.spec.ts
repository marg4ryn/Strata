import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ButtonDirective } from './button.directive';

@Component({
  template: `<button [btn]="variant()">Click</button>`,
  imports: [ButtonDirective],
})
class TestHostComponent {
  variant = signal<'primary' | 'secondary' | 'danger'>('primary');
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
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.classList.contains('btn')).toBeTruthy();
    expect(button.classList.contains('btn--primary')).toBeTruthy();
    expect(button.classList.contains('btn--secondary')).toBeFalsy();
    expect(button.classList.contains('btn--danger')).toBeFalsy();
  });

  it('applies secondary class', () => {
    fixture.componentInstance.variant.set('secondary');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.classList.contains('btn')).toBeTruthy();
    expect(button.classList.contains('btn--primary')).toBeFalsy();
    expect(button.classList.contains('btn--secondary')).toBeTruthy();
    expect(button.classList.contains('btn--danger')).toBeFalsy();
  });

  it('applies danger class', () => {
    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.classList.contains('btn')).toBeTruthy();
    expect(button.classList.contains('btn--primary')).toBeFalsy();
    expect(button.classList.contains('btn--secondary')).toBeFalsy();
    expect(button.classList.contains('btn--danger')).toBeTruthy();
  });

  it('exposes directive instance', () => {
    const directive = fixture.debugElement
      .query(By.directive(ButtonDirective))
      .injector.get(ButtonDirective);

    expect(directive.variant()).toBe('primary');
  });

  it('updates input value on host change', () => {
    fixture.componentInstance.variant.set('secondary');
    fixture.detectChanges();

    const directive = fixture.debugElement
      .query(By.directive(ButtonDirective))
      .injector.get(ButtonDirective);

    expect(directive.variant()).toBe('secondary');
  });
});
