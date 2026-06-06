-- Supabase SQL schema for Briqoly service platform
-- Run this in the Supabase SQL editor or via psql against your project database.

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('client', 'provider');
create type service_status as enum ('active', 'inactive');
create type job_status as enum ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Profiles table (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  role user_role not null default 'client',
  avatar_url text,
  bio text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services table (for service providers)
create table if not exists services (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  description text,
  price decimal(10,2),
  duration_minutes integer,
  status service_status default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jobs table (service requests)
create table if not exists jobs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references profiles(id) on delete cascade not null,
  provider_id uuid references profiles(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  title text not null,
  description text,
  status job_status default 'pending',
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  price decimal(10,2),
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Job applications table (providers applying to jobs)
create table if not exists job_applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  provider_id uuid references profiles(id) on delete cascade not null,
  message text,
  proposed_price decimal(10,2),
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(job_id, provider_id)
);

-- Reviews table
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  reviewee_id uuid references profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists profiles_role_idx on profiles(role);
create index if not exists services_provider_id_idx on services(provider_id);
create index if not exists services_category_idx on services(category);
create index if not exists jobs_client_id_idx on jobs(client_id);
create index if not exists jobs_provider_id_idx on jobs(provider_id);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists job_applications_job_id_idx on job_applications(job_id);
create index if not exists job_applications_provider_id_idx on job_applications(provider_id);
create index if not exists reviews_job_id_idx on reviews(job_id);
create index if not exists reviews_reviewee_id_idx on reviews(reviewee_id);

-- Row Level Security (RLS) policies
alter table profiles enable row level security;
alter table services enable row level security;
alter table jobs enable row level security;
alter table job_applications enable row level security;
alter table reviews enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Services policies
create policy "Anyone can view active services" on services for select using (status = 'active');
create policy "Providers can manage own services" on services for all using (auth.uid() = provider_id);

-- Jobs policies
create policy "Clients can manage own jobs" on jobs for all using (auth.uid() = client_id);
create policy "Providers can view jobs they're assigned to" on jobs for select using (auth.uid() = provider_id);
create policy "Providers can update jobs they're assigned to" on jobs for update using (auth.uid() = provider_id);

-- Job applications policies
create policy "Providers can view applications for their jobs" on job_applications for select using (
  exists (select 1 from jobs where jobs.id = job_applications.job_id and jobs.client_id = auth.uid())
);
create policy "Providers can create applications" on job_applications for insert with check (auth.uid() = provider_id);
create policy "Providers can update own applications" on job_applications for update using (auth.uid() = provider_id);

-- Reviews policies
create policy "Anyone can view reviews" on reviews for select using (true);
create policy "Users can create reviews for completed jobs they participated in" on reviews for insert with check (
  exists (
    select 1 from jobs
    where jobs.id = reviews.job_id
    and jobs.status = 'completed'
    and (jobs.client_id = auth.uid() or jobs.provider_id = auth.uid())
  )
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    (new.raw_user_meta_data->>'role')::user_role
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger handle_updated_at before update on profiles
  for each row execute procedure handle_updated_at();

create trigger handle_updated_at before update on services
  for each row execute procedure handle_updated_at();

create trigger handle_updated_at before update on jobs
  for each row execute procedure handle_updated_at();

create trigger handle_updated_at before update on job_applications
  for each row execute procedure handle_updated_at();