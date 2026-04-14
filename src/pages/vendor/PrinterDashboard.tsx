import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { LogOut, Printer, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorProduct {
  id: string;
  name: string;
  image_url: string | null;
  colors: string[];
  sizes: string[];
  description: string | null;
  base_price: number;
  is_active: boolean;
}

export default function PrinterDashboard() {
  const { user, signOut } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [productForm, setProductForm] = useState({ name: '', description: '', base_price: '15.00', colors: '#ffffff,#000000', sizes: 'S,M,L,XL,XXL' });
  const [savingProduct, setSavingProduct] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('vendor_assignments')
        .select('*, orders(*, order_items(*, products(*)))')
        .eq('vendor_id', user.id)
        .eq('vendor_type', 'vendor_printer')
        .order('assigned_at', { ascending: false });
      setAssignments(data || []);
      setLoading(false);
    };
    fetchData();
    fetchVendorProducts();

    const channel = supabase.channel('printer-assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_assignments', filter: `vendor_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchVendorProducts = async () => {
    if (!user) return;
    const { data } = await (supabase.from('vendor_products' as any).select('*').eq('vendor_id', user.id) as any);
    setVendorProducts((data || []).map((p: any) => ({
      ...p,
      colors: Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]'),
      sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
    })));
  };

  const acceptJob = async (assignmentId: string, orderId: string) => {
    await supabase.from('vendor_assignments').update({ status: 'in_progress' }).eq('id', assignmentId);
    await supabase.from('orders').update({ status: 'printing' }).eq('id', orderId);
  };

  const markPrinted = async (assignmentId: string, orderId: string) => {
    await supabase.from('vendor_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', assignmentId);
    await supabase.from('orders').update({ status: 'ready_for_pickup' }).eq('id', orderId);
  };

  const handleAddProduct = async () => {
    if (!user || !productForm.name.trim()) return;
    setSavingProduct(true);
    try {
      const { error } = await (supabase.from('vendor_products' as any).insert({
        vendor_id: user.id,
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        base_price: parseFloat(productForm.base_price) || 0,
        colors: productForm.colors.split(',').map(c => c.trim()).filter(Boolean),
        sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
      }) as any);
      if (error) throw error;
      toast({ title: 'Product listed!' });
      setProductForm({ name: '', description: '', base_price: '15.00', colors: '#ffffff,#000000', sizes: 'S,M,L,XL,XXL' });
      fetchVendorProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    await (supabase.from('vendor_products' as any).delete().eq('id', id) as any);
    fetchVendorProducts();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Printer Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm">Marketplace</Button></Link>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Print Jobs</TabsTrigger>
            <TabsTrigger value="products">My Products</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="Pending" value={assignments.filter(a => a.status === 'pending').length} />
              <StatCard label="In Progress" value={assignments.filter(a => a.status === 'in_progress').length} />
              <StatCard label="Completed" value={assignments.filter(a => a.status === 'completed').length} />
            </div>

            {loading ? <p className="text-muted-foreground">Loading...</p> : assignments.length === 0 ? (
              <p className="text-center py-16 text-muted-foreground">No print jobs assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {assignments.map(a => {
                  const items = a.orders?.order_items || [];
                  const firstProduct = items[0]?.products;
                  return (
                    <div key={a.id} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex gap-4">
                        {firstProduct?.image_url && (
                          <img src={firstProduct.image_url} alt="" className="w-20 h-20 rounded object-contain border border-border" style={{ backgroundColor: firstProduct.garment_color }} />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm">Order #{a.orders?.id?.slice(0, 8)}</span>
                            <Badge variant="outline">{a.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1 mb-3">
                            {items.map((item: any, i: number) => (
                              <p key={i}>{item.products?.title || 'Product'} — Size: {item.size || 'N/A'} × {item.quantity}</p>
                            ))}
                            <p className="font-medium text-foreground">${Number(a.orders?.total_amount || 0).toFixed(2)}</p>
                          </div>
                          {a.orders?.shipping_address && <p className="text-sm text-muted-foreground mb-3">📍 {a.orders.shipping_address}</p>}
                          <div className="flex gap-2">
                            {a.status === 'pending' && <Button size="sm" onClick={() => acceptJob(a.id, a.order_id)}>Accept & Start Printing</Button>}
                            {a.status === 'in_progress' && <Button size="sm" onClick={() => markPrinted(a.id, a.order_id)}>Mark as Printed ✓</Button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products">
            <div className="border border-border rounded-lg p-6 bg-card mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> List New Product</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder="Classic T-Shirt" />
                </div>
                <div>
                  <Label>Base Price ($)</Label>
                  <Input type="number" value={productForm.base_price} onChange={e => setProductForm(p => ({ ...p, base_price: e.target.value }))} />
                </div>
                <div>
                  <Label>Colors (comma-separated hex)</Label>
                  <Input value={productForm.colors} onChange={e => setProductForm(p => ({ ...p, colors: e.target.value }))} placeholder="#ffffff,#000000,#ff0000" />
                </div>
                <div>
                  <Label>Sizes (comma-separated)</Label>
                  <Input value={productForm.sizes} onChange={e => setProductForm(p => ({ ...p, sizes: e.target.value }))} placeholder="S,M,L,XL,XXL" />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Cotton fabric, comfortable wear" />
                </div>
              </div>
              <Button className="mt-4" onClick={handleAddProduct} disabled={savingProduct || !productForm.name.trim()}>
                {savingProduct ? 'Saving...' : 'List Product'}
              </Button>
            </div>

            {vendorProducts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No products listed yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vendorProducts.map(p => (
                  <div key={p.id} className="border border-border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold">{p.name}</h4>
                    <p className="text-sm text-muted-foreground">${Number(p.base_price).toFixed(2)}</p>
                    <div className="flex gap-1 mt-2">
                      {p.colors.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {p.sizes.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-3 text-destructive" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
