# 0001. Use Angular

- **Status:** Accepted
- **Date:** 2026-08-23
- **Category:** Architecture

## Context

I wanted to learn a framework that would allow me to build a scalable, long-term maintainable application with a strong reputation.

## Decision

I chose Angular because of its rich set of features available out of the box and its predictable project structure. This allows a developer moving from another Angular project to become familiar with the codebase relatively quickly without having to learn the project's organization from scratch.

## Alternatives Considered

- **React** – provides a great deal of freedom in how an application is organized. While this can be an advantage, I considered it a disadvantage in this case. The lack of an opinionated structure can lead to different approaches to organizing code depending on the project or team, making it harder to maintain predictability.
- **Vue** – simpler and provides fewer features directly within the framework than Angular.

## Consequences

- **Positive:** a consistent environment with many features available without having to select and integrate additional libraries.
- **Negative:** greater reliance on Angular's ecosystem and conventions.
- **Follow-ups:** the project structure and naming conventions must be maintained consistently to preserve the intended predictability (see [0003. Application Directory Structure Convention](0003-application-directory-structure.md)).

## References

- [0003. Application Directory Structure Convention](0003-application-directory-structure.md)
- [0014. Simplified Directory Structure Convention](0014-simplified-directory-structure.md)
- [Angular documentation](https://angular.dev)
- [React documentation](https://react.dev)
- [Vue documentation](https://vuejs.org)
