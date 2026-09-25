// Deletes listing photos that should no longer exist.
//
// Storage files cannot be deleted from SQL - a trigger on storage.objects
// refuses, because a row deleted there would leave the file itself behind -
// so removal has to go through the Storage API with the service key, which
// is what this function is for. The database decides what is due
// (photos_due_for_removal): photos whose listing has ended or been deleted,
// photos the owner rejected, uploads abandoned for an hour, and any file no
// listing points at. This only carries out that decision.
//
// Run every ten minutes by pg_cron (see 0019_photo_cleanup_schedule.sql).
// It authenticates the caller with a key kept in the database vault, never in
// this repository, so knowing the URL is not enough to run it - though running
// it could only ever delete what is due to be deleted anyway.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUCKET = 'listing-photos';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const key = req.headers.get('x-cleanup-key') ?? '';
  const { data: allowed, error: authError } = await supabase.rpc('photo_cleanup_key_matches', {
    p_key: key,
  });
  if (authError) return json({ error: authError.message }, 500);
  if (allowed !== true) return json({ error: 'unauthorized' }, 401);

  const { data: due, error: dueError } = await supabase.rpc('photos_due_for_removal');
  if (dueError) return json({ error: dueError.message }, 500);

  const paths = (due ?? []) as string[];
  if (paths.length === 0) return json({ removed: 0 });

  // In batches: the Storage API takes a list, but not an unbounded one.
  let removed = 0;
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) return json({ error: error.message, removed }, 500);
    const { error: markError } = await supabase.rpc('photos_removed', { p_paths: batch });
    if (markError) return json({ error: markError.message, removed }, 500);
    removed += batch.length;
  }

  return json({ removed });
});
