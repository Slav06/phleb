-- Enable UUID extension
create extension if not exists "uuid-ossp";

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

-- Create phlebotomist profiles table
create table if not exists public.phlebotomist_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  rating decimal(3,2) default 5.0,
  hourly_rate decimal(10,2) default 0.00,
  service_radius_miles integer default 15,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create working hours table
create table if not exists public.working_hours (
  id uuid default uuid_generate_v4() primary key,
  phlebotomist_id uuid references public.phlebotomist_profiles(id) on delete cascade not null,
  day_of_week integer check (day_of_week between 0 and 6) not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create appointments table
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  phlebotomist_id uuid references public.phlebotomist_profiles(id) on delete cascade not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')) not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat threads table
create table if not exists public.chat_threads (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat messages table
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid references public.chat_threads(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  attachment_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reviews table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  rating integer check (rating between 1 and 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create submissions table
create table if not exists public.submissions (
  id uuid default uuid_generate_v4() primary key,
  patient_name text not null,
  patient_address text not null,
  patient_email text,
  patient_dob date,
  doctor_name text,
  doctor_address text,
  doctor_phone text,
  doctor_fax text,
  doctor_email text,
  lab_brand text,
  blood_collection_time time,
  insurance_company text,
  insurance_policy_number text,
  need_fedex_label boolean default false,
  fedex_ship_from text,
  stat_test boolean default false,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
); 