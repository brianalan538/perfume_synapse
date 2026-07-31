import { Suspense } from 'react';
import ProductsContent from './content';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center"><p className="text-gray-500">Cargando...</p></div>}>
      <ProductsContent />
    </Suspense>
  );
}
