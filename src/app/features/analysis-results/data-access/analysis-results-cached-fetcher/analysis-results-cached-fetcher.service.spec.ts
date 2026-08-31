import { TestBed } from '@angular/core/testing';

import { LoggerService } from '@app/core/logging/logger.service';
import { AnalysisResultsCachedFetcherService } from './analysis-results-cached-fetcher.service';
import { CACHE_CONFIG, CacheConfig } from './cache.config';

class MockCache {
  private store = new Map<string, Response>();

  async match(key: string): Promise<Response | undefined> {
    const response = this.store.get(key);
    return response ? response.clone() : undefined;
  }

  async put(key: string, response: Response): Promise<void> {
    this.store.set(key, response);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class MockCacheStorage {
  private caches = new Map<string, MockCache>();

  async open(name: string): Promise<MockCache | undefined> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MockCache());
    }
    return this.caches.get(name)!;
  }

  async delete(name: string): Promise<void> {
    this.caches.delete(name);
  }
}

describe('AnalysisResultsCachedFetcherService', () => {
  let service: AnalysisResultsCachedFetcherService;
  let logger: Partial<LoggerService>;
  let config: CacheConfig;

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    config = {
      maxCaches: 2,
      registryCacheName: 'test-reg',
      registryKey: '/test',
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: logger },
        { provide: CACHE_CONFIG, useValue: config },
      ],
    });
    service = TestBed.inject(AnalysisResultsCachedFetcherService);
    vi.stubGlobal('caches', new MockCacheStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const cacheName = 'test-cache';
  const cacheKey = '/test-key';
  const data = { data: 'data' };
  const response = new Response(JSON.stringify(data));

  describe('cache', () => {
    it('calls fetchFn when cache is empty', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(fetchFn).toHaveBeenCalledOnce();
      expect(res).toEqual(data);
    });

    it('does not call fetchFn when cache exists', async () => {
      const fetchFn = vi.fn();
      const cache = await caches.open(cacheName);
      await cache.put(cacheKey, response);

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(fetchFn).not.toHaveBeenCalled();
      expect(res).toEqual(data);
    });

    it('saves data to cache when calling fetchFn', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);

      await service.getOrFetch(cacheName, cacheKey, fetchFn);

      const cache = await caches.open(cacheName);
      const res = await cache.match(cacheKey);
      expect(res).toEqual(response);
    });

    it('handles cache open error', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      vi.spyOn(caches, 'open').mockImplementation(() => {
        throw new Error('Cache error');
      });

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(fetchFn).toHaveBeenCalledOnce();
      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('handles cache match error', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      const cache = await caches.open(cacheName);
      vi.spyOn(cache, 'match').mockImplementation(() => {
        throw new Error('Cache error');
      });

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(fetchFn).toHaveBeenCalledOnce();
      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('handles JSON parse error', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      const cache = await caches.open(cacheName);
      const deleteSpy = vi.spyOn(cache, 'delete');
      vi.spyOn(cache, 'match').mockResolvedValue(new Response('invalid json'));

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(deleteSpy).toHaveBeenCalledWith(cacheKey);
      expect(fetchFn).toHaveBeenCalledOnce();
      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('handles cache delete error during JSON parse error', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      const cache = await caches.open(cacheName);
      const deleteSpy = vi.spyOn(cache, 'delete').mockImplementation(() => {
        throw new Error('Cache error');
      });
      vi.spyOn(cache, 'match').mockResolvedValue(new Response('invalid json'));

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(deleteSpy).toHaveBeenCalledWith(cacheKey);
      expect(fetchFn).toHaveBeenCalledOnce();
      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('handles cache put error', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      const cache = await caches.open(cacheName);
      const putSpy = vi.spyOn(cache, 'put').mockImplementation(() => {
        throw new Error('Cache error');
      });

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(putSpy).toHaveBeenCalledWith(cacheKey, expect.objectContaining(response));
      expect(fetchFn).toHaveBeenCalledOnce();
      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('registry', () => {
    const readRegistry = async (): Promise<{ cacheName: string; lastUsed: number }[]> => {
      const registryCache = await caches.open(config.registryCacheName);
      const res = await registryCache.match(config.registryKey);
      return res ? await res.json() : [];
    };

    it('adds new entry to registry on first use', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);

      await service.getOrFetch(cacheName, cacheKey, fetchFn);

      const registry = await readRegistry();
      expect(registry).toHaveLength(1);
      expect(registry[0].cacheName).toBe(cacheName);
      expect(registry[0].lastUsed).toBeTypeOf('number');
    });

    it('updates lastUsed for existing entry instead of duplicating', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);

      await service.getOrFetch(cacheName, cacheKey, fetchFn);
      const firstRegistry = await readRegistry();

      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      await service.getOrFetch(cacheName, cacheKey, fetchFn);
      const secondRegistry = await readRegistry();

      vi.useRealTimers();

      expect(secondRegistry).toHaveLength(1);
      expect(secondRegistry[0].lastUsed).toBeGreaterThan(firstRegistry[0].lastUsed);
    });

    it('evicts least recently used cache when exceeding maxCaches', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      const deleteSpy = vi.spyOn(caches, 'delete');

      vi.useFakeTimers();
      await service.getOrFetch('cache-a', cacheKey, fetchFn);
      vi.advanceTimersByTime(1000);
      await service.getOrFetch('cache-b', cacheKey, fetchFn);
      vi.advanceTimersByTime(1000);
      await service.getOrFetch('cache-c', cacheKey, fetchFn);
      vi.useRealTimers();

      expect(deleteSpy).toHaveBeenCalledWith('cache-a');

      const registry = await readRegistry();
      expect(registry).toHaveLength(2);
      expect(registry.map((e) => e.cacheName)).toEqual(['cache-b', 'cache-c']);
    });

    it('does not evict when within maxCaches limit', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      const deleteSpy = vi.spyOn(caches, 'delete');

      await service.getOrFetch('cache-a', cacheKey, fetchFn);
      await service.getOrFetch('cache-b', cacheKey, fetchFn);

      expect(deleteSpy).not.toHaveBeenCalled();
      const registry = await readRegistry();
      expect(registry).toHaveLength(2);
    });

    it('handles registry read error and continues with empty registry', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      vi.spyOn(caches, 'open').mockImplementation(() => {
        throw new Error('Registry error');
      });

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('handles registry write error', async () => {
      const fetchFn = vi.fn().mockResolvedValue(data);
      const registryCache = await caches.open(config.registryCacheName);
      vi.spyOn(registryCache, 'put').mockImplementation(() => {
        throw new Error('Registry error');
      });

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('handles registry delete error', async () => {
      config.maxCaches = 0;
      const fetchFn = vi.fn().mockResolvedValue(data);
      vi.spyOn(caches, 'delete').mockImplementation(() => {
        throw new Error('Registry error');
      });

      const res = await service.getOrFetch(cacheName, cacheKey, fetchFn);

      expect(res).toEqual(data);
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
