import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import AboutPageComponent from './about-page.component';

describe('AboutPageComponent', () => {
  let component: AboutPageComponent;
  let fixture: ComponentFixture<AboutPageComponent>;
  let locationSpy: { back: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    locationSpy = { back: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AboutPageComponent, getTranslocoModule()],
      providers: [{ provide: Location, useValue: locationSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('focuses back button after view init', () => {
    const focusSpy = vi.spyOn(component.backBtn.nativeElement, 'focus');
    component.ngAfterViewInit();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('calls location.back() on close()', () => {
    component.close();
    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('calls close() when back button is clicked', () => {
    const closeSpy = vi.spyOn(component, 'close');
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.click();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('renders team member names', () => {
    const text: string = fixture.nativeElement.textContent;
    for (const member of component.teamMembers) {
      expect(text).toContain(member.name);
    }
  });

  it('renders team member links with correct href', () => {
    const links: HTMLAnchorElement[] = fixture.nativeElement.querySelectorAll('a');
    const hrefs = Array.from(links).map((a) => a.href);
    for (const member of component.teamMembers) {
      expect(hrefs).toContain(member.link);
    }
  });
});
