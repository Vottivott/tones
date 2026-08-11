begin;

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-samples',
  'voice-samples',
  false,
  10485760,
  array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.voice_samples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  client_sample_id text not null,
  syllable text not null,
  target_tone text not null check (target_tone in ('1', '2', '3', '4')),
  character text not null,
  pinyin text not null,
  meaning text not null,
  storage_bucket text not null default 'voice-samples',
  storage_path text not null unique,
  mime_type text not null,
  duration_ms integer,
  size_bytes integer,
  audio_format text,
  sample_rate integer,
  pitch_features jsonb,
  user_agent text,
  device jsonb,
  status text not null default 'uploaded',
  notes text
);

alter table public.voice_samples
  add column if not exists predicted_tone text check (predicted_tone is null or predicted_tone in ('1', '2', '3', '4')),
  add column if not exists prediction_confidence numeric,
  add column if not exists prediction_method text,
  add column if not exists prediction_scores jsonb,
  add column if not exists prediction_features jsonb,
  add column if not exists is_prediction_correct boolean;

alter table public.voice_samples enable row level security;

revoke select on public.voice_samples from anon;
grant select (syllable, target_tone, pinyin, pitch_features, storage_bucket, status) on public.voice_samples to anon;
grant insert on public.voice_samples to anon;
grant select, insert, update, delete on public.voice_samples to service_role;
grant insert on storage.objects to anon;

drop policy if exists "anon_insert_bao_voice_samples" on public.voice_samples;
drop policy if exists "anon_insert_voice_samples_first8" on public.voice_samples;
create policy "anon_insert_voice_samples_first8"
on public.voice_samples
for insert
to anon
with check (
  syllable in ('ma', 'yi', 'shi', 'ba', 'bao', 'qi', 'tang', 'yan')
  and storage_bucket = 'voice-samples'
  and storage_path like syllable || '/%'
  and target_tone in ('1', '2', '3', '4')
);

drop policy if exists "anon_read_bao_voice_sample_features" on public.voice_samples;
drop policy if exists "anon_read_voice_sample_features_first8" on public.voice_samples;
create policy "anon_read_voice_sample_features_first8"
on public.voice_samples
for select
to anon
using (
  syllable in ('ma', 'yi', 'shi', 'ba', 'bao', 'qi', 'tang', 'yan')
  and storage_bucket = 'voice-samples'
  and target_tone in ('1', '2', '3', '4')
);

drop policy if exists "anon_upload_bao_voice_audio" on storage.objects;
drop policy if exists "anon_upload_voice_audio_first8" on storage.objects;
create policy "anon_upload_voice_audio_first8"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'voice-samples'
  and name ~ '^(ma|yi|shi|ba|bao|qi|tang|yan)/'
);

commit;
