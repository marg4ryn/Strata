import { Component, signal } from '@angular/core';
import type { ResourceRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco';
import { ResourcePageComponent } from './resource-page.component';
import { AnalysisErrorComponent } from '../analysis-error/analysis-error.component';
import { AnalysisLoadingComponent } from '../analysis-loading/analysis-loading.component';
import { AnalysisNotFoundComponent } from '../analysis-not-found/analysis-not-found.component';

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
  } as ResourceRef<T>;
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

  const DELAY = 200;
  const MIN_DISPLAY = 300;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [HostComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('does not display AnalysisLoadingComponent immediately when loading starts', () => {
    host.data.set(createResourceRefMock<string>({ isLoading: signal(true) }));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeFalsy();
  });

  it('displays AnalysisLoadingComponent after DELAY when still loading', () => {
    host.data.set(createResourceRefMock<string>({ isLoading: signal(true) }));
    fixture.detectChanges();

    vi.advanceTimersByTime(DELAY);
    fixture.detectChanges();

    const loading = fixture.debugElement.query(By.directive(AnalysisLoadingComponent));
    expect(loading).toBeTruthy();
  });

  it('does not display AnalysisLoadingComponent if data resolves before DELAY (cache hit)', () => {
    const isLoading = signal(true);
    host.data.set(createResourceRefMock<string>({ isLoading }));
    fixture.detectChanges();

    vi.advanceTimersByTime(DELAY / 2);
    isLoading.set(false);
    fixture.detectChanges();

    vi.advanceTimersByTime(DELAY);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeFalsy();
  });

  it('keeps AnalysisLoadingComponent visible for MIN_DISPLAY even if loading finishes early', () => {
    const isLoading = signal(true);
    host.data.set(createResourceRefMock<string>({ isLoading }));
    fixture.detectChanges();

    vi.advanceTimersByTime(DELAY);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeTruthy();

    isLoading.set(false);
    fixture.detectChanges();

    vi.advanceTimersByTime(MIN_DISPLAY - 50);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeTruthy();

    vi.advanceTimersByTime(50);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeFalsy();
  });

  it('ignores a redundant isLoading=true while the loader is already visible (does not reset loadingShownAt)', () => {
    const isLoading = signal(true);
    host.data.set(createResourceRefMock<string>({ isLoading }));
    fixture.detectChanges();

    // t=200: the loader becomes visible and loadingShownAt is set to 200
    vi.advanceTimersByTime(DELAY);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeTruthy();

    // t=250: flicker - isLoading briefly becomes false and then true again (e.g. during a refetch)
    vi.advanceTimersByTime(50);
    isLoading.set(false);
    fixture.detectChanges();
    isLoading.set(true);
    fixture.detectChanges();

    // Without the guard, another DELAY would trigger a new "show" and reset loadingShownAt
    vi.advanceTimersByTime(DELAY); // t=450
    fixture.detectChanges();

    // t=450: the data finally becomes available
    isLoading.set(false);
    fixture.detectChanges();

    // MIN_DISPLAY is measured from the original loadingShownAt (t=200), so the loader should hide at t=500
    // If loadingShownAt were reset to 450, the loader would remain visible until t=750
    vi.advanceTimersByTime(49); // t=499
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeTruthy();

    vi.advanceTimersByTime(2); // t=501
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeFalsy();
  });

  it('displays nothing when there is no value, error, or loading state', () => {
    host.data.set(createResourceRefMock<string>());
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(AnalysisNotFoundComponent))).toBeFalsy();
    expect(fixture.debugElement.query(By.directive(AnalysisErrorComponent))).toBeFalsy();
    expect(fixture.debugElement.query(By.directive(AnalysisLoadingComponent))).toBeFalsy();
  });
});
