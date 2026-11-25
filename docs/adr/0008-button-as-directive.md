# 0008. Button as a Directive

- **Status:** Accepted
- **Date:** 2026-08-23
- **Category:** Shared: Button Directive

## Context

The application needs a consistent appearance for its main buttons, with `primary`, `secondary`, and `danger` variants used throughout the application.

## Decision

The button styling is implemented as a directive applied to the native `button[btn]` element instead of as a separate component such as `<app-button>`. The directive only calculates and assigns the CSS class (`btn btn--{{variant}}`) to the host element.

Since directives cannot carry their own styles, the styling rules are defined in the global `styles.scss`.

## Alternatives Considered

- **`<app-button>` component instead of a directive on `button`** – rejected to preserve the native semantics and accessibility of the `<button>` element, including focus handling, keyboard interaction, and screen reader support, without having to manually forward ARIA attributes through a wrapper component.

## Consequences

- **Positive:** buttons retain the full native semantics and accessibility of the `<button>` element.
- **Positive:** style variants are managed in a single place (`styles.scss`), making visual consistency easier to maintain.
- **Negative:** the button styles are not encapsulated by Angular and must be consciously maintained as part of the global design system rather than as local component logic.