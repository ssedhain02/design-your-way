import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore();
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0) return;
    setPlacing(true);
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id, total_amount: total(), shipping_address: address, notes,
      }).select().single();
      if (error) throw error;

      const orderItems = items.map(i => ({
        order_id: order.id, product_id: i.productId, quantity: i.quantity,
        size: i.size, unit_price: i.price,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      toast({ title: 'Order placed!', description: `Order #${order.id.slice(0, 8)} has been created.` });
      navigate('/orders');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setPlacing(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
          <h1 className="text-xl font-bold">Shopping Cart</h1>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-4">Your cart is empty</p>
            <Link to="/"><Button>Browse Products</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.productId + item.size} className="flex items-center gap-4 border border-border rounded-lg p-4 bg-card">
                  <div className="w-16 h-16 rounded flex items-center justify-center text-2xl" style={{ backgroundColor: item.garmentColor }}>👕</div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                    <p className="font-semibold">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4 bg-card space-y-4">
                <h3 className="font-semibold">Order Summary</h3>
                <div className="flex justify-between text-sm"><span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span><span>${total().toFixed(2)}</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Total</span><span>${total().toFixed(2)}</span></div>
              </div>
              <div className="space-y-3">
                <div><Label>Shipping Address</Label><Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your delivery address" /></div>
                <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions (optional)" /></div>
                <Button className="w-full" onClick={handlePlaceOrder} disabled={placing || !address}>
                  {placing ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
