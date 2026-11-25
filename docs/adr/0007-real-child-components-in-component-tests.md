# 0007. Real Child Components in Component Tests

- **Status:** Accepted
- **Date:** 2026-09-13
- **Category:** Testing

## Context

Child components can normally be replaced with stubs to isolate the component under test. However, replacing them requires calling `TestBed.overrideComponent` / `overrideTemplate` on the component under test, which forces Angular to recompile its definition (`ɵcmp`) at runtime in JIT mode, outside the module that was originally instrumented for coverage. Code coverage tools (both V8 and Istanbul) cannot map the recompiled code back to the instrumented source, so none of the tests executed against the overridden component count towards its coverage.

Observed with: Angular `22.1.8`, Vitest `4.1.11`.

This is one of several known coverage-tooling limitations; see [testing-coverage-caveats.md](../testing-coverage-caveats.md) for related cases.

## Decision

Component tests use real child components instead of stubs. They are therefore effectively integration tests. All dependencies required by child components must be provided in the test configuration.

This is a workaround for a specific coverage-instrumentation gap, not a preference for integration-style tests. It avoids coverage numbers being distorted by a tooling limitation rather than actual test gaps.

## Alternatives Considered

- **Stubs via `TestBed.overrideComponent` / `overrideTemplate`** – rejected because of the coverage issue described above.
- **`ng-mocks`** – rejected because it uses `overrideComponent` internally and triggers the same recompilation.

## Consequences

- **Positive:** coverage numbers remain accurate and reflect real test gaps instead of tooling artifacts.
- **Negative:** tests require more dependencies and are slower than isolated unit tests.
- **Follow-ups:** revisit this decision once the Angular/Vitest ecosystem provides a reliable way to preserve code coverage for overridden/recompiled components.