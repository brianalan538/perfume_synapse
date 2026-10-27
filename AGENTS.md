<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# YA SABES QUE HACER

Si el usuario inicia con "YA SABES QUE HACER" (o similar), ejecutar la rutina
de verificación del proveedor SIN preguntar. Es la tarea principal del proyecto:

1. Leer `checkpoint.txt` (guarda el estado/última auditoría del proyecto).
2. Cargar `.env.local` en el entorno (necesita NEXT_PUBLIC_SUPABASE_URL y
   SUPABASE_SERVICE_ROLE_KEY).
3. Descargar `https://www.cosmeking-py.com/public/products` (API del proveedor).
4. Comparar contra Supabase:
   - `node scripts/compare-prices.js` → productos NUEVOS, cambios de costo,
     productos SIN match (eliminados).
   - `node scripts/sync-all-prices.js --dry-run` → previsualiza cambios reales
     de costo/precio/stock/volúmenes.
5. Aplicar según el resultado:
   - Precios/stock: `node scripts/sync-all-prices.js` (si hay cambios reales).
   - Productos NUEVOS del proveedor: agregarlos (patrón: `scripts/add-new-provider.mjs`).
   - Productos que el proveedor ELIMINÓ: ocultarlos (is_active=false, soft delete)
     vía Supabase, no borrar.
6. Actualizar `checkpoint.txt` con el resultado de la auditoría (fecha + resumen).
7. Si hubo cambios de código/scripts o de precios que ameriten deploy:
   commit + push a main (Vercel hace deploy automático).
   Si NO hubo cambios visibles en la web, no es necesario deploy.

Notas:
- Solo importan perfumes: categorías 1 (Masculinos), 2 (Femeninos), 3 (Unisex).
  Las categorías 4-18 (cosméticos) NO se muestran en el frontend.
- El proveedor publica price_wholesale en USD → `scripts/pricing.js` convierte a
  Gs con tasa 6100 (auto-detección).
- El frontend NO muestra stock públicamente (solo /admin); los cambios de stock
  no requieren deploy.
- Node 20 local: los scripts con supabase-js deben pasar transport WebSocket
  de 'ws' (ya lo hacen).
