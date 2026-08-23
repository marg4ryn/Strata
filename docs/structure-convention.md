# Application Directory Structure

## Main Directories

* `app/core/` — application infrastructure, including singleton services, interceptors, and guards. These are elements loaded once at the application level.

* `app/features/` — individual business functionalities, each located in a separate subdirectory.

* `app/layout/` — components responsible for the page layout, such as the header and footer.

* `app/shared/` — reusable directives, components, and services that are not related to a specific domain.

## Feature Directory Structure

Each feature in `app/features/` has the following structure:

* `data-access/` — data access logic, including services communicating with the API, stores, and resolvers.

* `feature/` — smart components — components responsible for the feature's business logic.

* `ui/` — dumb components — presentational components specific to the given feature.

* `utils/` — utility functions, types, and mappers not directly related to a specific class.

## Common Module Structure

Each module in `app/core/`, `app/layout/`, `app/shared/` follows the same layout: artifacts are grouped into a directory named after their kind.

Example:

```text
layout/
└── header/
    ├── component/
    │   ├── header.component.ts
    │   ├── header.component.spec.ts
    │   └── header.component.html
    └── service/
        ├── header.service.ts
        └── header.service.spec.ts
```

# Application Artifact Organization

## Class Artifacts

Each class, such as `Service`, `Component`, `Directive`, `Pipe`, `Guard`, `Resolver`, or `Interceptor`, should be placed in its own directory named after the class, without the suffix identifying its type.

The same directory should contain:

* the implementation file,
* the `.spec.ts` test file,
* accompanying files, such as `.html` and `.scss`.

Example:

```text
user-profile/
├── user-profile.component.ts
├── user-profile.component.spec.ts
├── user-profile.component.html
└── user-profile.component.scss
```

## Non-class artifacts containing logic

Files such as `utils` or `validators` contain testable logic and follow the same rule as class artifacts: own directory named after the artifact (without suffix), containing the implementation file and its `.spec.ts`.

Example:

```text
date/
├── date.utils.ts
└── date.utils.spec.ts
```

## Non-class artifacts without logic

Files that do not define classes and contain declarations only (types, constants, route definitions), such as `model.ts`, `*.config.ts`, or `routes.ts`, should be placed at the module level, outside class directories.

Example:

```text
user/
├── user.model.ts
├── user.routes.ts
└── service/
    ├── user.service.ts
    └── user.service.spec.ts
```

## Exceptions

### Exception 1 — Module Facade

The facade of a given module — its public entry point, used by the rest of the application to interact with the feature — is placed as a flat file directly in the module's root directory, without a wrapping directory.

Unlike a regular `data-access/` service, the facade is not "one of the services" — it is the feature's public API and must remain immediately visible at the root, rather than being nested alongside implementation details.

Example:

```text
user/
├── user.facade.ts
├── user.facade.spec.ts
├── data-access/
├── feature/
├── ui/
└── utils/
```

### Exception 2 — Single Artifact in a Group

When a grouping directory contains only **one** artifact of a given kind (e.g. a single service or a single component), that artifact is placed directly in a directory named after its **role** (`service/`, `component/`, `directive/`, `guard/`, etc.) rather than its class name. The same naming pattern applies to directives, guards, resolvers, interceptors, and other artifact kinds.

As soon as a **second** artifact of the same kind is added to the group, the existing one is wrapped in an additional directory named after its class, so that both artifacts sit at the same nesting level, separated by class name. Conversely, if a group is reduced back down to a single artifact of that kind, the remaining artifact is **unpacked** — the class-named wrapper directory is removed and the artifact moves back up into the role-named directory.

The goal is to keep nesting as shallow as possible while still clearly separating artifacts of different kinds. An artifact directory is only "unwrapped" into its role-named parent when it is the sole artifact of that kind; if a second one exists at the same level, it must be wrapped. This rule doesn't apply to logic-free, class-free files (e.g. `model.ts`, `routes.ts`), but it does apply to facades.

