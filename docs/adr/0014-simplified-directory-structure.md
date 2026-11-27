# 0014. Simplified Directory Structure Convention

- **Status:** Accepted
- **Date:** 2026-11-27
- **Category:** Architecture

## Context

[0003](0003-application-directory-structure.md) kept nesting as shallow as possible: a single artifact of a kind was placed flat, and it was wrapped in its own folder only when a second artifact of the same kind appeared. In practice:

- the location of a file depended on how many neighbours it had, so it could not be predicted from its name;
- adding or removing an artifact meant moving other files, which changed import paths and broke file history in Git;
- the codebase drifted into inconsistencies, e.g. some smart components were flat while others had their own folder;
- the convention needed several pages of rules and examples to explain.

## Decision

I use the rules described in [structure-convention.md](../structure-convention.md):

- a file named `name.kind.ts` always lives in a folder called `name`, and a folder holds exactly one artifact; only `index.ts`, the facade, and declaration files sit flat in the module root;
- routed pages belong to the `feature/` layer;
- a part of a feature with its own lazy-loaded routes and state is a subfeature: a nested folder with the same layers;
- folders named after artifact kinds (`components/`, `services/`, `pipes/`) are not used; the only role-based folders are the layers `data-access/`, `feature/`, `ui/`, and `utils/`;
- `shared/` is split into the same layers as a feature: `shared/ui/` and `shared/utils/`;
- crowded folders can be grouped by theme;
- declaration-only files (`*.model.ts`, `*.routes.ts`, `*.config.ts`, `*.providers.ts`) stay flat;
- file and class names keep their type suffixes, and `angular.json` is configured so that `ng generate` follows this convention.

The layers (`core`, `layout`, `shared`, `features`), their allowed dependencies, and the public API through `index.ts` stay as they were.

## Alternatives Considered

- **Keep 0003** – rejected because the cost of moving files and the resulting inconsistencies outweighed the benefit of one less level of nesting in small modules.
- **Drop type suffixes, following the [Angular 20+ style guide](https://angular.dev/style-guide)** – rejected for now. It would rename over a hundred files without changing the structure, and suffixes make the kind of an artifact visible in imports and file trees.

## Consequences

- **Positive:** the location of every file follows from its name, matches what the Angular CLI generates, and does not change when other files are added or removed.
- **Negative:** small modules get one more level of nesting than under 0003.
- **Follow-ups:** existing files that do not follow the new rules have to be moved and renamed.

## References

- [0003. Application Directory Structure Convention](0003-application-directory-structure.md)
- [Application Directory Structure](../structure-convention.md)
- [Angular style guide](https://angular.dev/style-guide)
- [Angular CLI: ng generate](https://angular.dev/cli/generate)
- [Nx: Monorepo Folder Structure](https://nx.dev/docs/concepts/decisions/folder-structure)
