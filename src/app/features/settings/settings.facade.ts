import { Service, inject, computed } from '@angular/core';

import { SettingsStoreService } from './data-access/settings-store/settings-store.service';
import { SettingsService } from './data-access/service/settings.service';

@Service()
export class SettingsFacade {
  private readonly store = inject(SettingsStoreService);
  private readonly service = inject(SettingsService);

  readonly showPanel = computed(() => this.store.showPanel());

  openPanel(): void {
    this.service.openPanel();
  }

  closePanel(): void {
    this.service.closePanel();
  }
}
