import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { LogOut, Shield, Users, Package, Truck, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const { signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [ordersRes, usersRes, assignRes] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, user_roles(role)'),
        supabase.from('vendor_assignments').select('*, orders(*)').order('assigned_at', { ascending: false }),
      ]);
      setOrders(ordersRes.data || []);
      setUsers(usersRes.data || []);
      setAssignments(assignRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const stats = {
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    printing: orders.filter(o => o.status === 'printing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((s, o) => s + Number(o.total_amount), 0),
  };

  const assignToPrinter = async (orderId: string) => {
    const printers = users.filter(u => u.user_roles?.some((r: any) => r.role === 'vendor_printer'));
    if (printers.length === 0) return alert('No printer vendors registered');
    const printer = printers[0]; // Simple round-robin - first available
    await supabase.from('vendor_assignments').insert({
      order_id: orderId, vendor_id: printer.user_id, vendor_type: 'vendor_printer',
    });
    await supabase.from('orders').update({ status: 'pending' }).eq('id', orderId);
    window.location.reload();
  };

  const assignToDelivery = async (orderId: string) => {
    const drivers = users.filter(u => u.user_roles?.some((r: any) => r.role === 'vendor_delivery'));
    if (drivers.length === 0) return alert('No delivery vendors registered');
    const driver = drivers[0];
    await supabase.from('vendor_assignments').insert({
      order_id: orderId, vendor_id: driver.user_id, vendor_type: 'vendor_delivery',
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Admin ERP Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm">Marketplace</Button></Link>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Package className="w-5 h-5" />} label="Total Orders" value={stats.totalOrders} />
          <StatCard icon={<Package className="w-5 h-5 text-yellow-500" />} label="Pending" value={stats.pending} />
          <StatCard icon={<Package className="w-5 h-5 text-blue-500" />} label="Printing" value={stats.printing} />
          <StatCard icon={<Truck className="w-5 h-5 text-green-500" />} label="Delivered" value={stats.delivered} />
          <StatCard icon={<span className="text-lg">$</span>} label="Revenue" value={`$${stats.revenue.toFixed(2)}`} />
        </div>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users & Vendors</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4 mt-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-10" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            {loading ? <p>Loading...</p> : orders.filter(o => o.id.includes(search) || o.status.includes(search)).map(o => (
              <div key={o.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">#{o.id.slice(0, 8)}</span>
                    <Badge variant="outline">{o.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <span className="font-bold">${Number(o.total_amount).toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{o.order_items?.length || 0} items • {new Date(o.created_at).toLocaleString()}</p>
                <div className="flex gap-2">
                  {o.status === 'pending' && !assignments.some(a => a.order_id === o.id && a.vendor_type === 'vendor_printer') && (
                    <Button size="sm" variant="outline" onClick={() => assignToPrinter(o.id)}>Assign to Printer</Button>
                  )}
                  {o.status === 'ready_for_pickup' && !assignments.some(a => a.order_id === o.id && a.vendor_type === 'vendor_delivery') && (
                    <Button size="sm" variant="outline" onClick={() => assignToDelivery(o.id)}>Assign to Delivery</Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            {users.map(u => (
              <div key={u.id} className="border border-border rounded-lg p-4 bg-card mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{u.full_name || 'Unnamed'}</p>
                  <p className="text-sm text-muted-foreground">{u.user_id?.slice(0, 8)}</p>
                </div>
                <div className="flex gap-1">
                  {u.user_roles?.map((r: any, i: number) => (
                    <Badge key={i} variant="secondary">{r.role}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="assignments" className="mt-4">
            {assignments.map(a => (
              <div key={a.id} className="border border-border rounded-lg p-4 bg-card mb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">Order #{a.orders?.id?.slice(0, 8)}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline">{a.vendor_type.replace('vendor_', '')}</Badge>
                    <Badge variant="secondary">{a.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
