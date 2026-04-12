import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { LogOut, Truck } from 'lucide-react';

export default function DeliveryDashboard() {
  const { user, signOut } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('vendor_assignments')
        .select('*, orders(*, order_items(*, products(*)))')
        .eq('vendor_id', user.id)
        .eq('vendor_type', 'vendor_delivery')
        .order('assigned_at', { ascending: false });
      setAssignments(data || []);
      setLoading(false);
    };
    fetchData();

    const channel = supabase.channel('delivery-assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_assignments', filter: `vendor_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const acceptPickup = async (assignmentId: string, orderId: string) => {
    await supabase.from('vendor_assignments').update({ status: 'in_progress' }).eq('id', assignmentId);
    await supabase.from('orders').update({ status: 'in_delivery' }).eq('id', orderId);
  };

  const markDelivered = async (assignmentId: string, orderId: string) => {
    await supabase.from('vendor_assignments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', assignmentId);
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Delivery Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm">Marketplace</Button></Link>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Pending Pickup" value={assignments.filter(a => a.status === 'pending').length} />
          <StatCard label="In Delivery" value={assignments.filter(a => a.status === 'in_progress').length} />
          <StatCard label="Delivered" value={assignments.filter(a => a.status === 'completed').length} />
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : assignments.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">No delivery jobs assigned yet.</p>
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
                      {a.orders?.shipping_address && (
                        <div className="bg-accent/50 rounded p-2 mb-3">
                          <p className="text-sm font-medium">📍 Deliver to:</p>
                          <p className="text-sm">{a.orders.shipping_address}</p>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mb-3">{items.length} item(s) • ${Number(a.orders?.total_amount || 0).toFixed(2)}</p>
                      <div className="flex gap-2">
                        {a.status === 'pending' && <Button size="sm" onClick={() => acceptPickup(a.id, a.order_id)}>Accept & Pick Up</Button>}
                        {a.status === 'in_progress' && <Button size="sm" onClick={() => markDelivered(a.id, a.order_id)}>Mark Delivered ✓</Button>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
