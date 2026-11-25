# 0011. Cached Fetcher with Web Locks API for Analysis Results

- **Status:** Accepted
- **Date:** 2026-09-21
- **Category:** Feature: Analysis Results

## Context

Analysis results are expensive to fetch and do not change once an analysis is completed. To avoid repeated API calls when users revisit a view or reload the application, results are stored in the browser's Cache API, one cache per analysis and API version. To keep storage bounded, a registry of used caches is maintained and the least recently used caches are evicted once a configured limit is exceeded.

The registry is updated with a read → modify → write sequence, which is not atomic. Results for one analysis are requested in parallel (`Promise.all`), and the Cache API is shared across all tabs of the same origin. Without synchronization, concurrent updates overwrite each other, so the registry can lose entries and the LRU eviction stops working correctly, leaving orphaned caches in storage.

## Decision

Data access goes through a single `AnalysisResultsCachedFetcherService`, which returns cached data when available and otherwise fetches it and stores it in the cache.

Every registry update (marking a cache as used and enforcing the cache limit) is executed inside an exclusive lock acquired with the Web Locks API. The lock is held until the whole sequence, including saving the registry, has finished, so concurrent calls, also from different tabs, are processed one at a time and each sees the result of the previous one.

Reading and writing the results themselves does not require the lock, because each entry is written as a single atomic `cache.put` operation.

## Alternatives Considered

- **Registry stored in IndexedDB with transactions** – rejected. IndexedDB transactions are atomic, but they commit automatically as soon as the code awaits anything outside IndexedDB. The registry update includes deleting evicted caches through the Cache API (`caches.delete`), so the whole sequence could not be kept inside a single transaction. It would also introduce a second storage mechanism alongside the Cache API.
- **In-memory mutex within a single tab** – rejected. It serializes parallel requests within one tab, but does not protect against concurrent updates from other tabs sharing the same Cache API storage.

## Consequences

- **Positive:** prevents lost updates in the cache registry, both between parallel requests within one tab and between multiple tabs.
- **Positive:** the number of stored caches stays within the configured limit.
- **Negative:** registry updates are serialized, so parallel requests wait for each other at this step.