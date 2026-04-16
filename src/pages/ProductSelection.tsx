import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerStore } from '@/store/designerStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Palette, ChevronRight } from 'lucide-react';

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
  const [selected, setSelected] = useState<VendorProduct | null>(null);
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [chosenSize, setChosenSize] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSelectedProduct, setGarmentColor, setSelectedSize } = useDesignerStore();

  useEffect(() => {
    supabase
      .from('vendor_products')
      .select('*')
      .eq('is_active', true)
      .then(({ data }: any) => {
        const mapped = (data || []).map((p: any) => ({
          ...p,
          colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
          sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
        }));
        setProducts(mapped);
        setLoading(false);
      });
  }, []);

  const handleSelectProduct = (product: VendorProduct) => {
    setSelected(product);
    setChosenColor(product.colors[0] || '#ffffff');
    setChosenSize(product.sizes[0] || null);
  };

  const handleStartDesigning = () => {
    if (!selected) return;
    setSelectedProduct({
      id: selected.id,
      name: selected.name,
      colors: selected.colors,
      sizes: selected.sizes,
      basePrice: selected.base_price,
      imageUrl: selected.image_url,
    });
    setGarmentColor(chosenColor || selected.colors[0] || '#ffffff');
    if (chosenSize) setSelectedSize(chosenSize);
    navigate('/designer');
  };

  // Product detail view
  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Products
            </Button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border" style={{ backgroundColor: chosenColor || '#f5f5f5' }}>
              {selected.image_url ? (
                <img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-8xl opacity-40">👕</span>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{selected.name}</h1>
                <p className="text-2xl font-bold text-primary">${Number(selected.base_price).toFixed(2)}</p>
              </div>

              {selected.description && (
                <p className="text-muted-foreground">{selected.description}</p>
              )}

              {/* Choose Variant / Color */}
              {selected.colors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Choose Variant</label>
                  <div className="flex flex-wrap gap-2">
                    {selected.colors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setChosenColor(c)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          chosenColor === c ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-border hover:border-foreground/30'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Choose Size */}
              {selected.sizes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Choose Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selected.sizes.map(s => (
                      <button
                        key={s}
                        onClick={() => setChosenSize(s)}
                        className={`px-4 py-2 text-sm rounded-lg border-2 font-medium transition-all ${
                          chosenSize === s
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-foreground/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Design Upload Info */}
              <div className="bg-accent rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" /> Design
                </p>
                <p className="text-sm text-muted-foreground">
                  You'll upload your artwork in the next step using our design studio. Add images, text, shapes — anything you want printed on this garment.
                </p>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full text-lg py-6"
                onClick={handleStartDesigning}
              >
                <Palette className="w-5 h-5 mr-2" />
                Start Designing
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Product grid
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Home</Button>
          </Link>
          <h1 className="text-xl font-bold">Customize Your Clothes</h1>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-8">
          {loading ? 'Loading products...' : `Showing ${products.length} result${products.length !== 1 ? 's' : ''}`}
        </p>

        {!loading && products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No products available yet.</p>
            <p>Vendors haven't listed any products. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="text-left border border-border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all group"
              >
                <div className="aspect-square flex items-center justify-center bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-5xl">👕</span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                  <p className="text-sm font-bold text-primary">
                    ${Number(p.base_price).toFixed(2)}
                  </p>
                  <div className="flex gap-1 items-center">
                    {p.colors.slice(0, 5).map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c }} />
                    ))}
                    {p.colors.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{p.colors.length - 5}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
