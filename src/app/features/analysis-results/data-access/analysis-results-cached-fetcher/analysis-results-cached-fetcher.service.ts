import { Service, inject } from '@angular/core';

import { injectLogger } from '@app/core/logging';
import { AnalysisResultsLockService } from '../analysis-results-lock/analysis-results-lock.service';
import { CACHE_CONFIG } from './cache.config';

interface CacheRegistryEntry {
  cacheName: string;
  lastUsed: number;
}

@Service()
export class AnalysisResultsCachedFetcherService {
  private readonly logger = injectLogger('AnalysisResultsCachedFetcherService');
  private readonly locker = inject(AnalysisResultsLockService);
  private readonly config = inject(CACHE_CONFIG);

  async getOrFetch<T>(cacheName: string, cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await this.tryReadFromCache<T>(cacheName, cacheKey);
    await this.touchRegistry(cacheName);

    if (cached !== null) {
      this.logger.debug('Cache hit', { cacheName, cacheKey });
      return cached;
    }

    const data = await fetchFn();
    await this.tryWriteToCache<T>(cacheName, cacheKey, data);
    this.logger.debug('Cache miss - data fetched and stored', { cacheName, cacheKey });
    return data;
  }

  private async tryReadFromCache<T>(cacheName: string, cacheKey: string): Promise<T | null> {
    let cache: Cache;

    try {
      cache = await caches.open(cacheName);
    } catch (error) {
      this.logger.warn('Failed to open cache', { cacheName, error });
      return null;
    }

    let response: Response | undefined;

    try {
      response = await cache.match(cacheKey);
    } catch (error) {
      this.logger.warn('Failed to read key from cache', { cacheKey, error });
      return null;
    }

    if (!response) {
      return null;
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      this.logger.warn('Failed to parse cached data, clearing corrupted entry', {
        cacheKey,
        error,
      });
      await this.deleteCacheKey(cache, cacheKey);
      return null;
    }
  }

  private async tryWriteToCache<T>(cacheName: string, cacheKey: string, data: T): Promise<void> {
    try {
      const cache = await caches.open(cacheName);
      const response = new Response(JSON.stringify(data));
      await cache.put(cacheKey, response);
    } catch (error) {
      this.logger.warn('Failed to save to cache', { cacheName, cacheKey, error });
    }
  }

  private async touchRegistry(cacheName: string): Promise<void> {
    try {
      await this.locker.runExclusive(`${this.config.registryCacheName}`, async () => {
        const registry = await this.readRegistry();
        const now = Date.now();
        const existing = registry.find((e) => e.cacheName === cacheName);

        if (existing) {
          existing.lastUsed = now;
        } else {
          registry.push({ cacheName, lastUsed: now });
        }

        await this.enforceMaxCaches(registry);
      });
    } catch (error) {
      this.logger.warn('Failed to update cache registry', { cacheName, error });
    }
  }

  private async enforceMaxCaches(registry: CacheRegistryEntry[]): Promise<void> {
    const overflow = registry.length - this.config.maxCaches;
    const toEvict =
      overflow > 0 ? [...registry].sort((a, b) => a.lastUsed - b.lastUsed).slice(0, overflow) : [];
    const evictedNames = new Set(toEvict.map((e) => e.cacheName));

    await this.writeRegistry(registry.filter((e) => !evictedNames.has(e.cacheName)));

    for (const name of evictedNames) {
      await this.deleteCacheName(name);
    }

    if (evictedNames.size > 0) {
      this.logger.debug('Evicted old caches to enforce limits', {
        evictedCount: evictedNames.size,
      });
    }
  }

  private async readRegistry(): Promise<CacheRegistryEntry[]> {
    try {
      const cache = await caches.open(this.config.registryCacheName);
      const response = await cache.match(this.config.registryKey);
      if (!response) return [];
      return (await response.json()) as CacheRegistryEntry[];
    } catch (error) {
      this.logger.warn('Failed to read cache registry', { error });
      return [];
    }
  }

  private async writeRegistry(registry: CacheRegistryEntry[]): Promise<void> {
    try {
      const cache = await caches.open(this.config.registryCacheName);
      await cache.put(this.config.registryKey, new Response(JSON.stringify(registry)));
    } catch (error) {
      this.logger.warn('Failed to save cache registry', { error });
    }
  }

  private async deleteCacheKey(cache: Cache, cacheKey: string): Promise<void> {
    try {
      await cache.delete(cacheKey);
    } catch (error) {
      this.logger.warn('Failed to delete cache key', { cacheKey, error });
    }
  }

  private async deleteCacheName(cacheName: string): Promise<void> {
    try {
      await caches.delete(cacheName);
    } catch (error) {
      this.logger.warn('Failed to delete cache', { cacheName, error });
    }
  }
}
