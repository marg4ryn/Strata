import { Service } from '@angular/core';

import { injectLogger } from '@app/core/logging/inject-logger/inject-logger';

@Service()
export class StorageService {
  private readonly logger = injectLogger('StorageService');

  getItem<T>(storage: Storage, key: string): T | null {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch (error) {
      this.logger.error('Storage read failed', { key, error });
      return null;
    }

    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn('Invalid stored data, removing', { key, error });
      this.removeItem(storage, key);
      return null;
    }
  }

  setItem<T>(storage: Storage, key: string, value: T): void {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error('Storage write failed', { key, error });
    }
  }

  removeItem(storage: Storage, key: string): void {
    try {
      storage.removeItem(key);
    } catch (error) {
      this.logger.error('Storage removal failed', { key, error });
    }
  }
}
