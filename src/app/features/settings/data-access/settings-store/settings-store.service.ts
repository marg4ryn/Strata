import { Service, signal } from '@angular/core';

@Service()
export class SettingsStoreService {
  readonly showPanel = signal<boolean>(false);
}