**Example — guard/resolver/interceptor in `core/`:**

```text
core/
├── guard/
│   ├── auth.guard.ts
│   └── auth.guard.spec.ts
└── interceptor/
    ├── error.interceptor.ts
    └── error.interceptor.spec.ts
```

If a second guard is added:

```text
core/
└── guard/
    ├── auth/
    │   ├── auth.guard.ts
    │   └── auth.guard.spec.ts
    └── role/
        ├── role.guard.ts
        └── role.guard.spec.ts
```

**Example — single component, single service:**

```text
layout/
└── header/
    ├── component/
    │   ├── header.component.ts
    │   ├── header.component.spec.ts
    │   └── header.component.html
    └── service/
        ├── header.service.ts
        └── header.service.spec.ts
```

**Example — second component added → both wrapped by class name:**

```text
layout/
└── header/
    ├── component/
    │   ├── header/
    │   │   ├── header.component.ts
    │   │   ├── header.component.spec.ts
    │   │   └── header.component.html
    │   └── header-item/
    │       ├── header-item.component.ts
    │       ├── header-item.component.spec.ts
    │       └── header-item.component.html
    └── service/
        ├── header.service.ts
        └── header.service.spec.ts
```

**Unpacking on removal:** unpacking cascades upward through every level as long as only one artifact remains at that level, all the way up to the module root. 

If `header-item.component.ts` is removed, `header/` again holds only one component, so it's unpacked one level:

```text
layout/
└── header/
    ├── component/
    │   ├── header.component.ts
    │   ├── header.component.spec.ts
    │   └── header.component.html
    └── service/
        ├── header.service.ts
        └── header.service.spec.ts
```

If `header.service.ts` is also removed, `header/` now holds only a single artifact overall — the `component/` role directory itself becomes redundant, so it's unpacked too, collapsing all the way to the module root:

```text
layout/
└── header/
    ├── header.component.ts
    ├── header.component.spec.ts
    └── header.component.html
```

**Single kind in a module:** the role-named directory (`component/`, `service/`, `directive/`, etc.) exists only to separate artifacts of different kinds. If a module contains artifacts of only one kind — regardless of how many artifacts of that kind exist — the role-named directory is omitted entirely, and the class-named artifact directories are placed directly at the module root.

This rule is independent of the single-artifact unpacking rule above: it doesn't matter whether there's one service or ten — if services are the only kind of artifact present, `service/` provides no separation and is dropped.

Example — two services, no other kinds present:

```text
some-module/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts
└── user/
    ├── user.service.ts
    └── user.service.spec.ts
```

Example — a component is later added to the same module: the module now contains two kinds of artifacts, so role-named directories are introduced to separate them:

```text
some-module/
├── component/
│   ├── user-list.component.ts
│   ├── user-list.component.spec.ts
│   └── user-list.component.html
└── service/
    ├── auth/
    │   ├── auth.service.ts
    │   └── auth.service.spec.ts
    └── user/
        ├── user.service.ts
        └── user.service.spec.ts
```

Example — a second component is added: `component/` now holds two artifacts, so both get wrapped in class-named directories, consistent with the multi-artifact rule:

```text
some-module/
├── component/
│   ├── user-list/
│   │   ├── user-list.component.ts
│   │   ├── user-list.component.spec.ts
│   │   └── user-list.component.html
│   └── user-detail/
│       ├── user-detail.component.ts
│       ├── user-detail.component.spec.ts
│       └── user-detail.component.html
└── service/
    ├── auth/
    │   ├── auth.service.ts
    │   └── auth.service.spec.ts
    └── user/
        ├── user.service.ts
        └── user.service.spec.ts
```

Example — both components are later removed again: the module reverts to a single kind (services only), so the role-named directories collapse back to the module root:


```text
some-module/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts
└── user/
    ├── user.service.ts
    └── user.service.spec.ts
```
