# Frontend: Domain Profile

Справочная карта текущего состояния. Не Rules и не Spec. Нормы — в `.agents/rules/`, требования — в Specs, факты — в коде и тестах.

Audit baseline: commit `346b0b7`, дата 2026-10-25. Факты проверены по исходникам, `package.json`, `angular.json`, `tsconfig*.json` и `package-lock.json`. Проверки сборки, тестов и приложения не запускались.

## Источники истины

- Нормы и ограничения — `.agents/rules/`.
- Требования frontend — `openspec/specs/frontend/client-api-mapping/spec.md`.
- REST/SSE-контракты backend — `../../../backend/openspec/specs/system/rest-api/spec.md`.
- Стек, сборка, зависимости — `package.json`, `package-lock.json`, `angular.json`, `tsconfig*.json`.
- Фактическое поведение — `src/**` и тесты.
- Проверка изменений — `.agents/procedures/verification.md`.

## Стек и проверки

- Angular 19.1, standalone, `bootstrapApplication`, zone.js 0.15.
- TypeScript 5.7.2, `strict`, `strictTemplates`; RxJS 7.8; сигналы Angular.
- PrimeNG 19.0.6 (Aura), PrimeIcons 7, Tailwind 4, `tailwindcss-primeui`, PostCSS, SCSS.
- `@angular/cdk` импортируется напрямую, в `package.json` не объявлен; установлен как peer-зависимость PrimeNG (19.1.4 в `node_modules`).
- Тесты: Karma 6.4 + Jasmine 5.5. `karma.conf.js` нет; настройки в `angular.json`, headless и coverage явно не заданы.
- Команды: `npm run build` (`ng build`), `npm test` (`ng test`). Линтера, formatter, отдельного typecheck, e2e и CI нет.
- Node.js не зафиксирован: `engines` и `.nvmrc` отсутствуют. Локально используется Node v26.4.0.
- `.editorconfig` задаёт single quotes для TS, но фактически кавычки в коде смешаны; массовое переформатирование не выполняется.

## Точки входа и маршруты

- `src/main.ts` — `bootstrapApplication(AppComponent, appConfig)`.
- `src/app/app.config.ts` — провайдеры сервисов, guards, interceptor, router, PrimeNG.
- `src/app/app.routes.ts` — централизованные маршруты, `withComponentInputBinding()`.

| Путь | Компонент | Guard | Примечание |
|---|---|---|---|
| `/` | `HomePageComponent` | — | заглушка |
| `/chat` | `ChatPageComponent` | `IsAuthorized` | `canActivate` и `canActivateChild`; список чатов |
| `/chat/:chatId` | `ChatViewPageComponent` | наследует `/chat` | дочерний маршрут |
| `/login` | `LoginPageComponent` | — | вход по email |
| `/test` | `TestPageComponent` | `IsAuthorized` | прототип чата |
| `/error/401` | `Error401Component` | — | переход из interceptor |
| `/error/403` | `Error403Component` | — | переход из interceptor |
| `/error/500` | `Error500Component` | — | нигде не используется |
| `**` | `Error404Component` | — | fallback |

Маршруты плоские и eager; lazy loading нет.

## Слои

### UI

`src/app/pages/**`: `AppComponent` (header, principal, logout), `HomePageComponent`, `LoginPageComponent`, `ChatPageComponent`, `ChatViewPageComponent`, `TestPageComponent`, `Error*Component`. PrimeNG и Tailwind используются прямо в шаблонах.

### Сервисы и DI

Сервисы регистрируются через `InjectionToken` + `*Impl` в `app.config.ts`; потребители используют `@Inject(TOKEN)`.

| Token | Реализация | Файл | Роль |
|---|---|---|---|
| `USER_SERVICE` | `UserServiceImpl` | `src/app/service/user.service.ts` | `findById`, `findByEmail`, `create`; `X-User-Id` не передаёт |
| `CHAT_SERVICE` | `ChatServiceImpl` | `src/app/service/chat.service.ts` | список, детали, сообщения, отправка; `create` бросает `Not implemented`; передаёт `X-User-Id` |
| `AUTH_SERVICE` | `AuthServiceImpl` | `src/app/service/auth.service.ts` | вход по email, восстановление сессии, выход |
| `SECURITY_SERVICE` | `SecurityServiceImpl` | `src/app/security/security.service.ts` | `Principal` в `BehaviorSubject`; `current`, `observe`, `authenticate`, `clear` |

### Безопасность

