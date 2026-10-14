// Serves /.well-known/assetlinks.json for berqategh.am (Netlify proxies that
// path here; see netlify.toml).
//
// The statement ties the Android app to the site, which is what lets the app
// open the site full-screen, without an address bar. It carries the app's
// signing fingerprint, known only once Google Play has issued it - so it lives
// in the database (app_config, key 'assetlinks') and can be set there without
// a site deploy. Public by design: Google reads it from the open web.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data } = await supabase.from('app_config').select('value').eq('key', 'assetlinks').maybeSingle();
  return new Response(JSON.stringify(data?.value ?? []), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
