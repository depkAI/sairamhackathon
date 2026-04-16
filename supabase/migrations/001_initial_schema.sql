-- ============================================
-- Campus-Ops Supabase Schema
-- ============================================

-- 1. Users / Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login_id text unique not null,
  name text not null,
  email text not null,
  role text not null check (role in ('student','hod','admin','worker')),
  department text not null,
  phone text not null default '',
  specialty text check (specialty in ('electrician','plumber','technician','general')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by authenticated users"
  on profiles for select to authenticated using (true);
create policy "Users can update own profile"
  on profiles for update to authenticated using (auth.uid() = id);
create policy "Allow insert for authenticated users"
  on profiles for insert to authenticated with check (true);

-- 2. Complaints
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('electrical','plumbing','furniture','network','cleaning','civil','other')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  location text not null,
  department text not null,
  attachments text[] not null default '{}',
  audio_url text,
  status text not null default 'pending' check (status in ('pending','reviewed','assigned','in_progress','quotation_submitted','quotation_approved','completed','verified','rejected','escalated')),
  created_by uuid references profiles(id),
  created_by_name text not null,
  assigned_to uuid references profiles(id),
  assigned_to_name text,
  rejection_reason text,
  is_spam boolean default false,
  escalated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table complaints enable row level security;
create policy "Complaints viewable by authenticated users"
  on complaints for select to authenticated using (true);
create policy "Students can create complaints"
  on complaints for insert to authenticated with check (true);
create policy "Authenticated users can update complaints"
  on complaints for update to authenticated using (true);

-- 3. Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete cascade,
  complaint_title text not null,
  worker_id uuid references profiles(id),
  worker_name text not null,
  accepted boolean,
  quotation_amount numeric,
  quotation_note text,
  quotation_approved boolean,
  deadline timestamptz not null,
  status text not null default 'assigned' check (status in ('assigned','accepted','in_progress','quotation_submitted','completed','rejected','escalated')),
  completion_proof text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "Tasks viewable by authenticated users"
  on tasks for select to authenticated using (true);
create policy "Authenticated users can insert tasks"
  on tasks for insert to authenticated with check (true);
create policy "Authenticated users can update tasks"
  on tasks for update to authenticated using (true);

-- 4. Feedback
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete cascade,
  student_id uuid references profiles(id),
  student_name text not null,
  rating integer not null check (rating between 1 and 5),
  feedback_text text not null default '',
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;
create policy "Feedback viewable by authenticated users"
  on feedback for select to authenticated using (true);
create policy "Authenticated users can insert feedback"
  on feedback for insert to authenticated with check (true);

-- 5. Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "Users can view own notifications"
  on notifications for select to authenticated using (auth.uid() = user_id);
create policy "Authenticated users can insert notifications"
  on notifications for insert to authenticated with check (true);
create policy "Users can update own notifications"
  on notifications for update to authenticated using (auth.uid() = user_id);

-- 6. Announcements
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  title text not null,
  message text not null,
  created_by uuid references profiles(id),
  created_by_name text not null,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;
create policy "Announcements viewable by authenticated users"
  on announcements for select to authenticated using (true);
create policy "Authenticated users can insert announcements"
  on announcements for insert to authenticated with check (true);

-- 7. Storage bucket for voice recordings & attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');

create policy "Users can view own attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = 'voice' and (storage.foldername(name))[2] = auth.uid()::text);

-- 8. Realtime - enable for all tables
alter publication supabase_realtime add table complaints;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table feedback;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table announcements;
