begin;

delete from public.voice_samples
where syllable in ('ma', 'ba');

delete from storage.objects
where bucket_id = 'voice-samples'
  and name ~ '^(ma|ba)/';

commit;
