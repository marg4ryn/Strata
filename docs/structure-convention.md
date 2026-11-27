# Application Directory Structure

The structure is feature-oriented, inspired by Nx. Code is grouped by business functionality, while application-wide infrastructure, layout, and reusable building blocks are kept separate. The rules below are short on purpose: the location of every file follows from its name and the module it belongs to.

## 1. Top-Level Directories

* `app/core/` — application infrastructure, loaded once (HTTP, logging, storage, i18n, language).
* `app/layout/` — page layout components, such as the header and footer.
* `app/shared/` — reusable UI building blocks and utils that know nothing about the domain.
* `app/features/` — business functionalities, one directory per feature.

Each subdirectory of these four is a **module**. Allowed dependencies between modules:

* `feature` → `core`, `shared`, `feature`
* `layout` → `core`, `shared`, `feature`
* `core` → `core`, `shared`
* `shared` → `core`, `shared`

## 2. Public API

A module exposes its public API through `index.ts`, with explicit exports (`export *` is forbidden). Other modules import only from `index.ts`, never from internal files.

A lazy-loaded feature has a second entry point: its `*.routes.ts` file. It is loaded only with `loadChildren: () => import('…/feature-name.routes')` from the parent routes and is never exported from `index.ts`. Exporting routes from `index.ts` would pull the whole feature into the initial bundle through any static import of the facade.

Both rules are enforced by ESLint (`eslint-plugin-boundaries` and `no-restricted-imports`).

## 3. Feature Structure

```text
features/analysis-run/
├── index.ts                    public API
├── analysis-run.facade.ts      entry point used by other modules
├── analysis-run.model.ts       types of the feature
├── analysis-run.routes.ts      lazy entry point (lazy-loaded features only)
├── data-access/                services talking to the API, stores, storage
├── feature/                    routed pages and smart components
├── ui/                         presentational components, directives, pipes
└── utils/                      functions and validators
```

A feature contains only the layer directories it needs.

**`feature/` or `ui/`?** A component belongs in `feature/` if it is used as a route component, injects a data-access service or a facade, or makes decisions based on domain data. Otherwise — when it uses only `input()` / `output()` and domain-agnostic services — it belongs in `ui/`.

**Subfeature.** A part of a feature with its own lazy-loaded routes and its own state is a subfeature. It is a folder inside the feature with the same structure — its own `*.routes.ts` and the layers it needs — but without `index.ts` or a facade when it is reached only through its routes:

```text
features/analysis-results/
├── analysis-results.routes.ts      loads code-city/code-city.routes.ts
├── code-city/
│   ├── code-city.routes.ts
│   ├── data-access/
│   ├── feature/
│   └── ui/
├── data-access/
├── feature/
└── ui/
```

A growing number of components alone is not a reason to extract a subfeature.

## 4. Files and Folders

**Rule 1 — one folder per artifact.** A file named `name.kind.ts` lives, together with its `.spec.ts`, `.html`, and `.scss`, in a folder called `name`. A folder holds exactly one artifact, so artifact names within a module must be unique:

```text
ui/
└── analysis-target-form/
    ├── analysis-target-form.component.ts
    ├── analysis-target-form.component.spec.ts
    ├── analysis-target-form.component.html
    └── analysis-target-form.component.scss
```

The rule applies to every artifact kind: components, services, directives, pipes, guards, utils, validators, and plain classes such as builders or renderers — also when the artifact has the same name as its module.

Only module-level files sit flat in the module root: `index.ts`, the facade (the module's public entry point), and declaration files (Rule 4):

```text
core/language/
├── index.ts
├── language.facade.ts
├── language.model.ts
├── language/
│   └── language.service.ts
├── browser-language/
│   └── browser-language.service.ts
└── language-store/
    └── language-store.service.ts
```

**Rule 2 — no folders named after artifact kinds.** Folders such as `components/`, `services/`, or `directives/` are not used; the file suffix already says what an artifact is. The only role-based folders are the layers (`data-access/`, `feature/`, `ui/`, `utils/`), used in features and in `shared/`.

**Rule 3 — optional thematic grouping.** When a folder gets crowded, related artifacts can be grouped in a folder named after their theme:

```text
ui/
├── charts/
│   ├── bar-chart/
│   └── line-chart/
└── resource/
    ├── analysis-error/
    └── analysis-loading/
```

**Rule 4 — declaration files stay flat.** Files that only declare things — `*.model.ts`, `*.routes.ts`, `*.config.ts`, `*.providers.ts`, `index.ts` — do not get their own folder. They sit in the module or folder they describe. When a feature has many types, `*.model.ts` files are moved to a `models/` folder.

## 5. Shared

`shared/` uses the same layers as a feature, each being a module with its own `index.ts`:

* `shared/ui/` — components, directives, and pipes that know nothing about the domain;
* `shared/utils/` — pure functions.

```text
shared/
├── ui/
│   ├── index.ts
│   ├── button/
│   ├── confirm-operation/
│   ├── confirm-operation-modal/
│   ├── dropdown/
│   └── localized-date/
└── utils/
    ├── index.ts
    └── date/
```

## 6. Naming

* File names use kebab-case and a type suffix: `.component.ts`, `.service.ts`, `.directive.ts`, `.pipe.ts`, `.facade.ts`, `.utils.ts`, `.model.ts`, and so on.
* Class names use the matching suffix: `AnalysisRunFacade`, `LoggerService`, `ButtonDirective`.
* Component selectors match the file name with the `app-` prefix: `abandoned-code.component.ts` → `app-abandoned-code`.
* A plain class without an Angular role or a recognised kind has no suffix: `context-logger.ts` holds `ContextLogger`.
* The suffixes are kept on purpose, although Angular 20+ generates files without them by default. The `schematics` section of `angular.json` is configured so that `ng generate` follows this convention.
