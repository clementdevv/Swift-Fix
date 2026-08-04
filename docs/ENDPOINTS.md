# Briqoly Endpoints Reference

Single map of every route and server entry point in the Next.js App Router app.
Update this file when adding pages, API routes, or server actions.

---

## Page routes (UI)

Routes are defined by `app/**/page.tsx`. URLs map directly from the folder path.

| Path | File | Access |
|------|------|--------|
| `/` | `app/page.tsx` | Public (redirects logged-in users via middleware) |
| `/login` | `app/login/page.tsx` | Public (redirects if logged in) |
| `/signup` | `app/signup/page.tsx` | Public (redirects if logged in) |
| `/forgot-password` | `app/forgot-password/page.tsx` | Public (redirects if logged in) |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Public (`?token=` required) |
| `/onboarding` | `app/onboarding/page.tsx` | Public |
| `/onboarding/provider` | `app/onboarding/provider/page.tsx` | Provider onboarding |
| `/dashboard/client` | `app/dashboard/client/page.tsx` | Customer only |
| `/find_services` | `app/find_services/page.tsx` | Customer only |
| `/my_bookings` | `app/my_bookings/page.tsx` | Customer only |
| `/my_bookings/[id]` | `app/my_bookings/[id]/page.tsx` | Customer only |
| `/reviews_and_ratings` | `app/reviews_and_ratings/page.tsx` | Customer only |
| `/notifications` | `app/notifications/page.tsx` | Customer only |
| `/settings` | `app/settings/page.tsx` | Customer only |
| `/dashboard/service_provider` | `app/dashboard/service_provider/page.tsx` | Provider only |
| `/dashboard/service_provider/jobs` | `app/dashboard/service_provider/jobs/page.tsx` | Provider only |
| `/dashboard/service_provider/schedule` | `app/dashboard/service_provider/schedule/page.tsx` | Provider only |
| `/dashboard/service_provider/services` | `app/dashboard/service_provider/services/page.tsx` | Provider only |
| `/dashboard/service_provider/reviews` | `app/dashboard/service_provider/reviews/page.tsx` | Provider only |
| `/dashboard/service_provider/notifications` | `app/dashboard/service_provider/notifications/page.tsx` | Provider only |
| `/dashboard/service_provider/settings` | `app/dashboard/service_provider/settings/page.tsx` | Provider only |
| `/admin` | `app/admin/page.tsx` | Protected (admin role TBD) |

### Middleware redirects (`middleware.ts`)

- Unauthenticated users hitting protected prefixes → `/login?redirectTo=…`
- Logged-in users on `/login`, `/signup`, `/forgot-password` → role dashboard
- `/` or `/dashboard` → `/dashboard/client` (customer) or `/dashboard/service_provider` (provider)
- Customer routes blocked for providers; provider routes blocked for customers

Protected prefixes: `/dashboard`, `/client`, `/provider`, `/admin`, `/find_services`, `/my_bookings`, `/reviews_and_ratings`, `/notifications`, `/settings`.

---

## HTTP API routes

| Method | Path | File | Description |
|--------|------|------|-------------|
| `GET`, `POST` | `/api/auth/*` | `app/api/auth/[...nextauth]/route.ts` | NextAuth handlers (session, sign-in, sign-out, CSRF) |
| `POST` | `/api/signup` | `app/api/signup/route.ts` | JSON signup wrapper around `signup` server action |

---

## Server actions

Server actions are invoked from client components (not REST URLs). Grouped by source file.

### `app/auth/actions.ts`

| Action | Purpose |
|--------|---------|
| `login(formData)` | Credentials sign-in; returns role and onboarding status |
| `signup(formData)` | Create customer or provider account |
| `logout()` | End session |
| `completeProviderOnboarding(payload)` | Finish provider setup after signup |
| `forgotPassword(formData)` | Send password-reset email |
| `resetPassword(formData)` | Set new password from reset token |

### `lib/actions/bookings.ts`

| Action | Purpose |
|--------|---------|
| `createBooking(input)` | Customer creates a booking request |
| `getCustomerBookings()` | List bookings for current customer |
| `getBookingById(id)` | Single booking detail |
| `getProviderBookings()` | List bookings for current provider |
| `updateBookingStatus(id, status)` | Provider updates booking status |
| `getCustomerDashboardBookings()` | Recent bookings for customer dashboard |

### `lib/actions/reviews.ts`

| Action | Purpose |
|--------|---------|
| `createReview(input)` | Customer submits a review |
| `getReviews()` | Reviews visible to customer |
| `getProviderReviews()` | Reviews for current provider |
| `voteReviewHelpful(id)` | Mark a review as helpful |

### `lib/actions/services.ts`

| Action | Purpose |
|--------|---------|
| `getServiceCategories()` | All service categories |
| `getProviderServices()` | Current provider's services |
| `createProviderService(data)` | Add a provider service |
| `updateProviderService(id, data)` | Edit a provider service |
| `deleteProviderService(id)` | Remove a provider service |
| `toggleProviderServiceActive(id, active)` | Enable/disable a service |

### `lib/actions/notifications.ts`

| Action | Purpose |
|--------|---------|
| `getRecentNotifications(limit?)` | Latest notifications (default 5) |
| `getNotifications()` | Full notification list |
| `markNotificationRead(id)` | Mark one as read |
| `markAllNotificationsRead()` | Mark all as read |
| `deleteNotification(id)` | Delete one notification |

### `lib/actions/profile.ts`

| Action | Purpose |
|--------|---------|
| `getCurrentUserProfile()` | Current user's profile |
| `updateProfile(data)` | Update profile fields |

### `lib/actions/providers.ts`

| Action | Purpose |
|--------|---------|
| `getOnboardedProviders()` | List providers available for booking |
| `getProviderSettings()` | Provider settings |
| `updateProviderSettings(data)` | Update provider settings |

### `lib/actions/_auth.ts` (internal helpers)

| Action | Purpose |
|--------|---------|
| `requireSession()` | Assert authenticated session |
| `requireProfile()` | Assert session with profile |

---

## Related services

| Service | Location | Status |
|---------|----------|--------|
| Chat (WebSocket) | `briqoly_chat_service/` | Stub — no HTTP endpoints yet |
