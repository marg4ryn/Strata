import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { getTranslocoModule } from '@app/core/transloco/transloco-testing.module';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, getTranslocoModule()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders copyright text', () => {
    const span: HTMLElement = fixture.nativeElement.querySelector('.footer__copyright');
    expect(span.textContent).toContain('2026 Strata');
  });

  it('renders about link with routerLink="/about"', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.footer__about-link');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/about');
  });

  it('has correct accessibility attributes on link', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.footer__about-link');
    expect(link.getAttribute('title')).toBe('About the tool');
    expect(link.getAttribute('aria-label')).toBe('About the tool');
  });

  it('renders link text "About"', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.footer__about-link');
    expect(link.textContent?.trim()).toBe('About');
  });
});
