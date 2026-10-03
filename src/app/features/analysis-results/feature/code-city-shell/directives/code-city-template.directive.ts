import { Directive, TemplateRef, inject } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { CodeCityStateService } from '../services/code-city-state.service';

@Directive({ selector: '[shellTemplate]' })
export class CodeCityTemplateDirective implements OnInit, OnDestroy {
  private tpl = inject<TemplateRef<unknown>>(TemplateRef);
  private state = inject(CodeCityStateService);

  ngOnInit(): void {
    this.state.template.set(this.tpl);
  }

  ngOnDestroy(): void {
    this.state.template.set(null);
  }
}
