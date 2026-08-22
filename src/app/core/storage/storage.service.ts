import { Service, inject } from '@angular/core';

import { LoggerService } from '../logging/logger/logger.service';

@Service()
export class StorageService {
  private readonly logger = inject(LoggerService);

  getItem<T>(storage: Storage, key: string): T | null {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch (error) {
      this.logger.error(`Storage Service failed to read: ${key}`, error);
      return null;
    }

    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.error(`Storage Service failed to parse: ${key}, clearing corrupted data`, error);
      this.removeItem(storage, key);
      return null;
    }
  }

  setItem<T>(storage: Storage, key: string, value: T): void {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Storage Service failed to save: ${key}`, error);
    }
  }

  removeItem(storage: Storage, key: string): void {
    try {
      storage.removeItem(key);
    } catch (error) {
      this.logger.error(`Storage Service failed to remove: ${key}`, error);
    }
  }
}
