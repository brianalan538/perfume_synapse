import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Body = Record<string, unknown>;
type AdminClient = ReturnType<typeof getAdminClient>;

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey!, { auth: { persistSession: false } });
}

function unauthorized() {
  return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function missingKey() {
  return NextResponse.json(
    { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor', needsServiceKey: true },
    { status: 500 }
  );
}

function serverError(error: { message?: string } | null) {
  return NextResponse.json({ error: error?.message || 'Error interno del servidor' }, { status: 500 });
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function asNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return badRequest('JSON inválido');
  }

  const { password, action } = body;
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) return unauthorized();

  if (action === 'auth') {
    return NextResponse.json({ ok: true });
  }

  if (!serviceRoleKey) return missingKey();
  const admin = getAdminClient();

  try {
    switch (action) {
      case 'create':
        return await handleCreate(admin, body);
      case 'update':
        return await handleUpdate(admin, body);
      case 'delete':
        return await handleSetActive(admin, asNumber(body.id), false);
      case 'restore':
        return await handleSetActive(admin, asNumber(body.id), true);
      case 'upload':
        return await handleUpload(admin, body);
      default:
        return badRequest(`Acción desconocida: ${String(action)}`);
    }
  } catch (err: unknown) {
    return serverError(err as { message?: string });
  }
}

async function handleCreate(admin: AdminClient, body: Body) {
  const p = asRecord(body.product);
  const name = typeof p.name === 'string' ? p.name.trim() : '';
  if (!name) return badRequest('Falta el nombre del producto');

  const categoryId = asNumber(p.category_id);
  if (!categoryId) return badRequest('Falta la categoría');

  const { data: cat } = await admin
    .from('categories')
    .select('id, name')
    .eq('id', categoryId)
    .maybeSingle();
  if (!cat) return badRequest('Categoría no válida');

  const { data: maxRow } = await admin
    .from('products')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextId = (maxRow?.id ?? 0) + 1;

  const volumeOptions = Array.isArray(p.volume_options) ? p.volume_options : [];
  const firstVolume = (volumeOptions[0] as Record<string, unknown> | undefined) ?? {};
  const fallbackPrice =
    asNumber(firstVolume.price || firstVolume.price_wholesale) ||
    (p.price_wholesale != null ? asNumber(p.price_wholesale) : 0);

  const product: Record<string, unknown> = {
    id: nextId,
    name,
    brand: p.brand || null,
    category_id: categoryId,
    category_name: cat.name,
    description: typeof p.description === 'string' ? p.description : '',
    short_description: typeof p.short_description === 'string' ? p.short_description : '',
    price: p.price != null ? asNumber(p.price) : fallbackPrice,
    price_wholesale: p.price_wholesale == null ? null : asNumber(p.price_wholesale),
    stock: asNumber(p.stock),
    volume_ml: p.volume_ml == null ? null : asNumber(p.volume_ml),
    volume_options: volumeOptions,
    flavor_enabled: Boolean(p.flavor_enabled),
    flavors: p.flavors ?? [],
    image_url: typeof p.image_url === 'string' && p.image_url ? p.image_url : null,
    image_urls: Array.isArray(p.image_urls) ? p.image_urls : typeof p.image_url === 'string' && p.image_url ? [p.image_url] : [],
    is_active: p.is_active !== false,
  };

  const { data, error } = await admin.from('products').insert(product).select('*').single();
  if (error) return serverError(error);
  return NextResponse.json({ ok: true, id: nextId, product: data });
}

async function handleUpdate(admin: AdminClient, body: Body) {
  const id = asNumber(body.id);
  if (!id) return badRequest('Falta el id');

  const fields = asRecord(body.fields);
  if (Object.keys(fields).length === 0) return badRequest('Falta los campos a actualizar');

  const patch: Record<string, unknown> = { ...fields };

  if (patch.category_id != null) {
    const categoryId = asNumber(patch.category_id);
    const { data: cat } = await admin
      .from('categories')
      .select('id, name')
      .eq('id', categoryId)
      .maybeSingle();
    if (cat) patch.category_name = cat.name;
  }

  if (patch.price != null) patch.price = asNumber(patch.price);
  if (patch.price_wholesale != null) patch.price_wholesale = asNumber(patch.price_wholesale);
  if (patch.stock != null) patch.stock = asNumber(patch.stock);
  if (patch.volume_ml != null) patch.volume_ml = asNumber(patch.volume_ml);

  if (typeof patch.image_url === 'string' && patch.image_url) {
    patch.image_urls = patch.image_urls ?? [patch.image_url];
  }

  const { error } = await admin.from('products').update(patch).eq('id', id);
  if (error) return serverError(error);
  return NextResponse.json({ ok: true, id });
}

async function handleSetActive(admin: AdminClient, id: number, isActive: boolean) {
  if (!id) return badRequest('Falta el id');
  const { error } = await admin.from('products').update({ is_active: isActive }).eq('id', id);
  if (error) return serverError(error);
  return NextResponse.json({ ok: true, id, is_active: isActive });
}

async function handleUpload(admin: AdminClient, body: Body) {
  const fileName = typeof body.fileName === 'string' ? body.fileName : '';
  const base64 = typeof body.base64 === 'string' ? body.base64 : '';
  const contentType = typeof body.contentType === 'string' ? body.contentType : 'image/jpeg';

  if (!fileName || !base64) return badRequest('Faltan archivo o datos');
  const buf = Buffer.from(base64, 'base64');
  if (buf.length === 0) return badRequest('Archivo vacío');

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `products/${Date.now()}_${safeName}`;

  const { error } = await admin.storage.from('perfumes').upload(storagePath, buf, {
    contentType,
    upsert: true,
  });
  if (error) return serverError(error);

  const { data: urlData } = admin.storage.from('perfumes').getPublicUrl(storagePath);
  return NextResponse.json({ ok: true, url: urlData.publicUrl });
}
