import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { RepoExplorerPanelComponent } from './repo-explorer-panel.component';

describe('RepoExplorerPanelComponent', () => {
  let component: RepoExplorerPanelComponent;
  let fixture: ComponentFixture<RepoExplorerPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepoExplorerPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RepoExplorerPanelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
