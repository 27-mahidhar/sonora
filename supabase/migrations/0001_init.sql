-- =====================================================================
-- SONORA — Supabase schema + Row Level Security
-- Run with: supabase db push   (or paste into the SQL editor)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null default '',
  display_name  text not null default 'Listener',
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Public profile information for a SONORA user.';

-- ---------------------------------------------------------------------
-- Catalogue (artists / albums / tracks)
-- Seeded from scripts/seed-supabase.mjs — the demo ships the same data
-- in-repo so the UI works without a database.
-- ---------------------------------------------------------------------
create table if not exists public.artists (
  id                text primary key,
  name              text not null,
  image             text not null,
  bio               text not null default '',
  language          text not null default 'English',
  genre             text not null default 'pop',
  genres            text[] not null default '{}',
  hometown          text not null default '',
  monthly_listeners bigint not null default 0,
  followers         bigint not null default 0,
  debut_year        int not null default 2020,
  verified          boolean not null default false,
  related_ids       text[] not null default '{}'
);

create table if not exists public.albums (
  id          text primary key,
  title       text not null,
  artist_id   text not null references public.artists (id) on delete cascade,
  cover_art   text not null,
  year        int not null,
  type        text not null default 'album' check (type in ('album', 'ep', 'single', 'mixtape')),
  genre       text not null default 'pop',
  language    text not null default 'English',
  description text not null default '',
  plays       bigint not null default 0
);

create table if not exists public.tracks (
  id          text primary key,
  title       text not null,
  artist_id   text not null references public.artists (id) on delete cascade,
  album_id    text not null references public.albums (id) on delete cascade,
  track_no    int not null default 1,
  duration    int not null,
  audio_url   text not null,
  cover_art   text not null,
  year        int not null,
  language    text not null default 'English',
  genre       text not null default 'pop',
  plays       bigint not null default 0,
  explicit    boolean not null default false,
  hi_res      boolean not null default false,
  lyrics      jsonb not null default '[]'::jsonb
);

create index if not exists tracks_album_idx on public.tracks (album_id);
create index if not exists tracks_artist_idx on public.tracks (artist_id);
create index if not exists tracks_plays_idx on public.tracks (plays desc);

-- ---------------------------------------------------------------------
-- Playlists (user-created) + membership
-- ---------------------------------------------------------------------
create table if not exists public.playlists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  description text not null default '',
  is_public   boolean not null default false,
  cover_art   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists playlists_owner_idx on public.playlists (owner_id);

create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id    text not null references public.tracks (id) on delete cascade,
  position    int not null default 0,
  added_at    timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

create index if not exists playlist_tracks_position_idx on public.playlist_tracks (playlist_id, position);

-- ---------------------------------------------------------------------
-- User library relations
-- ---------------------------------------------------------------------
create table if not exists public.liked_tracks (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  track_id   text not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.followed_artists (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  artist_id  text not null references public.artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

create table if not exists public.saved_albums (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  album_id   text not null references public.albums (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, album_id)
);

create table if not exists public.saved_playlists (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, playlist_id)
);

create table if not exists public.listening_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  track_id   text not null references public.tracks (id) on delete cascade,
  played_at  timestamptz not null default now(),
  progress   numeric not null default 0
);

create index if not exists history_user_idx on public.listening_history (user_id, played_at desc);

-- ---------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id             uuid primary key references public.profiles (id) on delete cascade,
  theme               text not null default 'dark' check (theme in ('dark', 'light')),
  audio_quality       text not null default 'auto' check (audio_quality in ('auto', 'high', 'lossless')),
  autoplay            boolean not null default true,
  notifications       boolean not null default true,
  updated_at          timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.artists           enable row level security;
alter table public.albums            enable row level security;
alter table public.tracks            enable row level security;
alter table public.playlists         enable row level security;
alter table public.playlist_tracks   enable row level security;
alter table public.liked_tracks      enable row level security;
alter table public.followed_artists  enable row level security;
alter table public.saved_albums      enable row level security;
alter table public.saved_playlists   enable row level security;
alter table public.listening_history enable row level security;
alter table public.user_settings     enable row level security;

