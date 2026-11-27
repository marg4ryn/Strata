# 0003. Application Directory Structure Convention

- **Status:** Superseded by [0014](0014-simplified-directory-structure.md)
- **Date:** 2026-08-23
- **Category:** Architecture

## Context

The application needs a consistent and predictable standard for organizing directories and files. The standard should limit unnecessary nesting while maintaining a clear separation of different artifact types (components, services, directives, etc.) and clearly defining the public API of each module.

## Decision

I adopted the organization standard described in detail in [structure-convention.md](../structure-convention.md).

## Alternatives Considered

- **Fixed directory per artifact type, regardless of count** – rejected because it would lead to unnecessary nesting in small modules. I considered limiting the number of directories more important than having completely predictable locations for every type of artifact.

## Consequences

- **Positive:** the structure remains as flat as possible and unnecessary nesting is limited.
- **Negative:** the directory structure may change as a module grows. Adding or removing artifacts may require moving files between directories, which requires greater discipline during development.

## References

- [0014. Simplified Directory Structure Convention](0014-simplified-directory-structure.md)
- [Application Directory Structure](../structure-convention.md)
