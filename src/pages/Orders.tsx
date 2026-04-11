import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  printing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ready_for_pickup: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  in_delivery: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();

    const channel = supabase.channel('orders-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
          <h1 className="text-xl font-bold">My Orders</h1>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? <p className="text-muted-foreground">Loading...</p> : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-4">No orders yet</p>
            <Link to="/"><Button>Browse Products</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
                    <span className="ml-3 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="outline" className={statusColors[order.status] || ''}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{order.order_items?.length || 0} item(s)</span>
                  <span className="font-bold">${Number(order.total_amount).toFixed(2)}</span>
                </div>
                {order.shipping_address && <p className="text-sm text-muted-foreground mt-2">📍 {order.shipping_address}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
