import sharp from 'sharp';
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Product } from './types';

export const SITE_URL = 'https://perfume-synapse.vercel.app';

export const OG_SIZE = { width: 1200, height: 630 };

const CARD_WIDTH = 250;
const CARD_GAP = 28;
const CARD_LEFT = 56;
const CARD_TOP = 246;
const CARD_PADDING = 12;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const BOX_WIDTH = 226;
const BOX_HEIGHT = 160;
const BOX_PADDING = 8;
const TILE_WIDTH = BOX_WIDTH - BOX_PADDING * 2;
const TILE_HEIGHT = BOX_HEIGHT - BOX_PADDING * 2;
const TILE_LEFT = CARD_LEFT + CARD_PADDING + BOX_PADDING;
const TILE_TOP = CARD_TOP + CARD_PADDING + BOX_PADDING;

const PNG_HEADERS = {
  'content-type': 'image/png',
  'cache-control': 'public, max-age=0, must-revalidate',
};

export type OgItem = { product: Product; tile: Buffer };

export function formatGs(value: number): string {
  return `${value.toLocaleString('es-PY')} Gs.`;
}

export function truncate(value: string, max = 32): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

async function loadTile(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;

    return await sharp(Buffer.from(await response.arrayBuffer()))
      .flatten({ background: '#ffffff' })
      .resize(TILE_WIDTH, TILE_HEIGHT, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    return null;
  }
}

export async function pickOgItems(products: Product[], count = 4): Promise<OgItem[]> {
  const candidates = products
    .filter((product) => Boolean(product.image_url) && product.price > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, 10);

  const resolved = await Promise.all(
    candidates.map(async (product) => {
      const tile = await loadTile(product.image_url as string);
      return tile ? { product, tile } : null;
    })
  );

  return resolved.filter((item): item is OgItem => item !== null).slice(0, count);
}

export async function loadOgFonts() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), 'src/assets/fonts/Geist-Regular.ttf')),
    readFile(join(process.cwd(), 'src/assets/fonts/Geist-Bold.ttf')),
  ]);

  return [
    { name: 'Geist', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: bold, weight: 700 as const, style: 'normal' as const },
  ];
}

export function OgPerfumes({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: OgItem[];
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 56px',
        background: 'linear-gradient(140deg, #0b0b14 0%, #171226 55%, #2a1b4d 100%)',
        color: '#ffffff',
        fontFamily: 'Geist',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 3 }}>SYNAPSE</span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 400,
              letterSpacing: 3,
              color: '#c4b5fd',
              marginLeft: 10,
            }}
          >
            DIGITAL
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(196,181,253,0.45)',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 13,
            letterSpacing: 3,
            color: '#d8ccff',
          }}
        >
          FRAGANCIAS ORIGINALES
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24 }}>
        <span style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1 }}>
          {title}
        </span>
        <span style={{ fontSize: 22, color: '#b9b3cc', marginTop: 10 }}>{subtitle}</span>
      </div>

      {items.map(({ product }, index) => (
        <div
          key={product.id}
          style={{
            position: 'absolute',
            left: CARD_LEFT + index * CARD_STEP,
            top: CARD_TOP,
            width: CARD_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: CARD_PADDING,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 22,
          }}
        >
          <div
            style={{
              width: BOX_WIDTH,
              height: BOX_HEIGHT,
              display: 'flex',
              background: '#ffffff',
              borderRadius: 14,
            }}
          />
          <span
            style={{
              marginTop: 10,
              fontSize: 18,
              fontWeight: 700,
              textAlign: 'center',
              lineHeight: 1.2,
              height: 44,
              width: '100%',
            }}
          >
            {truncate(product.name, 30)}
          </span>
          <span
            style={{
              marginTop: 2,
              fontSize: 13,
              color: '#b9a7ff',
              height: 18,
              width: '100%',
              textAlign: 'center',
            }}
          >
            {truncate(product.brand ?? 'SYNAPSE DIGITAL', 26)}
          </span>
          <span style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: '#d8b4fe' }}>
            {formatGs(product.price)}
          </span>
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          bottom: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 17,
          color: '#8b85a3',
        }}
      >
        <span>perfume-synapse.vercel.app</span>
        <span>Envíos a todo Paraguay</span>
      </div>
    </div>
  );
}

export async function renderOgImage({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: OgItem[];
}): Promise<Response> {
  const fonts = await loadOgFonts();
  const baseResponse = new ImageResponse(
    <OgPerfumes title={title} subtitle={subtitle} items={items} />,
    { ...OG_SIZE, fonts }
  );
  const base = Buffer.from(await baseResponse.arrayBuffer());

  if (items.length === 0) {
    return new Response(new Uint8Array(base), { headers: PNG_HEADERS });
  }

  const png = await sharp(base)
    .composite(
      items.map((item, index) => ({
        input: item.tile,
        left: TILE_LEFT + index * CARD_STEP,
        top: TILE_TOP,
      }))
    )
    .png()
    .toBuffer();

  return new Response(new Uint8Array(png), { headers: PNG_HEADERS });
}
