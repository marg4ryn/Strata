import { Service, inject } from '@angular/core';

import { injectLogger } from '@app/core/logging/inject-logger/inject-logger';
import { SettingsStoreService } from '../settings-store/settings-store.service';

@Service()
export class SettingsService {
  private readonly logger = injectLogger('SettingsService');
  private readonly store = inject(SettingsStoreService);

  openPanel(): void {
    this.logger.debug('Settings panel opened');
    this.store.showPanel.set(true);
  }

  closePanel(): void {
    this.logger.debug('Settings panel closed');
    this.store.showPanel.set(false);
  }
}
