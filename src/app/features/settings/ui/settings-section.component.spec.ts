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
    fixture.componentRef.setInput('label', 'test');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('sets label via input', () => {
    const label = 'test label';
    fixture.componentRef.setInput('label', label);
    fixture.detectChanges();
    expect(component.label()).toBe(label);
  });
});
