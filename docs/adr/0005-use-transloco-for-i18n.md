# 0005. Use Transloco for i18n

- **Status:** Accepted
- **Date:** 2026-08-23
- **Category:** Architecture

## Context

The application requires multilingual support with the ability for users to change the language at runtime without reloading the page.

## Decision

I chose Transloco as the most popular library for runtime translations.

## Alternatives Considered

- **Angular built-in localization (compile-time translations)** – rejected. Despite its good SEO support, it does not allow the language to be changed without reloading the application. SEO is not a priority for this product (see [0002. Use SPA Architecture](0002-use-spa-architecture.md)).

## Consequences

- **Positive:** users can change the language without reloading the application.
- **Negative:** translations are resolved at runtime, which introduces additional runtime overhead compared to a compile-time solution. This cost is accepted in exchange for the flexibility described above.

## References

- [0002. Use SPA Architecture](0002-use-spa-architecture.md)
- [0006. Single Translation File per Locale](0006-single-translation-file-per-locale.md)
- [Transloco documentation](https://jsverse.gitbook.io/transloco)
- [Angular: Internationalization](https://angular.dev/guide/i18n)
