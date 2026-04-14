import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerStore } from '@/store/designerStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Palette } from 'lucide-react';

interface VendorProduct {
  id: string;
  name: string;
  image_url: string | null;
  colors: string[];
  sizes: string[];
  description: string | null;
  base_price: number;
}

export default function ProductSelection() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setSelectedProduct, setGarmentColor } = useDesignerStore();

  useEffect(() => {
    supabase
      .from('vendor_products')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        const mapped = (data || []).map((p: any) => ({
          ...p,
          colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
          sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
        }));
        setProducts(mapped);
        setLoading(false);
      });
  }, []);

  const handleSelect = (product: VendorProduct) => {
    setSelectedProduct({
      id: product.id,
      name: product.name,
      colors: product.colors,
      sizes: product.sizes,
      basePrice: product.base_price,
      imageUrl: product.image_url,
    });
    setGarmentColor(product.colors[0] || '#ffffff');
    navigate('/designer');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <h1 className="text-xl font-bold">Choose a Product to Design</h1>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-muted-foreground text-center py-16">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No products available yet.</p>
            <p>Vendors haven't listed any products. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
                <div className="aspect-square flex items-center justify-center bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-5xl">👕</span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Colors:</span>
                    {p.colors.map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </div>

                  {p.sizes.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {p.sizes.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-lg">From ${Number(p.base_price).toFixed(2)}</span>
                    <Button size="sm" onClick={() => handleSelect(p)}>
                      <Palette className="w-4 h-4 mr-1" />Design
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
