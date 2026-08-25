import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionComponent } from './settings-section.component';

describe('SettingsSectionComponent', () => {
  let component: SettingsSectionComponent;
  let fixture: ComponentFixture<SettingsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('headerKey', 'test');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('sets headerKey via input', () => {
    const headerKey = 'testKey';
    fixture.componentRef.setInput('headerKey', headerKey);
    fixture.detectChanges();
    expect(component.headerKey()).toBe(headerKey);
  });
});
