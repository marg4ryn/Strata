# Application Directory Structure

The application architecture is inspired by the feature-oriented approach commonly used in Nx projects. It organizes the code primarily around business functionality while keeping application-wide infrastructure, layout, and shared building blocks separate. This structure aims to improve maintainability and make dependencies between different parts of the application easier to understand as the project grows.

## Main Directories

* [`app/core/`](#core-and-layout-directories-structure) — application infrastructure, classes loaded once at the application level.
* [`app/features/`](#feature-directory-structure) — individual business functionalities, each located in a separate subdirectory.
* [`app/layout/`](#core-and-layout-directories-structure) — components responsible for the page layout, such as the header and footer.
* [`app/shared/`](#shared-directory-structure) — reusable directives, components, and pipes that are not related to a specific domain.

Each subdirectory within the directories listed above is treated as an module. To expose elements outside its own scope, it must provide a public API through an `index.ts` file. Direct access to module's internal files is not allowed. This rule is enforced by the linter.

The following dependencies are allowed:

* `feature` → `core`, `shared`, `feature`
* `layout` → `core`, `shared`, `feature`
* `core` → `core`, `shared`
* `shared` → `core`, `shared`

## Feature Directory Structure

Each feature in `app/features/` has the following structure:

* `data-access/` — data access logic, including services communicating with the API and stores.
* `feature/` — smart components — components responsible for the feature's business logic.
* `ui/` — dumb components — presentational components specific to the given feature.
* `utils/` — utility functions not directly related to a specific class.

The distinction between `feature/` and `ui/` is not based on the amount of logic, but on the type of dependencies injected into the component. A component belongs in `ui/` if it uses only `input()`/`output()` or generic, domain-agnostic services. A component belongs in `feature/` if it injects data-access or a facade, knows about routing, or makes business decisions based on domain data.

There is a possibility of creating a subfeature when the extracted part has its own, independent data-access logic and exposes that logic externally through its own facade. The parent feature communicates with the subfeature only through it. Mere growth in the number of components, dedicated routing, or a separate shell are not sufficient reasons to extract a subfeature.

## Core and Layout Directories Structure

`app/core/` and `app/layout/` consist of named modules that internally follows the [Application Artifact Organization](#application-artifact-organization) rules.

Most modules contain a single artifact and therefore collapse under [Exception 3](#exception-3--single-artifact-in-a-group): no role directory is created, since it would hold only one kind of artifact.

```text
core/
├── storage/
│   ├── storage.service.ts
│   └── storage.service.spec.ts
└── logging/
    ├── logger.service.ts
    └── logger.service.spec.ts
```

Some modules expose a facade in front of multiple services. This combines [Exception 1](#exception-1--module-facade) (the facade stays flat at the module root) with [Exception 3](#exception-3--single-artifact-in-a-group) (once the facade is set aside, only one kind — `service` — remains, so the `services/` role directory is dropped and each service is wrapped by class name directly at the module root):

```text
core/
└── language/
    ├── language.facade.ts
    ├── language.facade.spec.ts
    ├── language/
    │   ├── language.service.ts
    │   └── language.service.spec.ts
    └── language-store/
        ├── language-store.service.ts
        └── language-store.service.spec.ts
```

## Shared Directory Structure

`app/shared/` uses two organizational patterns, depending on whether an artifact stands alone or belongs to a small functional group. In both cases, the rules defined in [Application Artifact Organization](#application-artifact-organization) also apply.

**Standalone artifacts** are grouped first by type, then by name — one "bucket" per role directory:

```text
shared/
├── pipes/
│   ├── localized-date/
│   │   ├── localized-date.pipe.ts
│   │   └── localized-date.pipe.spec.ts
│   └── localized-number/
│       ├── localized-number.pipe.ts
│       └── localized-number.pipe.spec.ts
└── directives/
    ├── button.directive.ts
    └── button.directive.spec.ts
```

**Named mini-modules** are used when several artifacts work together as one functional unit (e.g. a component paired with a service). Here grouping is reversed — first by name, then by type:

```text
shared/
└── confirm-operation/
    ├── components/
    │   ├── confirm-operation.component.ts
    │   └── confirm-operation.component.spec.ts
    └── services/
        ├── confirm-operation.service.ts
        └── confirm-operation.service.spec.ts
```


# Application Artifact Organization

## Class Artifacts

Each class, such as `Service`, `Component`, `Directive`, `Pipe`, `Guard`, `Resolver`, or `Interceptor`, should be placed in its own directory named after the class, without the suffix identifying its type.

This also applies to classes that fall outside Angular's built-in decorators — such as controllers, builders, or adapters — as long as they hold state or logic and can be tested in isolation. What determines whether an artifact follows this rule is not the presence of an Angular decorator, but whether it is a stateful class containing testable logic.

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
└── services/
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

### Exception 2 — Thematic Grouping

Additional semantic grouping of classes into subfolders is allowed when the number of classes in a given role grows and they form natural thematic subsets.

```text
some-feature/
└── ui/
    ├── resource-states/
    │   ├── analysis-error/
    │   ├── analysis-loading/
    │   └── analysis-not-found/
    └── charts/
        ├── doughnut-chart/
        ├── commits-chart/
        └── contributors-chart/
```

### Exception 3 — Single Artifact in a Group

When a grouping directory contains only **one** artifact of a given kind (e.g. a single service or a single component), that artifact is placed directly in a directory named after its **role** (`services/`, `components/`, `directives/`, `guards/`, etc.) rather than its class name. The same naming pattern applies to directives, guards, resolvers, interceptors, controllers, and other artifact kinds.

As soon as a **second** artifact of the same kind is added to the group, the existing one is wrapped in an additional directory named after its class, so that both artifacts sit at the same nesting level, separated by class name. Conversely, if a group is reduced back down to a single artifact of that kind, the remaining artifact is **unpacked** — the class-named wrapper directory is removed and the artifact moves back up into the role-named directory.

The goal is to keep nesting as shallow as possible while still clearly separating artifacts of different kinds. An artifact directory is only "unwrapped" into its role-named parent when it is the sole artifact of that kind; if a second one exists at the same level, it must be wrapped. This rule doesn't apply to logic-free, class-free files (e.g. `model.ts`, `routes.ts`).

**Example — single component, single service:**

```text
some-module/
├── components/
│   ├── notification-toast.component.ts
│   ├── notification-toast.component.spec.ts
│   └── notification-toast.component.html
└── services/
    ├── notification.service.ts
    └── notification.service.spec.ts
```

**Example — second component added → both wrapped by class name:**

```text
some-module/
├── components/
│   ├── notification-toast/
│   │   ├── notification-toast.component.ts
│   │   ├── notification-toast.component.spec.ts
│   │   └── notification-toast.component.html
│   └── notification-banner/
│       ├── notification-banner.component.ts
│       ├── notification-banner.component.spec.ts
│       └── notification-banner.component.html
└── services/
    ├── notification.service.ts
    └── notification.service.spec.ts
```

**Unpacking on removal:** unpacking cascades upward through every level as long as only one artifact remains at that level, all the way up to the module root.

If `notification-banner.component.ts` is removed, `components/` again holds only one component, so it's unpacked one level:

```text
some-module/
├── components/
│   ├── notification-toast.component.ts
│   ├── notification-toast.component.spec.ts
│   └── notification-toast.component.html
└── services/
    ├── notification.service.ts
    └── notification.service.spec.ts
```

If `notification.service.ts` is also removed, `notification/` now holds only a single artifact overall — the `components/` role directory itself becomes redundant, so it's unpacked too, collapsing all the way to the module root:

```text
some-module/
├── notification-toast.component.ts
├── notification-toast.component.spec.ts
└── notification-toast.component.html
```

**Single kind in a module:** the role-named directory (`components/`, `services/`, `directives/`, etc.) exists only to separate artifacts of different kinds. If a module contains artifacts of only one kind — regardless of how many artifacts of that kind exist — the role-named directory is omitted entirely, and the class-named artifact directories are placed directly at the module root.

This rule is independent of the single-artifact unpacking rule above: it doesn't matter whether there's one service or ten — if services are the only kind of artifact present, `services/` provides no separation and is dropped.

**Example — two services, no other kinds present:**

```text
some-module/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts
└── user/
    ├── user.service.ts
    └── user.service.spec.ts
```

**Example — a component is later added to the same module:** the module now contains two kinds of artifacts, so role-named directories are introduced to separate them:

```text
some-module/
├── components/
│   ├── user-list.component.ts
│   ├── user-list.component.spec.ts
│   └── user-list.component.html
└── services/
    ├── auth/
    │   ├── auth.service.ts
    │   └── auth.service.spec.ts
    └── user/
        ├── user.service.ts
        └── user.service.spec.ts
```

**Example — a second component is added:** `components/` now holds two artifacts, so both get wrapped in class-named directories, consistent with the multi-artifact rule:

```text
some-module/
├── components/
│   ├── user-list/
│   │   ├── user-list.component.ts
│   │   ├── user-list.component.spec.ts
│   │   └── user-list.component.html
│   └── user-detail/
│       ├── user-detail.component.ts
│       ├── user-detail.component.spec.ts
│       └── user-detail.component.html
└── services/
    ├── auth/
    │   ├── auth.service.ts
    │   └── auth.service.spec.ts
    └── user/
        ├── user.service.ts
        └── user.service.spec.ts
```

**Example — both components are later removed again:** the module reverts to a single kind (services only), so the role-named directories collapse back to the module root:

```text
some-module/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts
└── user/
    ├── user.service.ts
    └── user.service.spec.ts
```
