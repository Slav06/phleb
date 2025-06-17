-- Disable RLS for public access
alter table public.profiles disable row level security;
alter table public.phlebotomist_profiles disable row level security;
alter table public.working_hours disable row level security;
alter table public.appointments disable row level security;
alter table public.chat_threads disable row level security;
alter table public.chat_messages disable row level security;
alter table public.reviews disable row level security;
alter table public.admin_users disable row level security;

-- Create public access policies
create policy "Public access to profiles"
  on public.profiles for all
  using (true);

create policy "Public access to phlebotomist profiles"
  on public.phlebotomist_profiles for all
  using (true);

create policy "Public access to working hours"
  on public.working_hours for all
  using (true);

create policy "Public access to appointments"
  on public.appointments for all
  using (true);

create policy "Public access to chat threads"
  on public.chat_threads for all
  using (true);

create policy "Public access to chat messages"
  on public.chat_messages for all
  using (true);

create policy "Public access to reviews"
  on public.reviews for all
  using (true);

create policy "Public access to admin users"
  on public.admin_users for all
  using (true); 