- `src/app/security/data.ts` — `Principal { accountId, displayName, authorities }`.
- `src/app/security/filters.ts` — guards `IsAuthorized`, `IsAnonymous`, `HasAuthority`.
- `src/app/security/directives.ts` — одноимённые структурные директивы.
- `src/app/http/HttpSecurityInterceptor.ts` — глобальные переходы на 401/403.
- `IsAuthorized` подключён к `/chat` и `/test`.
- `IsAnonymous`, `HasAuthority` и директивы не подключены к маршрутам и UI.
- `displayName` формируется из email, а не из `User.name`.
- `localStorage` ключ `token` хранит `accountId`, не токен; срока действия нет.
- HTTP-сервисы `ChatService` передают `X-User-Id`; `UserService` — нет; SSE использует query `userId`.

### Модели

`src/app/model/**`: `Identified`, `Ref`, `Chat`, `Participant`, `Message`, `User`, `Slice`, `Page`. Runtime-маппинга ответов в классы нет, кроме SSE через `Object.assign`.

| Модель | Поля |
|---|---|
| `Identified<I>` | `id` |
| `Ref<I, T>` | `id`; ссылка на сущность |
| `Chat` | `id?`, `name`, `participants` |
| `Participant` | `id?`, `name`, `email` |
| `Message` | `id?`, `chat: Ref`, `author: Ref`, `text`, `createdAt: Date` |
| `User` | `id?`, `name`, `email` |
| `Slice<E>` | `data`, `nextToken` |
| `Page<E>` | `data`, `total`; в UI не используется |

### Окружения

- `src/environments/environment.development.ts`: users — `localhost:8080`, chats — `8081`, messages — `8082`, notifications — `8888`.
- `src/environments/environment.ts`: все сервисы — `'/'`. Конкатенация даёт `//users/...`, `//chats`, `//messages`, `//subscribe`; production-конфигурация не подтверждена рабочей.
- Заголовок identity — `environment.security.header`, сейчас `X-User-Id`.

## Потоки данных

### Сессия

`AuthServiceImpl` в конструкторе читает `localStorage['token']`. Если значение есть, вызывает `UserService.findById(accountId)` и `SecurityService.authenticate`; при ошибке — `clear`. Если значения нет — `clear`.

### Вход

`LoginPageComponent` → `AuthService.authorizeByEmail(email)` → `UserService.findByEmail`; любая ошибка поиска ведёт к `UserService.create` с `name = email`. Затем `SecurityService.authenticate`, запись `accountId` в `localStorage`, переход на `/test`. `returnUrl` игнорируется. Если principal уже есть, login-page ведёт на `/`.

### Список чатов

`ChatPageComponent` держит `tokens$` и accumulator. `ngOnInit` отправляет `null`; `ChatService.list` возвращает `Slice`; данные добавляются в accumulator; `lastToken` и `hasMore` берутся из `nextToken`. `loadNext()` отправляет `lastToken`.

### Просмотр чата

`ChatViewPageComponent` получает `chatId` через `@Input`, передаёт его родительскому `ChatPageComponent`, запрашивает `ChatService.details`. Сообщения — фиксированный `randomMessage()`; `sendMessage` пуст.

### Прототип `/test`

`TestPageComponent` в конструкторе загружает список чатов, детали и сообщения; `CHAT_ID` и `USER_ID` зашиты константами. SSE создаётся в конструкторе через `EventSource`. События `ChatCreated` и `MessagePublished` разбираются по `@type` и добавляются в сигналы; `DebugEvent` только логируется. Реконнекта нет; при `error` и `ngOnDestroy` источник закрывается.

### Ошибки

`HttpSecurityInterceptor`: 401 — `SecurityService.clear()`, переход `/error/401`, возврат `NEVER`; 403 — переход `/error/403`, возврат `NEVER`; остальные ошибки пробрасываются. В UI ошибки обрабатываются через `alert`/`console.log`; единого слоя ошибок нет. `/error/500` не используется.

## Подтверждённые ограничения

