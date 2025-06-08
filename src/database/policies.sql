-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.phlebotomist_profiles enable row level security;
alter table public.working_hours enable row level security;
alter table public.appointments enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reviews enable row level security;
alter table public.submissions enable row level security;

-- Create policies for public access
create policy "Allow public read access on profiles"
on public.profiles for select
to public
using (true);

create policy "Allow public read access on phlebotomist_profiles"
on public.phlebotomist_profiles for select
to public
using (true);

create policy "Allow public read access on working_hours"
on public.working_hours for select
to public
using (true);

create policy "Allow public read access on appointments"
on public.appointments for select
to public
using (true);

create policy "Allow public read access on chat_threads"
on public.chat_threads for select
to public
using (true);

create policy "Allow public read access on chat_messages"
on public.chat_messages for select
to public
using (true);

create policy "Allow public read access on reviews"
on public.reviews for select
to public
using (true);

create policy "Allow public read access on submissions"
on public.submissions for select
to public
using (true);

-- Create policies for public write access
create policy "Allow public insert on profiles"
on public.profiles for insert
to public
with check (true);

create policy "Allow public insert on phlebotomist_profiles"
on public.phlebotomist_profiles for insert
to public
with check (true);

create policy "Allow public insert on working_hours"
on public.working_hours for insert
to public
with check (true);

create policy "Allow public insert on appointments"
on public.appointments for insert
to public
with check (true);

create policy "Allow public insert on chat_threads"
on public.chat_threads for insert
to public
with check (true);

create policy "Allow public insert on chat_messages"
on public.chat_messages for insert
to public
with check (true);

create policy "Allow public insert on reviews"
on public.reviews for insert
to public
with check (true);

create policy "Allow public insert on submissions"
on public.submissions for insert
to public
with check (true);

-- Create policies for public update access
create policy "Allow public update on profiles"
on public.profiles for update
to public
using (true)
with check (true);

create policy "Allow public update on phlebotomist_profiles"
on public.phlebotomist_profiles for update
to public
using (true)
with check (true);

create policy "Allow public update on working_hours"
on public.working_hours for update
to public
using (true)
with check (true);

create policy "Allow public update on appointments"
on public.appointments for update
to public
using (true)
with check (true);

create policy "Allow public update on chat_threads"
on public.chat_threads for update
to public
using (true)
with check (true);

create policy "Allow public update on chat_messages"
on public.chat_messages for update
to public
using (true)
with check (true);

create policy "Allow public update on reviews"
on public.reviews for update
to public
using (true)
with check (true);

create policy "Allow public update on submissions"
on public.submissions for update
to public
using (true)
with check (true);

-- Create policies for public delete access
create policy "Allow public delete on profiles"
on public.profiles for delete
to public
using (true);

create policy "Allow public delete on phlebotomist_profiles"
on public.phlebotomist_profiles for delete
to public
using (true);

create policy "Allow public delete on working_hours"
on public.working_hours for delete
to public
using (true);

create policy "Allow public delete on appointments"
on public.appointments for delete
to public
using (true);

create policy "Allow public delete on chat_threads"
on public.chat_threads for delete
to public
using (true);

create policy "Allow public delete on chat_messages"
on public.chat_messages for delete
to public
using (true);

create policy "Allow public delete on reviews"
on public.reviews for delete
to public
using (true);

create policy "Allow public delete on submissions"
on public.submissions for delete
to public
using (true); 