# 0012. Broadcast Channel API for Analysis History

- **Status:** Accepted
- **Date:** 2026-08-23
- **Category:** Feature: Analysis History

## Context

The analysis history is loaded once through `AppInitializer` in `app.config.ts`, similarly to the other application initializers. However, if another browser tab completes an analysis and adds an entry to the history, or if the user deletes an existing entry, the current tab needs to be notified of the change.

## Decision

Synchronization between tabs is handled using the Broadcast Channel API. The tab that adds or removes an analysis sends a message describing the event (`added`/`removed`) along with the relevant payload. Other tabs update their application state directly based on the received message without reading from LocalStorage.

## Alternatives Considered

- **Storage Event API** – rejected. The `storage` event provides only the raw serialized old and new values of the changed key, not the meaning of the change. Each tab would have to deserialize and diff the whole history to work out whether an entry was added or removed, which couples synchronization to the storage format.
- **Broadcast Channel API as a notification only, followed by reading LocalStorage** – rejected. Since the message can carry an arbitrary payload, reading LocalStorage again is unnecessary. Sending the data directly in the message simplifies change handling and eliminates unnecessary read operations.

## Consequences

- **Positive:** the history state is synchronized between tabs immediately, without reading LocalStorage for every change.
- **Positive:** messages describe the change explicitly and contain all the data needed to update the state, keeping the synchronization mechanism simple and inexpensive.
- **Negative:** each tab's state is updated independently of LocalStorage, so the message format must stay consistent with what is persisted; a bug in either path can make them diverge.

## References

- [0010. Web Locks API for Analysis Run](0010-web-locks-for-analysis-run.md)
- [MDN: Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
- [MDN: Window storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
