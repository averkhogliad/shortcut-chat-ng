# Архитектура

Обязательные границы и текущие соглашения Angular-приложения. Состояние на 2026-10-25.

## Обязательные границы

- Приложение standalone: `NgModule` нет. Каждый компонент объявляет зависимости в `imports`; запуск через `bootstrapApplication` (`src/main.ts`).
- Доступ к HTTP — в сервисах `src/app/service/**` и в security-interceptor. Компоненты не вызывают `HttpClient` напрямую.
- Сервисы регистрируются через `InjectionToken` + `*Impl` в `src/app/app.config.ts`; потребители используют `@Inject(TOKEN)`. Не подменяй этот механизм прямым `providedIn: 'root'` без причины.
- Маршруты централизованы в `src/app/app.routes.ts`. Защищённые разделы закрывай `IsAuthorized` (`src/app/security/filters.ts`).
- Контракты backend не расширяй на клиенте самовольно; работай по `api-contracts.md`.

## Текущие соглашения (не инварианты)

- Маршруты плоские и eager; lazy loading нет. `/chat` — родительский компонент со списком, `:chatId` — дочерний просмотр.
- `withComponentInputBinding()` включён: `chatId` приходит через `@Input`; дочерний компонент вручную передаёт его родителю.
- Состояние локальное: `BehaviorSubject` + `toSignal` или `signal`. Глобального store/repository нет; в `chat-page.component.ts` есть TODO о выносе.
- Модели — простые классы в `src/app/model/**` (`Identified`, `Ref`, `Chat`, `Message`, `User`, `Slice`). Runtime-маппинга ответов в классы нет, кроме SSE.
- UI-слой — компоненты `src/app/pages/**`; PrimeNG и Tailwind используются прямо в шаблонах.
- Слой безопасности — `SecurityService`, guards, директивы и `HttpSecurityInterceptor`. Guards `IsAnonymous`/`HasAuthority` и директивы пока не подключены к маршрутам.

## Ограничения изменений

- Не вводи новую архитектуру, глобальный state management, repository-слой или lazy loading без задачи, которая этого требует.
- Не переноси бизнес-логику между компонентами и сервисами в рамках локальной правки.
- Не создавай новую копию логики списка, сообщений или SSE; выноси общее только в объёме задачи.
- Не выдавай текущие соглашения выше за неизменяемые инварианты. Обоснованное улучшение допустимо, если оно входит в задачу.
