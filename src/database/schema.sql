-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create admin_users table
create table if not exists public.admin_users (
  id uuid default uuid_generate_v4() primary key,
  name text,
  secret_code text unique not null,
  role text check (role in ('master', 'regular')) not null default 'regular',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text check (role in ('patient', 'phlebotomist', 'admin')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('patient', 'phlebotomist')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Phlebotomist profiles
create table if not exists public.phlebotomist_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  company_name text,
  email text,
  phone text,
  min_draw_fee numeric,
  max_draw_fee numeric,
  lab_draw_fee numeric,
  service_areas jsonb,
  agreement_signed boolean default false,
  agreement_signed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Working hours
create table public.working_hours (
  id uuid default uuid_generate_v4() primary key,
  phlebotomist_id uuid references public.phlebotomist_profiles on delete cascade not null,
  day_of_week integer check (day_of_week between 0 and 6) not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Appointments
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles on delete cascade not null,
  phlebotomist_id uuid references public.phlebotomist_profiles on delete cascade not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text check (status in ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'missed')) not null default 'pending',
  patient_address text not null,
  test_details jsonb not null,
  doctor_name text,
  insurance_info jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat threads
create table public.chat_threads (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat messages
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.chat_threads on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text,
  attachment_url text,
  read_status boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments on delete cascade not null,
  rating integer check (rating between 1 and 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.phlebotomist_profiles enable row level security;
alter table public.working_hours enable row level security;
alter table public.appointments enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reviews enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Anyone can view phlebotomist profiles"
  on public.phlebotomist_profiles for select
  to authenticated
  using (true);

create policy "Phlebotomists can update their own profile"
  on public.phlebotomist_profiles for update
  using (auth.uid() = id);

create policy "Phlebotomists can manage their working hours"
  on public.working_hours for all
  using (auth.uid() = phlebotomist_id);

create policy "Users can view their own appointments"
  on public.appointments for select
  using (auth.uid() = patient_id or auth.uid() = phlebotomist_id);

create policy "Users can create appointments"
  on public.appointments for insert
  to authenticated
  with check (auth.uid() = patient_id);

create policy "Phlebotomists can update appointment status"
  on public.appointments for update
  using (auth.uid() = phlebotomist_id);

create policy "Users can view their chat threads"
  on public.chat_threads for select
  using (
    exists (
      select 1 from public.appointments
      where appointments.id = chat_threads.appointment_id
      and (appointments.patient_id = auth.uid() or appointments.phlebotomist_id = auth.uid())
    )
  );

create policy "Users can view their chat messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_threads
      join public.appointments on appointments.id = chat_threads.appointment_id
      where chat_threads.id = chat_messages.thread_id
      and (appointments.patient_id = auth.uid() or appointments.phlebotomist_id = auth.uid())
    )
  );

create policy "Users can send messages in their threads"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_threads
      join public.appointments on appointments.id = chat_threads.appointment_id
      where chat_threads.id = chat_messages.thread_id
      and (appointments.patient_id = auth.uid() or appointments.phlebotomist_id = auth.uid())
    )
  );

create policy "Users can view their reviews"
  on public.reviews for select
  using (
    exists (
      select 1 from public.appointments
      where appointments.id = reviews.appointment_id
      and (appointments.patient_id = auth.uid() or appointments.phlebotomist_id = auth.uid())
    )
  );

create policy "Patients can create reviews"
  on public.reviews for insert
  with check (
    exists (
      select 1 from public.appointments
      where appointments.id = reviews.appointment_id
      and appointments.patient_id = auth.uid()
    )
  ); 