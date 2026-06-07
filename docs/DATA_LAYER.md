# Data Layer

Briqoly uses **Neon Postgres** as the database, **Prisma 7** for schema and queries, **NextAuth v5** for authentication, and **Next.js Server Actions** for all data access from the UI.

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Client components (app/, components/)                          │
│  import from @/lib/actions/* and call Server Actions            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Server Actions (lib/actions/*.ts)                              │
│  'use server' · requireSession() / requireProfile()             │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐  ┌──────────────┐  ┌─────────────────────┐
│  lib/prisma.ts  │  │  lib/auth.ts │  │  app/auth/actions.ts │
│  PrismaClient   │  │  NextAuth v5 │  │  login, signup, etc. │
│  + @prisma/     │  │  Credentials │  │                      │
│    adapter-pg   │  │  + JWT       │  │                      │
└────────┬────────┘  └──────┬───────┘  └──────────────────────┘
         │                  │
         └────────┬─────────┘
                  ▼
         ┌────────────────────┐
         │  Neon PostgreSQL   │
         └────────────────────┘
```

**Request flow for a typical page:**

1. A client component calls a Server Action (e.g. `getCustomerBookings()`).
2. The action calls `requireSession()` to read the JWT session via `auth()` from `lib/auth.ts`.
3. Prisma queries run through `lib/prisma.ts`, scoped to `session.user.id`.
4. Results are mapped to UI-friendly shapes (often snake_case for legacy component compatibility) and returned to the client.

Auth routes (`/api/auth/*`) are handled by NextAuth handlers in `app/api/auth/[...nextauth]/route.ts`. Route protection and role redirects live in `middleware.ts`.

## Folder conventions

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema, enums, and table mappings (`@@map` for snake_case columns) |
| `prisma/migrations/` | Applied migration history |
| `prisma/seed.ts` | Seeds reference data (service categories) |
| `prisma.config.ts` | Prisma 7 config; migration CLI uses `DIRECT_URL` |
| `lib/prisma.ts` | Singleton `PrismaClient` with `@prisma/adapter-pg` (runtime uses `DATABASE_URL`) |
| `lib/generated/prisma/` | Generated Prisma client (do not edit) |
| `lib/auth.ts` | NextAuth instance: Credentials provider, Prisma adapter, JWT session |
| `lib/auth.config.ts` | Shared auth config (callbacks, sign-in page) used by middleware |
| `lib/actions/_auth.ts` | `requireSession()` and `requireProfile()` helpers for actions |
| `lib/actions/*.ts` | Domain Server Actions (`bookings`, `profile`, `notifications`, etc.) |
| `app/auth/actions.ts` | Auth-specific actions: login, signup, logout, provider onboarding |
| `types/next-auth.d.ts` | Session/JWT type extensions (`userType`, `onboardingCompleted`) |

Every action file that performs data mutations or reads user-scoped data must start with `'use server'`. Shared auth helpers in `_auth.ts` are imported by other action modules and are not called directly from client components.

## How to add a new feature

1. **Schema** — Add or change models in `prisma/schema.prisma`. Use `@map` / `@@map` when column or table names should stay snake_case in Postgres.

2. **Migrate** — Apply the change locally:
   ```bash
   npm run db:migrate
   ```
   This runs `prisma migrate dev` and regenerates the client.

3. **Action** — Add functions to an existing `lib/actions/<domain>.ts` file or create a new one:
   - Add `'use server'` at the top.
   - Import `prisma` from `@/lib/prisma`.
   - Call `requireSession()` or `requireProfile()`; derive `userId` from the session, never from client input alone.
   - Return plain objects (serializable); map Prisma field names to what the UI expects.

4. **UI** — Import the action in a client component and call it from `useEffect`, event handlers, or form actions.

5. **Seed (optional)** — If the feature needs reference data, extend `prisma/seed.ts` and run `npm run db:seed`.

## Auth patterns

### Session on the server

```ts
import { requireSession } from '@/lib/actions/_auth'

const session = await requireSession()
const userId = session.user.id // always use this for ownership checks
```

### Profile + provider record

```ts
import { requireProfile } from '@/lib/actions/_auth'

const { session, profile } = await requireProfile()
// profile.providerProfile is included when present
```

### Client-side role checks

Use `useSession()` from `next-auth/react` for UI-only concerns (e.g. `RoleBasedRoute`). The session exposes:

- `session.user.id`
- `session.user.userType` — `'customer'` or `'provider'` (mapped from Prisma `UserType` enum)
- `session.user.onboardingCompleted` — provider onboarding flag

### Rules

- **Never trust client-supplied user IDs** for authorization. Always scope queries with `session.user.id`.
- **Verify ownership** before updates/deletes (e.g. `where: { id, providerId: session.user.id }`).
- **Auth mutations** (login, signup, logout) live in `app/auth/actions.ts`, not in `lib/actions/`.
- **Password changes and email reset** are not implemented yet; UI shows stubs until Resend (or similar) is wired up.

## Booking domain

Bookings are stored in a single `bookings` table. Each row links a customer `Profile`, provider `Profile`, and `ServiceCategory`.

### Status mapping

Prisma stores uppercase enum values; the UI uses lowercase strings. Conversion happens in `lib/actions/bookings.ts`:

| Prisma (`BookingStatus`) | UI / action return value |
|--------------------------|--------------------------|
| `PENDING` | `pending` |
| `CONFIRMED` | `confirmed` |
| `IN_PROGRESS` | `in_progress` |
| `COMPLETED` | `completed` |
| `CANCELLED` | `cancelled` |

`createBooking` parses dates as `new Date(scheduledDate + 'T00:00:00')` to avoid timezone drift on `@db.Date` columns.

### Booking actions reference

| Action | Auth | Description |
|--------|------|-------------|
| `createBooking(input)` | Customer | Creates a `PENDING` booking for the signed-in customer |
| `getCustomerBookings()` | Customer | List view for `/my_bookings` |
| `getBookingById(id)` | Customer | Detail page; scoped to `customerId` |
| `getProviderBookings()` | Provider | Jobs, schedule, and provider dashboard |
| `updateBookingStatus(id, status)` | Provider | Accept, complete, cancel; verifies `providerId` |
| `getCustomerDashboardBookings()` | Customer | Active + recent completed splits for client dashboard |

## Action modules reference

### `lib/actions/profile.ts`

| Function | Description |
|----------|-------------|
| `getCurrentUserProfile()` | Current user profile for settings and dashboard shell |
| `updateProfile(data)` | Update name, phone, bio, location |

### `lib/actions/notifications.ts`

| Function | Description |
|----------|-------------|
| `getRecentNotifications(limit?)` | Header dropdown (default 5) |
| `getNotifications()` | Full notifications page |
| `markNotificationRead(id)` | Mark one notification read |
| `markAllNotificationsRead()` | Mark all read for current user |
| `deleteNotification(id)` | Delete one notification |

All notification queries are scoped to `session.user.id`.

### `lib/actions/providers.ts`

| Function | Description |
|----------|-------------|
| `getOnboardedProviders()` | Public listing for `/find_services` |
| `getProviderSettings()` | Provider settings form |
| `updateProviderSettings(data)` | Update profile + `service_providers` fields |

### `lib/actions/services.ts`

| Function | Description |
|----------|-------------|
| `getServiceCategories()` | Category list (onboarding, client dashboard) |
| `getProviderServices()` | Provider's service catalog |
| `createProviderService(data)` | Add a service |
| `updateProviderService(id, data)` | Edit a service |
| `deleteProviderService(id)` | Remove a service |
| `toggleProviderServiceActive(id, active)` | Enable/disable a service |

### `lib/actions/reviews.ts`

| Function | Description |
|----------|-------------|
| `createReview({ bookingId, revieweeId, rating, comment? })` | Customer review after booking |
| `getReviews()` | Public reviews feed |
| `getProviderReviews()` | Reviews received by signed-in provider |
| `voteReviewHelpful(id)` | Increment helpful vote count |

## Environment variables

| Variable | Required | Used by |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Runtime Prisma client (`lib/prisma.ts`) — use the pooled Neon connection string |
| `DIRECT_URL` | Yes | Prisma CLI migrations and seed (`prisma.config.ts`, `prisma/seed.ts`) — direct (non-pooled) connection |
| `AUTH_SECRET` | Yes | NextAuth JWT signing (`openssl rand -base64 32`) |
| `AUTH_URL` | Production | Canonical app URL for NextAuth callbacks (e.g. `https://your-app.vercel.app`) |

Create a `.env` file in the project root with these values before running migrations or `npm run dev`.

## What was migrated

Supabase client usage has been removed from application code. Data access now flows through Prisma Server Actions.

### Infrastructure

- [x] PostgreSQL schema defined in Prisma (`prisma/schema.prisma`)
- [x] Initial migration applied (`prisma/migrations/`)
- [x] Prisma 7 client generated to `lib/generated/prisma/`
- [x] NextAuth v5 with Credentials provider and JWT sessions
- [x] Supabase packages and `utils/supabase/*` removed

### Tables (formerly Supabase / app tables)

- [x] `users`, `accounts`, `sessions`, `verification_tokens` — NextAuth
- [x] `profiles` — user profiles (`UserType` enum)
- [x] `service_providers` — provider onboarding and business fields
- [x] `service_categories` — seeded reference categories
- [x] `provider_services` — provider service catalog
- [x] `bookings` — customer ↔ provider bookings
- [x] `reviews` — post-booking reviews
- [x] `notifications` — in-app notifications

### Pages and components wired to actions

- [x] `components/dashboard-layout.tsx` — profile + notifications
- [x] `components/booking-modal.tsx` — `createBooking`
- [x] `components/review-modal.tsx` — `createReview`
- [x] `app/find_services/page.tsx` — `getOnboardedProviders`
- [x] `app/my_bookings/page.tsx` and `[id]/page.tsx` — customer bookings
- [x] `app/dashboard/client/page.tsx` — dashboard bookings + categories
- [x] `app/dashboard/service_provider/*` — jobs, schedule, services, settings, reviews, notifications
- [x] `app/notifications/page.tsx` — notification actions
- [x] `app/reviews_and_ratings/page.tsx` — public reviews
- [x] `app/settings/page.tsx` — profile update
- [x] `app/onboarding/page.tsx` — redirects to `/onboarding/provider`
- [x] `app/onboarding/provider/page.tsx` — categories via `getServiceCategories`
- [x] `app/components/role-based-route.tsx` — `useSession()` for role checks
- [x] `app/forgot-password/page.tsx` and `app/auth/reset-password/page.tsx` — stubs (no Supabase)

## Deferred work

These items are intentionally out of scope for the current data layer but should be implemented before production:

| Item | Notes |
|------|-------|
| Password reset email | `forgotPassword()` in `app/auth/actions.ts` is a stub; implement with Resend (or similar) and the `VerificationToken` table |
| File uploads | Avatar and provider images are URL strings only; add R2/S3 (or similar) storage |
| Notification creation on events | Booking status changes do not yet insert rows into `notifications` |
| OAuth providers | Only Credentials auth is configured; `Account` model is ready for future OAuth |
| Admin role | `UserType` has no `ADMIN` variant yet; `/admin` route guard is a placeholder |

## Local development quick reference

```bash
# Install dependencies (runs prisma generate via postinstall)
npm install

# Apply migrations and seed categories
npm run db:migrate
npm run db:seed

# Start dev server
npm run dev

# Open Prisma Studio
npm run db:studio
```

For full setup steps, see the [Development](../README.md#development) section in the README.
