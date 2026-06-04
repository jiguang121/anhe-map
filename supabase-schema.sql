-- 天才俱乐部 Genius Club V3 Supabase 数据库结构
-- 使用方式：Supabase 控制台 -> SQL Editor -> New query -> 粘贴全部内容 -> Run

create extension if not exists pgcrypto;

create table if not exists public.gc_settings (
  id text primary key default 'site',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gc_categories (
  id text primary key,
  name text not null,
  tagline text default '',
  orb_class text default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.gc_posts (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.gc_categories(id) on update cascade on delete restrict,
  title text not null,
  content text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gc_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.gc_posts(id) on delete cascade,
  content text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gc_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.gc_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.gc_admins
    where user_id = auth.uid()
  );
$$;

alter table public.gc_settings enable row level security;
alter table public.gc_categories enable row level security;
alter table public.gc_posts enable row level security;
alter table public.gc_comments enable row level security;
alter table public.gc_admins enable row level security;

drop policy if exists "public read settings" on public.gc_settings;
create policy "public read settings" on public.gc_settings
for select using (true);

drop policy if exists "admin write settings" on public.gc_settings;
create policy "admin write settings" on public.gc_settings
for all using (public.gc_is_admin()) with check (public.gc_is_admin());

drop policy if exists "public read categories" on public.gc_categories;
create policy "public read categories" on public.gc_categories
for select using (true);

drop policy if exists "admin write categories" on public.gc_categories;
create policy "admin write categories" on public.gc_categories
for all using (public.gc_is_admin()) with check (public.gc_is_admin());

drop policy if exists "public read published posts" on public.gc_posts;
create policy "public read published posts" on public.gc_posts
for select using (is_published = true);

drop policy if exists "public insert posts" on public.gc_posts;
create policy "public insert posts" on public.gc_posts
for insert with check (is_published = true);

drop policy if exists "admin write posts" on public.gc_posts;
create policy "admin write posts" on public.gc_posts
for all using (public.gc_is_admin()) with check (public.gc_is_admin());

drop policy if exists "public read published comments" on public.gc_comments;
create policy "public read published comments" on public.gc_comments
for select using (is_published = true);

drop policy if exists "public insert comments" on public.gc_comments;
create policy "public insert comments" on public.gc_comments
for insert with check (is_published = true);

drop policy if exists "admin write comments" on public.gc_comments;
create policy "admin write comments" on public.gc_comments
for all using (public.gc_is_admin()) with check (public.gc_is_admin());

drop policy if exists "admins read admins" on public.gc_admins;
create policy "admins read admins" on public.gc_admins
for select using (public.gc_is_admin());

insert into public.gc_settings (id, data)
values (
  'site',
  '{
    "eyebrow":"GENIUS CLUB · 匿名内场",
    "title":"天才俱乐部",
    "subtitle":"把不适合公开说的话，放进一个会漂浮的秘密房间。",
    "feedEyebrow":"GENIUS CLUB",
    "shareButtonText":"匿名分享",
    "visitorLabel":"游客模式",
    "memberLabel":"会员模式",
    "viewLimit":5,
    "payTitle":"你已经看完 5 条免费内容",
    "payText":"继续查看完整秘密，需要登录会员。当前版本是演示入口，后续可以接微信登录、手机号登录或真实支付。",
    "payButtonText":"模拟开通会员",
    "loginTitle":"演示登录",
    "loginText":"输入任意昵称即可成为会员。"
  }'::jsonb
)
on conflict (id) do nothing;

insert into public.gc_categories (id, name, tagline, orb_class, sort_order) values
  ('privacy', '隐私', '不能说的边界', 'orb-privacy', 1),
  ('mind', '心事', '没人接住的念头', 'orb-mind', 2),
  ('leak', '爆料', '风声从这里开始', 'orb-leak', 3)
on conflict (id) do nothing;

insert into public.gc_posts (id, category_id, title, content, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'privacy', '我把最真实的一面藏得很好', '白天我像一个很正常的人，回消息、做事、开玩笑。可是只有我自己知道，我真正害怕的是被别人看见那个不够体面的自己。', now() - interval '38 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'privacy', '有些关系，我已经在心里退场了', '我没有拉黑，也没有吵架，只是突然发现，我已经不期待那个人理解我了。关系还在，但我已经不在里面了。', now() - interval '88 minutes'),
  ('33333333-3333-3333-3333-333333333333', 'mind', '我总觉得自己不该只过这种人生', '不是现在的生活完全不好，而是我心里一直有个声音：我不应该只是这样上班、吃饭、睡觉、等时间过去。我想要一点更大的东西。', now() - interval '120 minutes'),
  ('44444444-4444-4444-4444-444444444444', 'mind', '成年人最难的是没有人接住你', '小时候难过可以哭，长大后难过还要回消息。很多时候不是事情多严重，而是身边没有一个可以完全说真话的人。', now() - interval '200 minutes'),
  ('55555555-5555-5555-5555-555555555555', 'leak', '有人表面光鲜，其实早就欠了一圈钱', '朋友圈里越是展示精致生活的人，不一定真的过得好。有些人的体面全靠借来的现金流撑着，只是没人把账本摊开看。', now() - interval '260 minutes'),
  ('66666666-6666-6666-6666-666666666666', 'leak', '公司最会画饼的人，往往最懂人性', '很多承诺不是为了兑现，而是为了让你暂时继续卖力。等你发现的时候，饼已经换了一张新的。', now() - interval '330 minutes')
on conflict (id) do nothing;

insert into public.gc_comments (post_id, content) values
  ('11111111-1111-1111-1111-111111111111', '有时候越正常的人，越需要一个出口。'),
  ('11111111-1111-1111-1111-111111111111', '这里至少可以不用装。'),
  ('22222222-2222-2222-2222-222222222222', '懂，这种退场是安静的。'),
  ('33333333-3333-3333-3333-333333333333', '这种不甘心，可能就是入口。'),
  ('33333333-3333-3333-3333-333333333333', '我也经常有这个感觉。'),
  ('44444444-4444-4444-4444-444444444444', '太准了。'),
  ('44444444-4444-4444-4444-444444444444', '匿名反而更像真实。'),
  ('55555555-5555-5555-5555-555555555555', '很多人是在演稳定。'),
  ('55555555-5555-5555-5555-555555555555', '账本比朋友圈诚实。'),
  ('66666666-6666-6666-6666-666666666666', '这句可以贴工位上。');
