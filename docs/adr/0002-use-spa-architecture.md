# 0002. Use SPA Architecture

- **Status:** Accepted
- **Date:** 2026-08-23
- **Category:** Architecture

## Context

The application is an analytics dashboard where access to most views is only available after an analysis has been performed. It also contains numerous interactive visualizations where performance is important.

## Decision

I chose a Single-Page Application (SPA) architecture. Client-side rendering keeps navigation between views instant and avoids full page reloads while users interact with visualizations.

## Alternatives Considered

- **SSR / SSG** – rejected. Even with either approach, a search engine crawler would not have access to most of the application because it is protected behind the analysis process. Therefore, the potential SEO benefits would be minimal, while the implementation cost would not be justified.

## Consequences

- **Positive:** the focus stays on the performance of interactive visualizations, which is the product's priority.
- **Negative:** the application's SEO remains limited. This is an intentional trade-off, as SEO is not a priority for this product.