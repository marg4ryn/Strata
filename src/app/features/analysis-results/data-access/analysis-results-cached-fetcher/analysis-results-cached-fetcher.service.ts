import { Service, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';

const MAX_CACHES = 5;
const REGISTRY_CACHE_NAME = '__cache-registry__';
const REGISTRY_KEY = '/registry';

interface CacheRegistryEntry {
  cacheName: string;
  lastUsed: number;
}

@Service()
export class AnalysisResultsCachedFetcherService {
  private readonly logger = inject(LoggerService);

  async getOrFetch<T>(cacheName: string, cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await this.tryReadFromCache<T>(cacheName, cacheKey);
    await this.touchRegistry(cacheName);

    if (cached) {
      return cached;
    }

    const data = await fetchFn();
    await this.tryWriteToCache<T>(cacheName, cacheKey, data);
    return data;
  }

  async tryReadFromCache<T>(cacheName: string, cacheKey: string): Promise<T | null> {
    let cache: Cache;

    try {
      cache = await caches.open(cacheName);
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to open cache: ${cacheName}`,
        error,
      );
      return null;
    }

    let response: Response | undefined;

    try {
      response = await cache.match(cacheKey);
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to read key: ${cacheKey}`,
        error,
      );
      return null;
    }

    if (!response) {
      return null;
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to parse: ${cacheKey}, clearing corrupted data`,
        error,
      );
      await this.deleteCacheKey(cache, cacheKey);
      return null;
    }
  }

  async tryWriteToCache<T>(cacheName: string, cacheKey: string, data: T): Promise<void> {
    try {
      const cache = await caches.open(cacheName);
      const response = new Response(JSON.stringify(data));
      await cache.put(cacheKey, response);
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to save to cache: ${cacheName}/${cacheKey}`,
        error,
      );
    }
  }

  async touchRegistry(cacheName: string): Promise<void> {
    const registry = await this.readRegistry();
    const existing = registry.find((entry) => entry.cacheName === cacheName);

    if (existing) {
      existing.lastUsed = Date.now();
    } else {
      registry.push({ cacheName, lastUsed: Date.now() });
    }

    await this.writeRegistry(registry);
    await this.enforceMaxCaches();
  }

  async readRegistry(): Promise<CacheRegistryEntry[]> {
    try {
      const cache = await caches.open(REGISTRY_CACHE_NAME);
      const response = await cache.match(REGISTRY_KEY);
      if (!response) return [];
      return (await response.json()) as CacheRegistryEntry[];
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to read cache registry`,
        error,
      );
      return [];
    }
  }

  async writeRegistry(registry: CacheRegistryEntry[]): Promise<void> {
    try {
      const cache = await caches.open(REGISTRY_CACHE_NAME);
      await cache.put(REGISTRY_KEY, new Response(JSON.stringify(registry)));
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to save cache registry`,
        error,
      );
    }
  }

  async enforceMaxCaches(): Promise<void> {
    const registry = await this.readRegistry();

    if (registry.length > MAX_CACHES) {
      const sorted = [...registry].sort((a, b) => a.lastUsed - b.lastUsed);
      const toEvict = sorted.slice(0, registry.length - MAX_CACHES);

      for (const entry of toEvict) {
        await this.deleteCacheName(entry.cacheName);
      }

      const evictedNames = new Set(toEvict.map((entry) => entry.cacheName));
      await this.writeRegistry(registry.filter((entry) => !evictedNames.has(entry.cacheName)));
    }
  }

  async deleteCacheKey(cache: Cache, cacheKey: string): Promise<void> {
    try {
      await cache.delete(cacheKey);
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to delete: ${cacheKey}`,
        error,
      );
    }
  }

  async deleteCacheName(cacheName: string): Promise<void> {
    try {
      await caches.delete(cacheName);
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to delete: ${cacheName}`,
        error,
      );
    }
  }
}
