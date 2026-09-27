import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { CodeCityStateService } from '../services/code-city-state.service';

@Directive({ selector: '[shellColumn]' })
export class CodeCityShellColumnDirective implements OnInit, OnDestroy {
  shellColumn = input.required<'left' | 'right'>();

  private tpl = inject<TemplateRef<unknown>>(TemplateRef);
  private state = inject(CodeCityStateService);

  ngOnInit(): void {
    this.signal().set(this.tpl);
  }

  ngOnDestroy(): void {
    this.signal().set(null);
  }

  private signal() {
    return this.shellColumn() === 'left' ? this.state.leftColumn : this.state.rightColumn;
  }
}
