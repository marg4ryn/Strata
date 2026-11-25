# 0004. Use Angular CDK Overlay

- **Status:** Accepted
- **Date:** 2026-08-23
- **Category:** Architecture

## Context

The application contains numerous overlay elements: panels accessible from the header, modals, dialogs, and dropdown lists. These elements need to operate independently of the main page layout while remaining consistent in terms of behavior and accessibility.

## Decision

All overlay elements are implemented using Angular CDK Overlay.

## Alternatives Considered

- **Custom solution based on native browser mechanisms** – rejected. I saw little justification in implementing positioning, layer management, focus handling, and accessibility from scratch. Angular CDK provides a ready-made and proven solution that is part of the Angular ecosystem, so I chose to use it instead of maintaining a custom implementation.

## Consequences

- **Positive:** all overlays have a consistent implementation with built-in accessibility (a11y) support provided by CDK.
- **Negative:** dependency on `@angular/cdk` and its API.