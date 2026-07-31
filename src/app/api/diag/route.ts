import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MISSING';

  const out: Record<string, unknown> = {
    env: {
      url,
      anonLength: anon === 'MISSING' ? 0 : anon.length,
      anonPrefix: anon === 'MISSING' ? '' : anon.substring(0, 20),
    },
  };

  try {
    const client = createClient(url, anon);
    const r = await client.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
    out.products = { error: r.error ? r.error.message : null, statusCode: r.error?.code ?? null, count: r.count };
  } catch (e) {
    out.products = { throw: String(e) };
  }

  try {
    const raw = await fetch(`${url}/rest/v1/products?select=id&is_active=eq.true&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    out.rawFetch = {
      status: raw.status,
      statusText: raw.statusText,
      body: (await raw.text()).substring(0, 300),
    };
  } catch (e) {
    out.rawFetch = { throw: String(e) };
  }

  return NextResponse.json(out);
}
