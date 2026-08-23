import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';

interface TeamMember {
  name: string;
  link: string;
}

@Component({
  selector: 'app-about-page',
  imports: [],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss',
})
export default class AboutPageComponent implements AfterViewInit {
  @ViewChild('backBtn', { read: ElementRef }) backBtn!: ElementRef<HTMLButtonElement>;

  private readonly location = inject(Location);

  ngAfterViewInit() {
    this.backBtn.nativeElement.focus();
  }

  readonly teamMembers: TeamMember[] = [
    { name: 'Wiktor Piekarski', link: 'https://github.com/Vixoner' },
    { name: 'Jan Powęski', link: 'https://github.com/marg4ryn' },
    { name: 'Michał Sosnowski', link: 'https://github.com/SosnowskiMichal' },
    { name: 'Michał Wąsiński', link: 'https://github.com/micwasi15' },
  ];

  close(): void {
    this.location.back();
  }
}
