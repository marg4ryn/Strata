# Testing: Code Coverage Caveats

This document describes known limitations of coverage tools (Istanbul, V8) in the context of Angular + Vitest tests. The common thread across all cases is the tension between code instrumented in AOT mode and JIT recompilation triggered by `TestBed.overrideComponent` / `overrideTemplate` or dynamic rendering (e.g. CDK Overlay).


## 1. `viewChild.required()` pointing to a directive rendered asynchronously (e.g. CDK Overlay)

**Problem**

Angular internally wraps tokens passed to `viewChild` in lazily evaluated functions (closures using `forwardRef`). If the directive (e.g. `CdkListbox`) is rendered inside an asynchronous `<ng-template>` (CDK Overlay), standard tests cannot resolve this token synchronously. As a result, Istanbul reports the token itself as uncovered (`fstat-no`), even though the logic using it is fully tested.

**Workaround**

A dedicated isolated test uses `TestBed.overrideTemplate` to remove the asynchronous dependency on CDK Overlay and allow the token to be resolved synchronously. `overrideTemplate` triggers JIT recompilation (which would normally disrupt template coverage), but because Istanbul aggregates coverage across all tests, the standard AOT tests still cover the original template — this additional test is only responsible for covering the token itself.


## 2. Fallback branch in two-way bindings on Signals (`[(x)]="y"`)

**Problem**

Coverage tools may report an uncovered branch in `[(x)]="y"` bindings mapped to a Signal/`model()`. Angular compiles two-way binding with a fallback for regular properties: `updateSignal(...) || updatePlainProperty(...)`. When Signals are used exclusively, the first condition is always truthy, making the fallback branch (`updatePlainProperty`) dead code.

**Workaround**

None — the branch cannot be covered without artificially removing the Signal implementation. I consider this safe to ignore and exclude it in the coverage configuration.


## 3. Child component stubs and loss of coverage

See the separate ADR: [**Why do component tests use real child components instead of stubs?**](./architecture-decision-record.md#testing-why-do-component-tests-use-real-child-components-instead-of-stubs) — it documents the architectural decision rather than just a targeted workaround.


### When to Review

All of the above cases result from limitations in the current versions of Angular/Vitest/Istanbul in handling JIT recompilation and asynchronous rendering. This document should be reviewed whenever Angular or Vitest/Istanbul undergoes a major version upgrade.

**Observed with**: Angular `22.1.8`, Vitest `4.1.11`
