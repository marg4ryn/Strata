import { Component, ResourceRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { ResourcePageComponent } from './resource-page.component';
import { AnalysisErrorComponent } from '../../ui/analysis-error/analysis-error.component';
import { AnalysisLoadingComponent } from '../../ui/analysis-loading/analysis-loading.component';
import { AnalysisNotFoundComponent } from '../../ui/analysis-not-found/analysis-not-found.component';

function createResourceRefMock<T>(overrides: Partial<ResourceRef<T>> = {}) {
  return {
    value: signal(undefined),
    error: signal(undefined),
    isLoading: signal(false),
    hasValue: (() => false) as ResourceRef<T>['hasValue'],
    status: signal('idle'),
    set: vi.fn(),
    update: vi.fn(),
    reload: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  } as unknown as ResourceRef<T>;
}

@Component({
  selector: 'app-host',
  imports: [ResourcePageComponent],
  template: `
    <app-resource-page [data]="data()">
      <ng-template #content let-value>Value: {{ value }}</ng-template>
    </app-resource-page>
  `,
})
class HostComponent {
  data = signal(createResourceRefMock<string>());
}

describe('ResourcePageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('displays the projected content when there is a value', () => {
    host.data.set(
      createResourceRefMock<string>({
        hasValue: (() => true) as ResourceRef<string>['hasValue'],
        value: signal('hello'),
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Value: hello');
  });

  it('displays AnalysisNotFoundComponent for a 404 error', () => {
    const error = new HttpErrorResponse({ status: 404 });
    host.data.set(createResourceRefMock<string>({ error: signal(error) }));
    fixture.detectChanges();

    const notFound = fixture.debugElement.query(By.directive(AnalysisNotFoundComponent));
    expect(notFound).toBeTruthy();
  });

  it('displays AnalysisErrorComponent for errors other than 404', () => {
    const error = new HttpErrorResponse({ status: 500 });
    host.data.set(createResourceRefMock<string>({ error: signal(error) }));
    fixture.detectChanges();

    const errorCmp = fixture.debugElement.query(By.directive(AnalysisErrorComponent));
    expect(errorCmp).toBeTruthy();
    expect(errorCmp.componentInstance.error()).toBe(error);
  });

  it('displays AnalysisLoadingComponent while loading', () => {
    host.data.set(createResourceRefMock<string>({ isLoading: signal(true) }));
    fixture.detectChanges();

    const loading = fixture.debugElement.query(By.directive(AnalysisLoadingComponent));
    expect(loading).toBeTruthy();
  });

  it('displays nothing when there is no value, error, or loading state', () => {
    host.data.set(createResourceRefMock<string>());
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(AnalysisNotFoundComponent))).toBeFalsy();
    expect(fixture.debugElement.query(By.directive(AnalysisErrorComponent))).toBeFalsy();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeFalsy();
  });
});
