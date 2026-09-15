import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Article = {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
  popularity?: number;
};

async function getKey(provider: string): Promise<string | null> {
  const envName = provider === 'gnews' ? 'GNEWS_API_KEY' : 'NEWSAPI_KEY';
  const fromEnv = Deno.env.get(envName);
  if (fromEnv) return fromEnv;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data } = await admin.from('app_api_keys').select('api_key').eq('provider', provider).maybeSingle();
  return data?.api_key ?? null;
}

async function hackerNews(query: string, page: number): Promise<Article[]> {
  const base = query
    ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story`
    : 'https://hn.algolia.com/api/v1/search?tags=front_page';
  const res = await fetch(`${base}&hitsPerPage=50&page=${Math.max(0, page - 1)}`);
  if (!res.ok) throw new Error(`Hacker News request failed [${res.status}]: ${await res.text()}`);
  const json = await res.json();
  return (json.hits || [])
    .filter((h: Record<string, unknown>) => h.title)
    .map((h: Record<string, string | number>) => ({
      title: String(h.title),
      description: h.story_text ? String(h.story_text).slice(0, 300) : `${h.points ?? 0} points, ${h.num_comments ?? 0} comments on Hacker News.`,
      content: h.story_text ? String(h.story_text) : null,
      url: String(h.url || `https://news.ycombinator.com/item?id=${h.objectID}`),
      urlToImage: null,
      publishedAt: new Date(Number(h.created_at_i) * 1000).toISOString(),
      source: { name: 'Hacker News' },
      popularity: Number(h.points ?? 0),
    }));
}

async function gnews(query: string, category: string, page: number, key: string): Promise<Article[]> {
  const params = new URLSearchParams({ lang: 'en', max: '25', page: String(page), apikey: key });
  let url: string;
  if (query) {
    params.set('q', query);
    url = `https://gnews.io/api/v4/search?${params}`;
  } else {
    if (category && category !== 'all') params.set('topic', category === 'business' ? 'business' : category);
    url = `https://gnews.io/api/v4/top-headlines?${params}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GNews request failed [${res.status}]: ${await res.text()}`);
  const json = await res.json();
  return (json.articles || []).map((a: Record<string, string> & { source?: { name?: string } }) => ({
    title: a.title,
    description: a.description ?? null,
    content: a.content ?? a.description ?? null,
    url: a.url,
    urlToImage: a.image ?? null,
    publishedAt: a.publishedAt,
    source: { name: a.source?.name ?? 'GNews' },
  }));
}

async function newsapi(query: string, category: string, source: string, page: number, key: string): Promise<Article[]> {
  const params = new URLSearchParams({ pageSize: '50', page: String(page), apiKey: key });
  let url: string;
  if (query) {
    params.set('q', query);
    params.set('language', 'en');
    url = `https://newsapi.org/v2/everything?${params}`;
  } else {
    if (source && source !== 'all') params.set('sources', source);
    else {
      params.set('country', 'us');
      if (category && category !== 'all') params.set('category', category);
    }
    url = `https://newsapi.org/v2/top-headlines?${params}`;
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'lovable-news-app' } });
  if (!res.ok) throw new Error(`NewsAPI request failed [${res.status}]: ${await res.text()}`);
  const json = await res.json();
  if (json.status === 'error') throw new Error(`NewsAPI error: ${json.message}`);
  return (json.articles || []).filter((a: { title?: string }) => a.title && a.title !== '[Removed]');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const provider = String(body.provider ?? url.searchParams.get('provider') ?? 'hackernews');
    const query = String(body.query ?? url.searchParams.get('query') ?? '').slice(0, 200);
    const category = String(body.category ?? url.searchParams.get('category') ?? 'all');
    const source = String(body.source ?? url.searchParams.get('source') ?? 'all');
    const page = Math.min(10, Math.max(1, Number(body.page ?? url.searchParams.get('page') ?? 1) || 1));

    if (!['hackernews', 'gnews', 'newsapi'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Unknown provider' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (provider === 'hackernews') {
      const articles = await hackerNews(query, page);
      return new Response(JSON.stringify({ provider, articles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = await getKey(provider);
    if (!key) {
      return new Response(
        JSON.stringify({ error: 'missing_key', provider, message: `No API key saved for ${provider}.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const articles = provider === 'gnews'
      ? await gnews(query, category, page, key)
      : await newsapi(query, category, source, page, key);

    return new Response(JSON.stringify({ provider, articles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('news function failed:', message);
    return new Response(JSON.stringify({ error: 'provider_failed', details: message }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
