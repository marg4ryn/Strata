# Struktura katalogów aplikacji

## Katalogi główne

* `app/core/` — infrastruktura aplikacji, obejmująca serwisy singleton, interceptory oraz guardy. Są to elementy ładowane raz, na poziomie całej aplikacji.
* `app/features/` — poszczególne funkcjonalności biznesowe, z których każda znajduje się w osobnym podfolderze.
* `app/layout/` — komponenty odpowiedzialne za układ strony, takie jak header i footer.
* `app/shared/` — dyrektywy, komponenty i serwisy wielokrotnego użytku, niezwiązane z jedną konkretną domeną.

## Struktura katalogu feature'u

Każdy feature w `app/features/` ma następującą strukturę:

* `data-access/` — logika dostępu do danych, w tym serwisy komunikujące się z API, store'y i resolvery.
* `feature/` — smart components — komponenty realizujące logikę biznesową feature'u.
* `ui/` — dumb components — komponenty prezentacyjne, specyficzne dla danego feature'u.
* `utils/` — funkcje pomocnicze, typy i mapery niezwiązane bezpośrednio z konkretną klasą.


# Organizacja artefaktów aplikacji

## Artefakty klasowe

Każda klasa, np. `Service`, `Component`, `Directive`, `Pipe`, `Guard`, `Resolver` czy `Interceptor`, powinna znajdować się we własnym katalogu nazwanym tak jak klasa, bez sufiksu określającego jej typ.

W tym samym katalogu należy umieścić:

* plik implementacji,
* plik testów `.spec.ts`,
* pliki towarzyszące, np. `.html` i `.scss`.

Przykład:

```text
user-profile/
├── user-profile.component.ts
├── user-profile.component.spec.ts
├── user-profile.component.html
└── user-profile.component.scss
```

### Wyjątek 1 — główny serwis feature'u lub modułu core

Dla głównego serwisu feature'u lub modułu `core/` należy używać katalogu `service/`. Nazwa ta określa rolę katalogu, a nie domenę. Strukturalnie taki katalog występuje zawsze jako pojedynczy element.

Przykład:

```text
user/
└── service/
    ├── user.service.ts
    └── user.service.spec.ts
```

### Wyjątek 2 — pomijanie katalogu klasy

Katalog klasy można pominąć, jeśli nadrzędny kontener jednoznacznie wskazuje, do jakiej klasy należą pliki.

Dotyczy to:

* pojedynczego komponentu w katalogu `ui/` lub `feature/`,
* fasady umieszczonej w katalogu głównym feature'u lub modułu `core/`.

## Artefakty nieklasowe

Pliki, które nie definiują klas, np. `model.ts`, `*.config.ts` czy `routes.ts`, należy umieszczać na poziomie modułu, poza katalogami klas.

Przykład:

```text
user/
├── user.model.ts
├── user.routes.ts
└── service/
    ├── user.service.ts
    └── user.service.spec.ts
```
