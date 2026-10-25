# Архитектура

Обязательные архитектурные границы и ограничения изменений Angular-приложения.

## Обязательные границы

- Приложение standalone: `NgModule` нет. Каждый компонент объявляет зависимости в `imports`; запуск через `bootstrapApplication` (`src/main.ts`).
- Доступ к HTTP — в сервисах `src/app/service/**` и в security-interceptor. Компоненты не вызывают `HttpClient` напрямую.
- Сервисы регистрируются через `InjectionToken` + `*Impl` в `src/app/app.config.ts`; потребители используют `@Inject(TOKEN)`. Не подменяй этот механизм прямым `providedIn: 'root'` без причины.
- Маршруты централизованы в `src/app/app.routes.ts`. Защищённые разделы закрывай `IsAuthorized` (`src/app/security/filters.ts`).
- Контракты backend не расширяй на клиенте самовольно. Server contract — backend Spec (`../../../../backend/openspec/specs/system/rest-api/spec.md`); client mapping — `openspec/specs/frontend/client-api-mapping/spec.md`; краткое правило — `api-contracts.md`.

## Ограничения изменений

- Не вводи новую архитектуру, глобальный state management, repository-слой или lazy loading без задачи, которая этого требует.
- Не переноси бизнес-логику между компонентами и сервисами в рамках локальной правки.
- Не создавай новую копию логики списка, сообщений или SSE; выноси общее только в объёме задачи.
- Не выдавай текущие соглашения за неизменяемые инварианты. Обоснованное улучшение допустимо, если оно входит в задачу.