-- Catalogue is public read-only --------------------------------------
create policy "catalogue is publicly readable" on public.artists
  for select using (true);

create policy "albums are publicly readable" on public.albums
  for select using (true);

create policy "tracks are publicly readable" on public.tracks
  for select using (true);

-- Profiles -----------------------------------------------------------
create policy "users can read their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Playlists ----------------------------------------------------------
create policy "owner can read their playlists" on public.playlists
  for select using (auth.uid() = owner_id or is_public = true);

create policy "owner can insert playlists" on public.playlists
  for insert with check (auth.uid() = owner_id);

create policy "owner can update playlists" on public.playlists
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner can delete playlists" on public.playlists
  for delete using (auth.uid() = owner_id);

-- Playlist membership is controlled through the parent playlist ------
create policy "owner can read playlist tracks" on public.playlist_tracks
  for select using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_tracks.playlist_id
        and (p.owner_id = auth.uid() or p.is_public = true)
    )
  );

create policy "owner can add playlist tracks" on public.playlist_tracks
  for insert with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_tracks.playlist_id and p.owner_id = auth.uid()
    )
  );

create policy "owner can change playlist tracks" on public.playlist_tracks
  for update using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_tracks.playlist_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_tracks.playlist_id and p.owner_id = auth.uid()
    )
  );

create policy "owner can remove playlist tracks" on public.playlist_tracks
  for delete using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_tracks.playlist_id and p.owner_id = auth.uid()
    )
  );

-- Liked tracks -------------------------------------------------------
create policy "users can read their liked tracks" on public.liked_tracks
  for select using (auth.uid() = user_id);

create policy "users can like tracks" on public.liked_tracks
  for insert with check (auth.uid() = user_id);

create policy "users can unlike tracks" on public.liked_tracks
  for delete using (auth.uid() = user_id);

-- Followed artists ---------------------------------------------------
create policy "users can read followed artists" on public.followed_artists
  for select using (auth.uid() = user_id);

create policy "users can follow artists" on public.followed_artists
  for insert with check (auth.uid() = user_id);

create policy "users can unfollow artists" on public.followed_artists
  for delete using (auth.uid() = user_id);

-- Saved albums -------------------------------------------------------
create policy "users can read saved albums" on public.saved_albums
  for select using (auth.uid() = user_id);

create policy "users can save albums" on public.saved_albums
  for insert with check (auth.uid() = user_id);

create policy "users can unsave albums" on public.saved_albums
  for delete using (auth.uid() = user_id);

-- Saved playlists ----------------------------------------------------
create policy "users can read saved playlists" on public.saved_playlists
  for select using (auth.uid() = user_id);

create policy "users can save playlists" on public.saved_playlists
  for insert with check (auth.uid() = user_id);

create policy "users can unsave playlists" on public.saved_playlists
  for delete using (auth.uid() = user_id);

-- Listening history --------------------------------------------------
create policy "users can read their own history" on public.listening_history
  for select using (auth.uid() = user_id);

create policy "users can insert their own history" on public.listening_history
  for insert with check (auth.uid() = user_id);

create policy "users can delete their own history" on public.listening_history
  for delete using (auth.uid() = user_id);

-- Settings -----------------------------------------------------------
create policy "users can read their settings" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "users can insert their settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "users can update their settings" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- Triggers
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'displayName', split_part(coalesce(new.email, ''), '@', 1), 'Listener'),
    new.raw_user_meta_data ->> 'avatarUrl'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists playlists_touch on public.playlists;
create trigger playlists_touch
  before update on public.playlists
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.user_settings;
create trigger settings_touch
  before update on public.user_settings
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Realtime (optional, for collaborative playlists)
-- =====================================================================
-- alter publication supabase_realtime add table public.playlists;
-- alter publication supabase_realtime add table public.playlist_tracks;
