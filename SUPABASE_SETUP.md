# My Local Pro - Supabase Authentication Setup

This guide will help you set up Supabase authentication for the My Local Pro service platform.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Node.js and npm/pnpm installed

## 1. Supabase Project Setup

1. Create a new project in Supabase
2. Go to Settings > API in your Supabase dashboard
3. Copy your project URL and anon key
4. Update your `.env.local` file with these values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Database Schema

Run the SQL in `supabase-schema.sql` in your Supabase SQL editor:

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click "Run" to execute the schema

This will create:
- User profiles table
- Services table for providers
- Jobs table for service requests
- Reviews and applications tables
- Row Level Security policies
- Triggers for automatic profile creation

## 3. Supabase Auth Configuration

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure your site URL: `http://localhost:3000` (for development)
3. Enable email confirmations if desired
4. Add redirect URLs for your app

## 4. Email Templates (Optional)

Customize the email templates in Authentication > Email Templates for:
- Confirm signup
- Password reset
- Email change

## 5. Testing Authentication

1. Start your development server: `pnpm dev`
2. Visit `/signup` to create a new account
3. Check your email for confirmation (if enabled)
4. Visit `/login` to sign in
5. Protected routes like `/dashboard/*` should now work

## Key Features Implemented

- **User Registration**: Sign up with email/password, role selection (client/provider)
- **User Login**: Email/password authentication
- **Protected Routes**: Dashboard pages require authentication
- **Session Management**: Automatic session refresh and persistence
- **User Profiles**: Extended user data stored in profiles table
- **Role-based Access**: Client vs Service Provider roles

## Database Tables Created

- `profiles`: Extended user information
- `services`: Services offered by providers
- `jobs`: Service requests from clients
- `job_applications`: Provider applications to jobs
- `reviews`: User reviews and ratings

## Security

- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Server-side session validation with middleware
- Secure password hashing handled by Supabase

## Next Steps

1. Implement service discovery and booking features
2. Add payment integration
3. Set up real-time notifications
4. Add file uploads for service images
5. Implement provider verification process

## Troubleshooting

- **Auth not working**: Check your Supabase URL and keys in `.env.local`
- **Database errors**: Ensure the schema was properly executed
- **Session issues**: Clear browser cookies and try again
- **Email not received**: Check Supabase email settings and spam folder