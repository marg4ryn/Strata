import { Service } from '@angular/core';

@Service()
export class BrowserLanguageService {
  getLang(availableLangs: string[], fallback: string): string {
    const navLang = navigator.language?.split('-')[0];
    return availableLangs.includes(navLang) ? navLang : fallback;
  }
}
