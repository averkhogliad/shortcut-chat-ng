# Frontend: справочный контекст

Справочные сведения, не обязательные правила. Состояние на 2026-10-25.

## Стек

- Angular 19.1 (standalone, `bootstrapApplication`), TypeScript 5.7.2, RxJS 7.8, zone.js 0.15.
- PrimeNG 19.0.6 (Aura), PrimeIcons 7, Tailwind 4, `tailwindcss-primeui`, PostCSS, SCSS.
- Тесты: Karma 6.4, Jasmine 5.5, `@types/jasmine` 5.1.
- Сборка: `@angular-devkit/build-angular:application`; production — конфигурация по умолчанию, budgets 500 kB/1 MB.
- Node.js не зафиксирован; Angular требует `^18.19.1 || ^20.11.1 || >=22.0.0`.
- `@angular/cdk` используется (virtual scroll), но в `package.json` не объявлен.

## Карта

Маршруты (`src/app/app.routes.ts`):

- `/` — `HomePageComponent`.
- `/chat` — `ChatPageComponent`, guard `IsAuthorized`; child `:chatId` — `ChatViewPageComponent`.
- `/login` — `LoginPageComponent`.
- `/test` — `TestPageComponent`, guard `IsAuthorized`.
- `/error/401`, `/error/403`, `/error/500` — статические страницы.
- `**` — `Error404Component`.

Компоненты:

- `AppComponent` — header, principal, logout.
- `HomePageComponent` — заглушка.
- `LoginPageComponent` — вход по email.
- `ChatPageComponent` — список чатов, курсорная пагинация, CDK virtual scroll.
- `ChatViewPageComponent` — просмотр чата; сообщения-заглушки, отправка пустая.
- `TestPageComponent` — прототип чата: чаты, сообщения, отправка, SSE.
- `Error*Component` — статические страницы.

Сервисы и безопасность:

- `USER_SERVICE` / `UserServiceImpl` — users API.
- `CHAT_SERVICE` / `ChatServiceImpl` — chats и messages API.
- `AUTH_SERVICE` / `AuthServiceImpl` — вход, `localStorage` с ключом `token`, восстановление сессии.
- `SECURITY_SERVICE` / `SecurityServiceImpl` — `Principal` в `BehaviorSubject`.
- Guards `IsAuthorized`/`IsAnonymous`/`HasAuthority` (`security/filters.ts`) и одноимённые директивы (`security/directives.ts`).
- `HttpSecurityInterceptor` — глобальные переходы на 401/403.

Модели: `Identified`, `Ref`, `Chat`, `Participant`, `Message`, `User`, `Slice`, `Page`.

## Реализовано

- Вход по email: поиск, создание пользователя при ошибке поиска, сохранение `accountId`, восстановление при старте.
- Выход и отображение principal.
- Guard на `/chat` и `/test`.
- Список чатов с пагинацией; просмотр деталей чата.
- Прототип чата на `/test`: сообщения, отправка, SSE-события.
- Глобальные переходы на 401/403.

## Не завершено

- `ChatService.create` бросает `Not implemented`; UI создания чата нет.
- `ChatViewPageComponent.sendMessage` пуст; сообщения — фиксированный `randomMessage()`; реальная загрузка и SSE не подключены.
- Login игнорирует `returnUrl` и ведёт на `/test`.
- `IsAnonymous`, `HasAuthority` и security-директивы не подключены к UI и маршрутам.
- `/error/500` нигде не используется.
- Нет управления участниками, профилем, unread/typing, редактирования и удаления сообщений.
- `Page` и `Participant[]` не задействованы в UI.
- Store/repository нет; TODO в `chat-page.component.ts`.

## Технический долг и риски

- Production base URL `'/'` даёт `//users/...`, `//chats`, `//messages`, `//subscribe`; конфигурация не подтверждена рабочей.
- `@angular/cdk` не объявлен в `package.json`.
- Тесты не работают как есть: битый `app.component.spec.ts`, отсутствие DI-провайдеров, `EventSource` в конструкторе.
- `authorizeByEmail` ловит любую ошибку и создаёт пользователя; interceptor на 401/403 возвращает `NEVER`, подписка зависает.
- `X-User-Id` и `localStorage`-токен без срока действия; `UserService` и SSE заголовок не передают.
- `HasAuthority` сравнивает массив со строкой; роли всегда `[]`.
- Нет proxy/CORS-конфигурации при dev-портах 8080/8081/8082/8888.
- `ChatPageComponent.chats` может быть `undefined` до первого ответа.
- `loading` выставляется после ответа и держится 500 мс.
- Virtual scroll с фиксированным `itemSize="50"` при многострочных сообщениях.
- `ChatViewPageComponent` напрямую внедряет родительский `ChatPageComponent`.
- Логика списка, сообщений и SSE дублируется между страницами.
- Ошибки UI — `alert`/`console.log`; единого слоя ошибок нет.
- Нет lint, formatter, e2e и CI; есть неиспользуемые импорты.
- `Message.createdAt` не преобразуется из строки; runtime-маппинга ответов нет.
- `displayName` — email, а не `User.name`.

## Не исследовано

- Фактические схемы ответов и коды ошибок backend.
- Реальный запуск `ng serve`, `ng build`, `ng test`.
- Поведение CORS/SSE и production reverse proxy.
- Версия установленного Node.js.
