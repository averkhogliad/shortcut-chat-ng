# Контракты API и SSE

Обязательные правила при изменении запросов к backend. Контракты восстановлены по коду; OpenAPI/Connekt-файлов в репозитории нет.

## Базовые URL

- База — `environment.services.{users,chats,messages,notifications}` (`src/environments/environment.ts`, `src/environments/environment.development.ts`).
- Путь формируется конкатенацией: `${base}/users/...`, `${base}/chats`, `${base}/messages`, `${base}/subscribe?...`.
- Development: `users` — 8080, `chats` — 8081, `messages` — 8082, `notifications` — 8888 на `localhost`.
- Production: все значения `'/'`; конкатенация даёт `//users/...`, `//chats`, `//messages`, `//subscribe`. Это известная проблема: production-конфигурация в текущем виде не подтверждена рабочей. Не считай её эталоном и не исправляй попутно.
- Заголовок авторизации — `environment.security.header`, сейчас `X-User-Id`; значение — `accountId`.

## Users (`src/app/service/user.service.ts`)

- `GET {users}/users/{id}` — ответ `User`.
- `GET {users}/users/by-email?email={email}` — ответ `User`.
- `POST {users}/users` с телом `User` — ответ `User`.
- `X-User-Id` в этих запросах не передаётся.
- `User`: `{ id?, name, email }` (`src/app/model/user.ts`).

## Chats (`src/app/service/chat.service.ts`)

- `GET {chats}/chats?lastId={token}` — ответ `Slice<Chat>`; параметр `lastId` добавляется только при наличии токена.
- `GET {chats}/chats/{chatId}` — ответ `Chat`.
- `POST {chats}/chats` не реализован: `create()` бросает `Error("Not implemented")`. Не описывай создание чата как работающее.
- Оба GET передают `X-User-Id`.
- `Chat`: `{ id?, name, participants: Participant[] }`; `Participant`: `{ id?, name, email }` (`src/app/model/chat.ts`).

## Messages (`src/app/service/chat.service.ts`)

- `GET {messages}/messages?chat={chatId}&lastId={token}` — ответ `Slice<Message>`.
- `POST {messages}/messages` с телом `{ chat: { id }, text }` — ответ `Message`. Автор в теле не передаётся.
- Оба запроса передают `X-User-Id`.
- `Message`: `{ id?, chat: Ref, author: Ref, text, createdAt }`. `createdAt` типизирован `Date`, но runtime-преобразование из строки не выполняется.

## SSE (`src/app/pages/test-page/test-page.component.ts`)

- `GET {notifications}/subscribe?userId={userId}` через `EventSource`.
- Кастомные заголовки, включая `X-User-Id`, не передаются; идентификация только query-параметром.
- Клиент ожидает JSON-массив событий в `event.data`; элементы разбираются по `@type`: `ChatCreated`, `MessagePublished`, `DebugEvent`.
- Реконнекта нет: при событии `error` источник закрывается; в `ngOnDestroy` — тоже.
- `userId` зашит константой в `TestPageComponent` и не берётся из principal. Это прототип, а не готовый механизм.
- Гарантии доставки, порядок и полный формат событий не документированы; не придумывай их.

## Пагинация и совместимость

- `Slice<E> = { data: E[], nextToken: string }` (`src/app/model/paging.ts`); курсор передаётся как `lastId`.
- Не переименовывай существующие пути, параметры и поля без согласования с backend.
- Изменения делай аддитивными; новые поля не должны ломать текущие ответы.
- HTTP-статусы и формат ошибок клиентом не зафиксированы. Известно только: 401 и 403 перехватываются глобально (`HttpSecurityInterceptor`), остальные ошибки пробрасываются.

## Известные проблемы

- `POST /chats` отсутствует.
- Production base URL `'/'` даёт некорректные пути.
- SSE не использует principal и не переподключается.
- Сгенерированных контрактов и отдельного API-клиента нет: URL и типы заданы вручную.
