# DATABASE DESIGN

## MongoDB

### User

| Field | Type | Rules |
|---|---|---|
| name | String | required, 3–20 chars, trim |
| username | String | unique (when set), lowercase, 3–30 chars, letters/numbers/`.`/`_` |
| email | String | required, unique, trim, lowercase |
| password | String | argon2 hash, hidden by default (`select: false`), required when provider = local |
| provider | String | `local` / `google` / `facebook`, default `local` |
| role | String | `user` / `admin`, default `user` |
| isVerified | Boolean | default false |
| twoStepEnabled | Boolean | default false |
| isDeleted | Boolean | default false (soft delete) |
| deletedAt | Date | set on delete, account can be restored for 30 days |
| dob | Date | |
| gender | String | `Male` / `Female` |
| bio | String | max 160 |
| profilePicturePath | String | |
| coverImagePath | [String] | max 3 |
| cvPath | String | |
| settings.acceptMessages | Boolean | default true |
| settings.allowGuestMessages | Boolean | default true |
| settings.showPublicMessages | Boolean | default true |
| settings.emailNotifications | Boolean | default true |
| passwordChangedAt | Date | |
| lastLoginAt | Date | |
| createdAt / updatedAt | Date | timestamps |

Indexes: `email` unique, `username` unique (partial, only string values).

---

### Session (refresh tokens / devices)

| Field | Type | Rules |
|---|---|---|
| user | ObjectId → User | required |
| refreshTokenHash | String | sha256 of the refresh token secret |
| userAgent | String | |
| ip | String | |
| lastUsedAt | Date | |
| expiresAt | Date | TTL index, deleted automatically |

The refresh token is `<sessionId>.<random secret>`. Every refresh rotates the secret. Reusing an old refresh token deletes the session.

---

### OTP

| Field | Type | Rules |
|---|---|---|
| email | String | required, lowercase |
| purpose | String | `verify-email`, `reset-password`, `restore-account`, `enable-two-step`, `disable-two-step`, `login-two-step` |
| codeHash | String | HMAC-SHA256 of the code (the code itself is never stored) |
| attempts | Number | wrong tries, max 5 |
| sentAt | Date | used for the 60 s resend cooldown |
| expiresAt | Date | TTL index, 10 minutes |

Index: `{ email, purpose }` unique. An OTP is deleted after it's used, after 5 wrong tries, or when it expires.

---

### Message (anonymous inbox)

| Field | Type | Rules |
|---|---|---|
| content | String | required, 1–200 chars |
| receiver | ObjectId → User | required |
| sender | ObjectId → User | null for guests, hidden by default (`select: false`), never returned to the receiver until an identity request is accepted |
| isRead / readAt | Boolean / Date | |
| isFavorite | Boolean | |
| isArchived | Boolean | |
| isPublic / publishedAt | Boolean / Date | shown on the receiver's public profile |
| reply.content / reply.repliedAt | String (max 300) / Date | public reply |
| isDeleted / deletedAt | Boolean / Date | soft delete |

---

### IdentityRequest

| Field | Type | Rules |
|---|---|---|
| message | ObjectId → Message | unique (one request per message) |
| requester | ObjectId → User | the receiver who wants to know |
| sender | ObjectId → User | the person who sent the message |
| status | String | `pending` / `accepted` / `rejected` |
| note | String | max 150 |
| respondedAt | Date | |
| conversation | ObjectId → Conversation | set when accepted |

---

### Conversation

| Field | Type | Rules |
|---|---|---|
| participants | [ObjectId → User] | exactly 2 (sender and receiver) |
| message | ObjectId → Message | unique, the original anonymous message |
| identityRequest | ObjectId → IdentityRequest | |
| lastMessage | { content, sender, createdAt } | for the conversations list |
| lastActivityAt | Date | sort order |

### ChatMessage (`chat.model.js`)

| Field | Type | Rules |
|---|---|---|
| conversation | ObjectId → Conversation | required |
| sender | ObjectId → User | required |
| content | String | 1–1000 chars |
| readAt | Date | |
| isEdited | Boolean | |
| isDeleted / deletedAt | Boolean / Date | soft delete, content hidden |

---

### Block

| Field | Type | Rules |
|---|---|---|
| blocker | ObjectId → User | |
| blocked | ObjectId → User | |
| fromMessage | ObjectId → Message | when blocked from an anonymous message |
| isAnonymous | Boolean | true when the blocker doesn't know who they blocked; their identity stays hidden in the blocked list |

Index: `{ blocker, blocked }` unique.

### Report

| Field | Type | Rules |
|---|---|---|
| message | ObjectId → Message | |
| reporter | ObjectId → User | |
| reason | String | `spam` / `harassment` / `hate` / `threat` / `other` |
| details | String | max 500 |
| status | String | `open` / `reviewed` / `dismissed` |

Index: `{ message, reporter }` unique.

---

## Redis (Upstash)

| Key | Value | TTL | Use |
|---|---|---|---|
| `auth:login-failures:<userId>` | counter | 24 h | consecutive wrong passwords |
| `auth:login-lock:<userId>` | 1 | 5 min | account banned after 5 wrong passwords |
| `rate:<name>:<user or ip>` | counter | window | rate limiting |
| `idem:<owner>:<method>:<path>:<key>` | response | 1 h | idempotency |
| `cache-version:<namespace>` | number | — | cache invalidation (bumping the version makes old entries unreachable) |
| `cache:<namespace>:v<version>:<url>` | response | 5–10 min | cached public profile and public messages |
