import { Service, inject } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger.service';
import { CACHE_CONFIG } from './cache.config';

interface CacheRegistryEntry {
  cacheName: string;
  lastUsed: number;
}

@Service()
export class AnalysisResultsCachedFetcherService {
  private readonly logger = inject(LoggerService);
  private readonly config = inject(CACHE_CONFIG);

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

  private async tryReadFromCache<T>(cacheName: string, cacheKey: string): Promise<T | null> {
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

  private async tryWriteToCache<T>(cacheName: string, cacheKey: string, data: T): Promise<void> {
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

  private async touchRegistry(cacheName: string): Promise<void> {
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

  private async readRegistry(): Promise<CacheRegistryEntry[]> {
    try {
      const cache = await caches.open(this.config.registryCacheName);
      const response = await cache.match(this.config.registryKey);
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

  private async writeRegistry(registry: CacheRegistryEntry[]): Promise<void> {
    try {
      const cache = await caches.open(this.config.registryCacheName);
      await cache.put(this.config.registryKey, new Response(JSON.stringify(registry)));
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to save cache registry`,
        error,
      );
    }
  }

  private async enforceMaxCaches(): Promise<void> {
    const registry = await this.readRegistry();

    if (registry.length > this.config.maxCaches) {
      const sorted = [...registry].sort((a, b) => a.lastUsed - b.lastUsed);
      const toEvict = sorted.slice(0, registry.length - this.config.maxCaches);

      for (const entry of toEvict) {
        await this.deleteCacheName(entry.cacheName);
      }

      const evictedNames = new Set(toEvict.map((entry) => entry.cacheName));
      await this.writeRegistry(registry.filter((entry) => !evictedNames.has(entry.cacheName)));
    }
  }

  private async deleteCacheKey(cache: Cache, cacheKey: string): Promise<void> {
    try {
      await cache.delete(cacheKey);
    } catch (error) {
      this.logger.warn(
        `Analysis Results Cached Fetcher Service failed to delete: ${cacheKey}`,
        error,
      );
    }
  }

  private async deleteCacheName(cacheName: string): Promise<void> {
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
