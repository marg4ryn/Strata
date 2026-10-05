import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import { FileTypesComponent } from './file-types.component';

describe.skip('FileTypesComponent', () => {
  let component: FileTypesComponent;
  let fixture: ComponentFixture<FileTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTypesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileTypesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
