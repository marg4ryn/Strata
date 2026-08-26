## [Architecture] Why Angular?

### Context

I wanted to learn a framework that would allow me to build a scalable, long-term maintainable application with a strong reputation.

### Decision

I chose Angular because of its rich set of features available out of the box and its predictable project structure. This allows a developer moving from another Angular project to become familiar with the codebase relatively quickly without having to learn the project's organization from scratch.

### Alternatives Considered

I considered React and Vue, but ultimately decided against both.

React provides a great deal of freedom in how an application is organized. While this can be an advantage, I considered it a disadvantage in this case. The lack of an opinionated structure can lead to different approaches to organizing code depending on the project or team, making it harder to maintain predictability.

Vue is simpler and provides fewer features directly within the framework than Angular.

### Consequences

The project structure and naming conventions must be maintained consistently to preserve the intended predictability ([see: Application Directory Structure Standard](#architecture-application-directory-structure-standard)).

Choosing Angular also means greater reliance on its ecosystem and conventions. In return, I get a consistent environment with many features available without having to select and integrate additional libraries.


## [Architecture] Why SPA?

### Context

The application is an analytics dashboard where access to most views is only available after an analysis has been performed. It also contains numerous interactive visualizations where performance is important.

### Decision

I chose a Single-Page Application (SPA) architecture.

### Alternatives Considered

SSR and SSG were rejected. Even with either approach, a browser crawler would not have access to most of the application because it is protected behind the analysis process. Therefore, the potential SEO benefits would be minimal, while the implementation cost would not be justified.

### Consequences

The application's SEO remains limited. This is an intentional trade-off, as SEO is not a priority for this product. The priority is the performance of interactive visualizations.


## [Architecture] Why this Application Directory Structure Convention?

### Context

The application needs a consistent and predictable standard for organizing directories and files. The standard should limit unnecessary nesting while maintaining a clear separation of different artifact types (components, services, directives, etc.) and clearly defining the public API of each module.

### Decision

I adopted the organization standard described in detail in `structure-convention.md`.

### Alternatives Considered

I considered grouping artifacts into separate directories in a completely predictable manner, regardless of their number within a module. I rejected this approach because it would lead to unnecessary nesting in small modules. In this case, I considered limiting the number of directories more important than having completely predictable locations for every type of artifact.

### Consequences

The directory structure may change as a module grows. Adding or removing artifacts may require moving files between directories. This requires greater discipline during development, but allows the structure to remain as flat as possible and limits unnecessary nesting.


## [Architecture] Why Angular CDK Overlay?

### Context

The application contains numerous overlay elements: panels accessible from the header, modals, dialogs, and dropdown lists. These elements need to operate independently of the main page layout while remaining consistent in terms of behavior and accessibility.

### Decision

All overlay elements are implemented using Angular CDK Overlay.

### Alternatives Considered

I considered creating a custom solution based on native browser mechanisms. However, I saw little justification in implementing functionality for positioning, layer management, focus handling, and accessibility from scratch. Angular CDK provides a ready-made and proven solution that is part of the Angular ecosystem, so I chose to use it instead of maintaining a custom implementation.

### Consequences

All overlays have a consistent implementation with built-in accessibility (a11y) support provided by CDK.


## [Architecture] Why Transloco?

### Context

The application requires multilingual support with the ability for users to change the language at runtime without reloading the page.

### Decision

I chose Transloco as the most popular library for runtime translations.

### Alternatives Considered

Angular's built-in localization (compile-time translations) was rejected. Despite its good SEO support, it does not allow the language to be changed without reloading the application. SEO is not a priority for this product ([see: Why SPA?](#architecture-why-spa)).

### Consequences

Translations are resolved at runtime, which introduces additional runtime overhead compared to a compile-time solution. This cost is accepted in exchange for the flexibility to change the language without reloading the application.


## [Architecture] Why only one translation file per locale?

### Context

The application supports multiple languages, so translation strings must be stored in dedicated locale files. The structure should remain simple and easy to integrate with the application's i18n tooling. Translations can be stored in one file per locale or split by application module. Since the project is relatively small and has few developers, the chosen approach should avoid unnecessary complexity.

### Decision

I store all translations for a given locale in a single file. This reduces the number of HTTP requests, keeps the i18n configuration simple, supports i18n plugins, and makes translation management easier.

### Alternatives Considered

Translations could be split into separate files for individual modules. This would provide clearer module boundaries and could be useful in a larger project with more developers. For the current project, this would add unnecessary files and configuration without providing enough benefit to justify the additional complexity.

### Consequences

The translation structure remains simple and predictable, with minimal configuration overhead. The main drawback is that locale files may become harder to navigate as the application grows. If the project or team becomes significantly larger, this decision can be revisited and translations split by module.


## [Shared: Button Directive] Why are the main application buttons a directive?

### Context

The application needs a consistent appearance for its main buttons, with `primary`, `secondary`, and `danger` variants used throughout the application.

### Decision

The button styling is implemented as a directive applied to the native `button[btn]` element instead of as a separate component such as `<app-button>`. The directive only calculates and assigns the CSS class (`btn btn--{{variant}}`) to the host element. The actual styling rules are defined in the global `styles.scss` rather than in the directive's `styles`.

### Alternatives Considered

`<app-button>` component instead of a directive on `button` — rejected to preserve the native semantics and accessibility of the `<button>` element, including focus handling, keyboard interaction, and screen reader support, without having to manually forward ARIA attributes through a wrapper component.

Styles scoped to the directive (`styles: [...]`) — rejected because Angular's component style encapsulation can cause component styles to be included separately for each place where they are used. Moving the styles to `styles.scss` ensures that the rules are loaded once globally, which makes sense for an element as widely used as a button.

### Consequences

Buttons retain the full native semantics and accessibility of the `<button>` element.

Style variants are managed in a single place (`styles.scss`), making visual consistency easier to maintain. However, the button styles are not encapsulated by Angular and therefore must be consciously maintained as part of the global design system rather than as local component logic.


## [Feature: Analysis Run] Why Web Locks API?

### Context

Users must be able to close the application without losing information about ongoing analyses, which requires using LocalStorage to persist their state. However, LocalStorage is shared across multiple browser tabs, creating a risk of simultaneous access to the same data if the same analysis is open in multiple tabs at the same time.

### Decision

A lock for a given analysis is acquired using the Web Locks API, indicating that the analysis is currently being handled by a specific tab. The lock is released only after:

* the analysis is completed and its data is removed from LocalStorage, or
* the browser tab is closed,

which signals to other tabs that they can take over the analysis.

### Consequences

This prevents write conflicts in LocalStorage between tabs operating on the same analysis, at the cost of additional logic for managing the lock's lifecycle.


## [Feature: Analysis History] Why Broadcast Channel API?

### Context

The analysis history is loaded once through `AppInitializer` in `app.config.ts`, similarly to the other application initializers. However, if another browser tab completes an analysis and adds an entry to the history, or if the user deletes an existing entry, the current tab needs to be notified of the change.

### Decision

Synchronization between tabs is handled using the Broadcast Channel API. The tab that adds or removes an analysis sends a message describing the event (`added`/`removed`) along with the relevant payload. Other tabs update their application state directly based on the received message without reading from LocalStorage.

### Alternatives Considered

I considered using the Storage Event API, as well as using the Broadcast Channel API only to notify other tabs about changes and then having each tab read the updated data from LocalStorage.

However, the Broadcast Channel API allows arbitrary payloads to be sent along with event information. Since a synchronization mechanism needs to be implemented anyway, reading LocalStorage again is unnecessary. Sending the data directly in the message simplifies change handling and eliminates unnecessary read operations.

### Consequences

The history state is synchronized between tabs immediately without requiring LocalStorage to be read again for every change. Messages contain all the data necessary to update the state, keeping the synchronization mechanism simple and inexpensive.
