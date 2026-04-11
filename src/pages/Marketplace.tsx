import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, LogOut, User, Package, Palette } from 'lucide-react';
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
      {/* Header */}
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

      {/* Hero */}
      <section className="py-16 px-4 text-center bg-accent/30">
        <h1 className="text-4xl font-bold mb-4">Design Your Own Custom Apparel</h1>
        <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
          Create unique designs, order custom prints, and get them delivered to your door.
        </p>
        <Link to="/designer">
          <Button size="lg"><Palette className="w-5 h-5 mr-2" />Start Designing</Button>
        </Link>
      </section>

      {/* Products */}
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

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
      <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: product.garment_color }}>
        <span className="text-4xl">👕</span>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold truncate">{product.title}</h3>
        {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">${Number(product.price).toFixed(2)}</span>
          <Button size="sm" onClick={() => {
            if (!user) { window.location.href = '/login'; return; }
            addItem({ productId: product.id, title: product.title, price: Number(product.price), quantity: 1, size: 'M', garmentColor: product.garment_color });
          }}>
            <ShoppingCart className="w-4 h-4 mr-1" />Add
          </Button>
        </div>
      </div>
    </div>
  );
}
