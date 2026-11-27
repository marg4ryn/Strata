import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { CodeCityShellComponent } from './code-city-shell.component';

describe.skip('CodeCityShellComponent', () => {
  let component: CodeCityShellComponent;
  let fixture: ComponentFixture<CodeCityShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeCityShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeCityShellComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