- Глобального store/repository нет; состояние локальное (`BehaviorSubject`, `signal`, `toSignal`).
- HTTP-доступ сосредоточен в `src/app/service/**` и interceptor.
- `ChatService.create` бросает `Error("Not implemented")`; UI создания чата нет.
- `ChatViewPageComponent.sendMessage` пуст; реальная загрузка сообщений и SSE не подключены.
- `Page` и `Participant[]` в UI не задействованы.
- `@angular/cdk` не объявлен в `package.json`; состояние `node_modules` влияет на сборку.
- Нет OpenAPI/Connekt и отдельного API-клиента: URL, типы и маппинг заданы вручную.
- Тесты сгенерированы и не являются рабочим покрытием: `app.component.spec.ts` обращается к отсутствующим `title` и `h1`; specs компонентов не предоставляют обязательные DI-провайдеры; `TestPageComponent` создаёт `EventSource` в конструкторе. `npm test` может упасть на компиляции или DI; это ограничение тестовой инфраструктуры, а не доказательство ошибки изменения.
- Нет lint, formatter, отдельного typecheck, e2e и CI. `README.md` упоминает `ng e2e`, но target отсутствует.
- `Message.createdAt` типизирован `Date`, но runtime-преобразование из строки не выполняется.
- `UserService` не передаёт `X-User-Id`; SSE не передаёт кастомные заголовки и использует query `userId`.
- `IsAnonymous`, `HasAuthority` и security-директивы не подключены.
- Вход игнорирует `returnUrl` и ведёт на `/test`.
- `displayName` — email, а не `User.name`.
- `authorizeByEmail` ловит любую ошибку поиска и создаёт пользователя; interceptor на 401/403 возвращает `NEVER`, подписка может зависнуть.
- `HasAuthority` сравнивает массив со строкой; роли всегда `[]`.
- `ChatPageComponent.chats` может быть `undefined` до первого ответа; `loading` выставляется после ответа и держится 500 мс.
- Virtual scroll использует фиксированный `itemSize="50"` при многострочных сообщениях; `ChatViewPageComponent` напрямую внедряет родительский `ChatPageComponent`.
- Логика списка, сообщений и SSE дублируется между страницами.

## Расхождения и открытые вопросы

Это не решения и не новые требования. Нужно отдельное согласование.

| Тема | Backend Spec / код | Frontend | Последствие |
|---|---|---|---|
| Пагинация | `SliceResponse { data, next }` | `Slice { data, nextToken }`; чтение `nextToken` в `chat-page` и `test-page` | Список чатов не переходит на следующую страницу: `nextToken` пуст, `hasMore` = false |
| Размер страницы | `pageSize` — параметр списков, default 10 | Не передаётся | Client API Mapping Spec фиксирует `pageSize` как optional; при изменении backend Spec потребуется отдельное решение |
| DTO чата | `ChatListItem {id,name,owner,createdAt}`, `ChatDetails {id,name,owner,members,createdAt}` | `Chat {id,name,participants}` | Client API Mapping Spec допускает отдельные представления и не требует `participants`; точные поля требуют подтверждения |
| Создание чата | Backend `POST /chats` реализован | `ChatService.create` бросает `Not implemented` | Backend endpoint есть; клиентская реализация не завершена. Это нужно описывать раздельно |
| Ошибки | `ProblemDetail` | Клиент не разбирает; UI — `alert`/`console.log` | Client API Mapping Spec фиксирует `ProblemDetail` как серверный формат; клиентское поведение UI пока не согласовано |
| CORS/proxy | Backend CORS настроен частично (`notifications` — `allowedOrigins("*")`, MVC — `allowedMethods("*")`) | Frontend proxy нет | Утверждение «нет CORS-конфигурации» было слишком широким; это operational-факт, не API-контракт |
| Директивы | — | Ранее `conventions.md` утверждал регистрацию в `app.config.ts` | Утверждение удалено; директивы не импортируются и не подключены |

## Открытые вопросы

- Какие именно поля `ChatListItem` и `ChatDetails` нужны UI; входит ли `participants` в клиентскую модель.
- Нужно ли явное преобразование `createdAt` из строки в `Date`; сейчас его нет.
- Входят ли `PUT /users/{id}` и `GET /members` в клиентский объём.
- Как обрабатывать `ProblemDetail` в UI и допустимо ли поведение interceptor с `NEVER`.
- SSE payload, имена событий, порядок, reconnect и гарантии доставки не определены в backend REST Spec; нужен отдельный контракт.
- Auth/session и chat UI не специфицированы; создавать их Specs преждевременно без согласованных требований.
- Фактическое поведение `ng serve`, `ng build`, `ng test`, CORS/SSE и production reverse proxy не проверялось.
- Реальные схемы ответов и коды ошибок backend не проверялись в runtime; источник — backend Spec и код.

## Карта файлов

- `src/main.ts` — bootstrap.
- `src/app/app.config.ts` — DI, providers, router, PrimeNG.
- `src/app/app.routes.ts` — маршруты.
- `src/app/pages/**` — UI-компоненты.
- `src/app/service/**` — HTTP-сервисы и токены.
- `src/app/security/**` — principal, guards, директивы.
- `src/app/http/HttpSecurityInterceptor.ts` — глобальная обработка 401/403.
- `src/app/model/**` — модели и пагинация.
- `src/environments/**` — адреса сервисов и заголовок identity.
- `src/app/**/*.spec.ts` — сгенерированные тесты, не рабочее покрытие.
