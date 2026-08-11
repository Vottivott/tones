begin;

with target as (
  select id, storage_path
  from public.voice_samples
  where syllable = 'tang'
    and target_tone = '3'
  order by created_at desc
  limit 1
),
deleted_object as (
  delete from storage.objects object
  using target
  where object.bucket_id = 'voice-samples'
    and object.name = target.storage_path
  returning object.name
)
delete from public.voice_samples sample
using target
where sample.id = target.id;

commit;
