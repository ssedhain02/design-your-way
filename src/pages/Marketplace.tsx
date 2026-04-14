import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, LogOut, Package, Palette } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  garment_type: string;
  garment_color: string;
  image_url: string | null;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut, hasRole } = useAuth();
  const cartCount = useCartStore(s => s.items.length);

  useEffect(() => {
    supabase.from('products').select('*').eq('is_published', true)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Custom Wear Studio</Link>
          <nav className="flex items-center gap-3">
            <Link to="/designer">
              <Button variant="outline" size="sm"><Palette className="w-4 h-4 mr-2" />Design</Button>
            </Link>
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
                {hasRole('vendor_printer') && <Link to="/vendor/printer"><Button variant="ghost" size="sm">Printer Panel</Button></Link>}
                {hasRole('vendor_delivery') && <Link to="/vendor/delivery"><Button variant="ghost" size="sm">Delivery Panel</Button></Link>}
                {hasRole('admin') && <Link to="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>}
                <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
              </>
            ) : (
              <Link to="/login"><Button size="sm">Sign In</Button></Link>
            )}
          </nav>
        </div>
      </header>

      <section className="py-20 px-4 text-center bg-accent/30 relative overflow-hidden">
        {/* Animated floating t-shirt mockups */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute text-6xl animate-float-slow opacity-10" style={{ top: '10%', left: '8%' }}>👕</div>
          <div className="absolute text-5xl animate-float-medium opacity-10" style={{ top: '20%', right: '12%' }}>🎨</div>
          <div className="absolute text-4xl animate-float-fast opacity-10" style={{ bottom: '15%', left: '20%' }}>✏️</div>
          <div className="absolute text-5xl animate-float-slow opacity-10" style={{ bottom: '20%', right: '25%' }}>👕</div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Design Your Own Custom Apparel</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Pick a blank garment, unleash your creativity, and get it printed & delivered.
          </p>
          <Link to="/marketplace">
            <Button size="lg" className="text-lg px-8 py-6"><Palette className="w-5 h-5 mr-2" />Start Designing</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Published Designs</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No designs published yet.</p>
            <p>Be the first to <Link to="/designer" className="text-primary underline">create a design</Link>!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore(s => s.addItem);
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState('M');

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
      <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ backgroundColor: product.garment_color }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-contain" />
        ) : (
          <span className="text-4xl">👕</span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate flex-1">{product.title}</h3>
          <Badge variant="secondary" className="text-xs">{product.garment_type}</Badge>
        </div>
        {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
        
        <div className="flex gap-1">
          {SIZES.map(s => (
            <button
              key={s}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                selectedSize === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground'
              }`}
              onClick={() => setSelectedSize(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">${Number(product.price).toFixed(2)}</span>
          <Button size="sm" onClick={() => {
            if (!user) { window.location.href = '/login'; return; }
            addItem({ productId: product.id, title: product.title, price: Number(product.price), quantity: 1, size: selectedSize, garmentColor: product.garment_color });
          }}>
            <ShoppingCart className="w-4 h-4 mr-1" />Add
          </Button>
        </div>
      </div>
    </div>
  );
}
