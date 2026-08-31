import { InjectionToken } from '@angular/core';

export interface CacheConfig {
  maxCaches: number;
  registryCacheName: string;
  registryKey: string;
}

export const CACHE_CONFIG = new InjectionToken<CacheConfig>('CACHE_CONFIG');
