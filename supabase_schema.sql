-- Create the entries table
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight_kg float8 not null,
  body_fat_pct float8,
  notes text,
  source text default 'manual',
  google_fit_synced boolean default false,
  created_at bigint not null
);

-- Enable Row Level Security
alter table entries enable row level security;

-- Create policy for users to see only their own data
create policy "Users can view their own entries"
  on entries
  for select
  using (auth.uid() = user_id);

-- Create policy for users to insert their own entries
create policy "Users can insert their own entries"
  on entries
  for insert
  with check (auth.uid() = user_id);

-- Create policy for users to update their own entries
create policy "Users can update their own entries"
  on entries
  for update
  using (auth.uid() = user_id);

-- Create profile settings table
create table if not exists settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  height_cm float8 not null default 175,
  goal_weight_kg float8 not null default 70,
  age int,
  gender text,
  fitness_goal text,
  activity_level text,
  onboarding_complete boolean default false,
  google_fit_connected boolean default false,
  google_fit_token text,
  google_fit_last_synced_at timestamptz,
  google_fit_write_enabled boolean default false,
  google_fit_write_token text,
  reminders_enabled boolean default false,
  reminder_frequency_days int default 3
);

-- Enable RLS for settings
alter table settings enable row level security;

-- Policies for settings
create policy "Users can view their own settings"
  on settings for select using (auth.uid() = user_id);

create policy "Users can manage their own settings"
  on settings for all using (auth.uid() = user_id);
