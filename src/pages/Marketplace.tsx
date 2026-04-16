import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, LogOut, Package, Palette, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface VendorProduct {
  id: string;
  name: string;
  image_url: string | null;
  colors: string[];
  sizes: string[];
  description: string | null;
  base_price: number;
}

export default function Marketplace() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut, hasRole } = useAuth();
  const cartCount = useCartStore(s => s.items.length);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">Custom Wear Studio</Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/orders">
                  <Button variant="ghost" size="sm"><Package className="w-4 h-4 mr-2" />Orders</Button>
                </Link>
                <Link to="/cart">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="w-4 h-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
                    )}
                  </Button>
                </Link>
                {hasRole('vendor_printer') && <Link to="/vendor/printer"><Button variant="ghost" size="sm">Printer</Button></Link>}
                {hasRole('vendor_delivery') && <Link to="/vendor/delivery"><Button variant="ghost" size="sm">Delivery</Button></Link>}
                {hasRole('admin') && <Link to="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>}
                <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
              </>
            ) : (
              <Link to="/login"><Button size="sm">Sign In</Button></Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-foreground text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-6 z-10">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
              Design Your<br />Own Clothing
            </h1>
            <p className="text-lg opacity-80 max-w-md">
              Pick a garment, upload your artwork, and we'll print & deliver it. Bring your imagination to life.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate('/marketplace')}
            >
              <Palette className="w-5 h-5 mr-2" />
              Shop Now
            </Button>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            {/* Decorative floating elements */}
            <div className="relative w-72 h-80 md:w-80 md:h-96">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[120px] md:text-[160px] opacity-20 animate-float-slow">👕</div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-primary/20 backdrop-blur-sm rounded-2xl px-8 py-6 text-center border border-primary/30">
                  <p className="text-2xl md:text-3xl font-bold">YOUR DESIGN</p>
                  <p className="text-lg opacity-70">HERE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Category */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 tracking-tight">Shop By Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Customize Your Clothes — main CTA */}
          <Link
            to="/marketplace"
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-foreground text-primary-foreground flex flex-col justify-end p-6 hover:shadow-xl transition-shadow"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity">
              <span className="text-[100px]">🎨</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">Customize Your Clothes</h3>
              <p className="text-sm opacity-70 mb-3">Upload your design on any garment</p>
              <span className="inline-flex items-center text-sm font-medium text-primary">
                Start Designing <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </Link>

          {/* Browse Products */}
          <Link
            to="/marketplace"
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-accent flex flex-col justify-end p-6 hover:shadow-xl transition-shadow"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
              <span className="text-[100px]">👕</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">Plain T-Shirts</h3>
              <p className="text-sm text-muted-foreground mb-3">Premium blank garments ready for your art</p>
              <span className="inline-flex items-center text-sm font-medium text-primary">
                Browse <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </Link>

          {/* Direct to Designer */}
          <Link
            to="/designer"
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-secondary flex flex-col justify-end p-6 hover:shadow-xl transition-shadow"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
              <span className="text-[100px]">✏️</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">Design Studio</h3>
              <p className="text-sm text-muted-foreground mb-3">Jump straight into the design tool</p>
              <span className="inline-flex items-center text-sm font-medium text-primary">
                Open Studio <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {!loading && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Available Products</h2>
            <Link to="/marketplace" className="text-sm text-primary font-medium inline-flex items-center hover:underline">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 4).map(p => (
              <Link
                key={p.id}
                to="/marketplace"
                className="group border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow"
              >
                <div className="aspect-square flex items-center justify-center bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-5xl">👕</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold">From ${Number(p.base_price).toFixed(2)}</span>
                    <div className="flex gap-0.5">
                      {p.colors.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-accent/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10 tracking-tight">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '👕', title: 'Pick a Garment', desc: 'Choose from vendor-listed blank garments — t-shirts, hoodies, and more.' },
              { step: '2', icon: '🎨', title: 'Upload Your Design', desc: 'Use our design studio to add your artwork, text, or images onto the garment.' },
              { step: '3', icon: '📦', title: 'We Print & Deliver', desc: 'Place your order and our vendors handle printing and delivery.' },
            ].map(item => (
              <div key={item.step} className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-3xl">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Custom Wear Studio. Design your imagination.</p>
        </div>
      </footer>
    </div>
  );
}
