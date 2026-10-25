# Client API Mapping Specification

## Purpose

Define how the Angular client maps backend REST contracts into client operations and models. This Spec does not redefine server behavior.

The canonical server contract is the [backend REST/SSE Spec](../../../../../backend/openspec/specs/system/rest-api/spec.md). Frontend requirements SHALL reference that Spec and SHALL NOT duplicate server-side semantics.

Baseline created during documentation migration. It reflects the agreed client-side decisions; it does not change code.

## Requirements

### Requirement: Canonical server contract

The client SHALL treat the backend REST/SSE Spec as the canonical source for endpoint paths, request parameters, response statuses, identity and error format.

#### Scenario: Contract change

- **WHEN** a server endpoint, parameter or response format changes
- **THEN** the client change SHALL reference the updated backend Spec and SHALL NOT invent a client-only contract.

### Requirement: Client operation mapping

Client service operations SHALL map to backend endpoints as follows:

| Client operation | Backend endpoint |
|---|---|
| `UserService.findById` | `GET /users/{id}` |
| `UserService.findByEmail` | `GET /users/by-email?email=...` |
| `UserService.create` | `POST /users` |
| `ChatService.list` | `GET /chats` |
| `ChatService.details` | `GET /chats/{id}` |
| `ChatService.messages` | `GET /messages?chat=...` |
| `ChatService.sendMessage` | `POST /messages` |
| `ChatService.create` | Backend `POST /chats` exists; client implementation is out of scope |

`ChatService.sendMessage` SHALL send `{ chat: { id }, text }`. The client SHALL NOT send `author`; the server derives it from identity.

#### Scenario: Unimplemented client operation

- **WHEN** a backend endpoint exists but the client operation is not implemented
- **THEN** documentation SHALL describe the client gap without claiming that the endpoint is absent on the server.

### Requirement: Pagination cursor

The client SHALL use the backend `SliceResponse` field `next` as the pagination cursor. The client SHALL NOT expect a field named `nextToken`, and no `next`-to-`nextToken` adapter SHALL be introduced.

The client MAY omit `pageSize`; omission is supported by the server default. `pageSize` SHALL become mandatory only if the backend Spec changes.

#### Scenario: Load next page

- **WHEN** the server returns a non-empty page
- **THEN** the client SHALL use `next` as the `lastId` cursor for the following request.

#### Scenario: Empty page

- **WHEN** the server returns no elements
- **THEN** the client SHALL treat `next` as absent or null and SHALL NOT request another page.

### Requirement: Separate chat representations

The client MAY use separate representations for chat list and chat details when their fields differ. The client SHALL NOT require `Chat.participants` unless the backend Spec defines that field.

Fields not enumerated by the backend Spec SHALL NOT be treated as agreed contract until confirmed.

#### Scenario: Chat list and details

- **WHEN** the client maps a chat list item or chat details response
- **THEN** it SHALL map only fields confirmed by the backend contract and SHALL not assume a shared `participants` field.

### Requirement: Explicit message date mapping

The client SHALL make the mapping of message `createdAt` explicit. It SHALL NOT rely on implicit conversion from a JSON string to `Date`.

#### Scenario: Message response

- **WHEN** the client receives a message with `createdAt`
- **THEN** the applied conversion or the absence of conversion SHALL be explicit in the client mapping.

### Requirement: Error contract

The client SHALL treat `ProblemDetail` as the canonical server error format. Client UI behavior for errors is outside this Spec until separately agreed.

#### Scenario: Server error

- **WHEN** a backend request fails with a client-visible error
- **THEN** the client mapping SHALL preserve access to the `ProblemDetail` response.

### Requirement: Request identity

The client SHALL send `X-User-Id` where the backend Spec requires identity. SSE subscription SHALL use the `userId` query parameter.

#### Scenario: Chat request

- **WHEN** the client requests a chat list or sends a message
- **THEN** the request SHALL carry `X-User-Id` as defined by the backend Spec.

#### Scenario: SSE subscription

- **WHEN** the client subscribes to notifications
- **THEN** it SHALL identify the user through the `userId` query parameter.

### Requirement: No invented contracts

The client SHALL NOT treat SSE payload structure, event names, event ordering, reconnect guarantees, the create-chat request, or unspecified DTO fields as agreed contract until the backend Spec or a separate integration Spec defines them.

#### Scenario: SSE implementation

- **WHEN** client documentation describes the current SSE implementation
- **THEN** it SHALL label it as observed client behavior, not as an approved server contract.

## Out of Scope

- SSE payload and event names; backend Spec extension or integration Spec is required first.
- Auth/session flow.
- Chat UI behavior and layout.
- Client implementation of chat creation.
- Exact DTO fields not enumerated by the backend Spec.
- Production base URL and deployment configuration.
