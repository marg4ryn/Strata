# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for the application. Each ADR describes a single decision: its context, the decision itself, the alternatives considered, and its consequences.

## Index

| #    | Title                                                                                                      | Category                | Status   |
|------|------------------------------------------------------------------------------------------------------------|-------------------------|----------|
| 0001 | [Use Angular](0001-use-angular.md)                                                                         | Architecture            | Accepted |
| 0002 | [Use SPA Architecture](0002-use-spa-architecture.md)                                                       | Architecture            | Accepted |
| 0003 | [Application Directory Structure Convention](0003-application-directory-structure.md)                      | Architecture            | Accepted |
| 0004 | [Use Angular CDK Overlay](0004-use-angular-cdk-overlay.md)                                                 | Architecture            | Accepted |
| 0005 | [Use Transloco for i18n](0005-use-transloco-for-i18n.md)                                                   | Architecture            | Accepted |
| 0006 | [Single Translation File per Locale](0006-single-translation-file-per-locale.md)                           | Architecture            | Accepted |
| 0007 | [Real Child Components in Component Tests](0007-real-child-components-in-component-tests.md)               | Testing                 | Accepted |
| 0008 | [Button as a Directive](0008-button-as-directive.md)                                                       | Shared: Button Directive | Accepted |
| 0009 | [WebSocket for Analysis Run](0009-websocket-for-analysis-run.md)                                           | Feature: Analysis Run   | Accepted |
| 0010 | [Web Locks API for Analysis Run](0010-web-locks-for-analysis-run.md)                                       | Feature: Analysis Run   | Accepted |
| 0011 | [Cached Fetcher with Web Locks API for Analysis Results](0011-cached-fetcher-with-web-locks-for-analysis-results.md) | Feature: Analysis Results | Accepted |
| 0012 | [Broadcast Channel API for Analysis History](0012-broadcast-channel-for-analysis-history.md)               | Feature: Analysis History | Accepted |
| 0013 | [Guillotine Packing for City Layout](0013-guillotine-packing-for-analysis-results.md)                      | Feature: Analysis Results | Accepted |

## Adding a New ADR

1. Copy [template.md](template.md) to `NNNN-short-title.md`, using the next free number.
2. Fill in all sections and set the status to `Proposed`.
3. Add the ADR to the index above.
4. Once the decision is approved, change the status to `Accepted`.

## Changing a Decision

ADRs are immutable once accepted. To change a decision, create a new ADR and set the old one's status to `Superseded by [NNNN](NNNN-short-title.md)`. Update both entries in the index.

## Statuses

- **Proposed** – under discussion
- **Accepted** – in effect
- **Deprecated** – no longer relevant, not replaced
- **Superseded** – replaced by a newer ADR