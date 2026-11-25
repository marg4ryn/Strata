# 0006. Single Translation File per Locale

- **Status:** Accepted
- **Date:** 2026-08-26
- **Category:** Architecture

## Context

The application supports multiple languages, so translation strings must be stored in dedicated locale files. The structure should remain simple and easy to integrate with the application's i18n tooling. Translations can be stored in one file per locale or split by application module. Since the project is relatively small and has few developers, the chosen approach should avoid unnecessary complexity.

## Decision

I store all translations for a given locale in a single file. This reduces the number of HTTP requests, keeps the i18n configuration simple, works well with IDE i18n plugins, and makes translation management easier.

## Alternatives Considered

- **Separate translation files per module** – would provide clearer module boundaries and could be useful in a larger project with more developers. For the current project, this would add unnecessary files and configuration without providing enough benefit to justify the additional complexity.

## Consequences

- **Positive:** the translation structure remains simple and predictable, with minimal configuration overhead.
- **Negative:** locale files may become harder to navigate as the application grows.
- **Follow-ups:** if the project or team becomes significantly larger, this decision should be revisited and translations split by module.