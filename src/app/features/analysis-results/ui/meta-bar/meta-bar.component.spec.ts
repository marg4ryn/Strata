import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { getTranslocoModule } from '@app/core/transloco';
import { MetaBarComponent } from './meta-bar.component';

describe('MetaBarComponent', () => {
  let fixture: ComponentFixture<MetaBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetaBarComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(MetaBarComponent);
    await fixture.whenStable();
  });

  it('always displays repo name span', () => {
    const repoNameSpan = fixture.debugElement.query(By.css('.analysis-meta-bar__repo-name'));
    expect(repoNameSpan).toBeTruthy();
  });

  it('displays repo name when provided', () => {
    fixture.componentRef.setInput('repoName', 'project');
    fixture.detectChanges();
    const repoNameSpan = fixture.debugElement.query(By.css('.analysis-meta-bar__repo-name'));
    expect(repoNameSpan.nativeElement.textContent).toContain('project');
  });

  it('does not render date range when not provided', () => {
    const dateRangeSpan = fixture.debugElement.query(By.css('.analysis-meta-bar__date-range'));
    expect(dateRangeSpan).toBeFalsy();
  });

  it('renders date range when provided', () => {
    const dateRange = { startDate: '2026-01-01', endDate: '2026-01-31' };
    fixture.componentRef.setInput('dateRange', dateRange);
    fixture.detectChanges();

    const dateRangeSpan = fixture.debugElement.query(By.css('.analysis-meta-bar__date-range'));
    const expectedStart = new Date(2026, 0, 1).toLocaleString('en', { dateStyle: 'short' });
    const expectedEnd = new Date(2026, 0, 31).toLocaleString('en', { dateStyle: 'short' });

    expect(dateRangeSpan.nativeElement.textContent).toContain(expectedStart);
    expect(dateRangeSpan.nativeElement.textContent).toContain(expectedEnd);
  });
});
