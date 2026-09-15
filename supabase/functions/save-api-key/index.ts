import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const PROVIDERS = ['gnews', 'newsapi'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    // Public status read: which providers have a key configured (never the value).
    if (req.method === 'GET') {
      const { data } = await admin.from('app_api_keys').select('provider');
      const saved = new Set((data ?? []).map((r: { provider: string }) => r.provider));
      return json({
        gnews: saved.has('gnews') || Boolean(Deno.env.get('GNEWS_API_KEY')),
        newsapi: saved.has('newsapi') || Boolean(Deno.env.get('NEWSAPI_KEY')),
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Sign in required' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Sign in required' }, 401);

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
    if (!isAdmin) return json({ error: 'Admin access required' }, 403);

    const body = await req.json().catch(() => ({}));
    const provider = String(body.provider ?? '');
    const apiKey = String(body.apiKey ?? '').trim();
    if (!PROVIDERS.includes(provider)) return json({ error: 'Unknown provider' }, 400);
    if (apiKey.length < 8 || apiKey.length > 500) return json({ error: 'That key does not look valid' }, 400);

    const { error } = await admin
      .from('app_api_keys')
      .upsert({ provider, api_key: apiKey, updated_at: new Date().toISOString(), updated_by: userData.user.id });
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('save-api-key failed:', message);
    return json({ error: message }, 500);
  }
});
