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

### Exception 1 — Main Feature or Core Module Service

The main service of a feature or the `core/` module should be placed in a `service/` directory. The name describes the role of the directory rather than the domain. Structurally, there is always exactly one such directory.

Example:

```text
user/
└── service/
    ├── user.service.ts
    └── user.service.spec.ts
```

### Exception 2 — Omitting the Class Directory

The class directory can be omitted when the parent container clearly indicates which class the files belong to.

This applies to:

* a single component in the `ui/` or `feature/` directory,
* a facade located in the root directory of a feature or the `core/` module.

## Non-Class Artifacts

Files that do not define classes, such as `model.ts`, `*.config.ts`, or `routes.ts`, should be placed at the module level, outside class directories.

Example:

```text
user/
├── user.model.ts
├── user.routes.ts
└── service/
    ├── user.service.ts
    └── user.service.spec.ts
```
