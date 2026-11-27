# 0010. Web Locks API for Analysis Run

- **Status:** Accepted
- **Date:** 2026-08-23
- **Category:** Feature: Analysis Run

## Context

Users must be able to close the application without losing information about ongoing analyses, which requires persisting their state in LocalStorage. However, LocalStorage is shared across multiple browser tabs, creating a risk of simultaneous access to the same data if the same analysis is open in multiple tabs at the same time.

## Decision

A lock for a given analysis is acquired using the Web Locks API, indicating that the analysis is currently being handled by a specific tab. The lock is released only after:

- the analysis is completed and its data is removed from LocalStorage, or
- the browser tab is closed,

which signals to other tabs that they can take over the analysis.

## Alternatives Considered

- **Lock flag with heartbeat in LocalStorage** – rejected. LocalStorage offers no atomic read-and-write, so two tabs could acquire the lock at the same time. A tab that crashes leaves a stale flag behind, which must be detected with heartbeats and timeouts, adding complexity and delaying takeover.
- **Leader election via BroadcastChannel** – rejected. It requires implementing a custom election protocol with timeouts and handling of race conditions between tabs. The Web Locks API provides the same guarantee natively, with automatic release when a tab is closed.

## Consequences

- **Positive:** prevents write conflicts in LocalStorage between tabs operating on the same analysis.
- **Positive:** the browser releases the lock automatically when the tab is closed or crashes, so no stale locks remain.
- **Negative:** additional logic is required to manage the lock's lifecycle.

## References

- [0009. WebSocket for Analysis Run](0009-websocket-for-analysis-run.md)
- [0011. Cached Fetcher with Web Locks API for Analysis Results](0011-cached-fetcher-with-web-locks-for-analysis-results.md)
- [0012. Broadcast Channel API for Analysis History](0012-broadcast-channel-for-analysis-history.md)
- [MDN: Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
