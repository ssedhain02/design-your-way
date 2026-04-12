import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { LogOut, Shield, Package, Truck, Search, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'customer' | 'vendor_printer' | 'vendor_delivery' | 'admin';
const ALL_ROLES: AppRole[] = ['customer', 'vendor_printer', 'vendor_delivery', 'admin'];

export default function Admin() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [ordersRes, usersRes, assignRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, user_roles(role)'),
      supabase.from('vendor_assignments').select('*, orders(*)').order('assigned_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    setOrders(ordersRes.data || []);
    setUsers(usersRes.data || []);
    setAssignments(assignRes.data || []);
    setProducts(productsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const addRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role added' });
      fetchAll();
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role removed' });
      fetchAll();
    }
  };

  const stats = {
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    printing: orders.filter(o => o.status === 'printing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((s, o) => s + Number(o.total_amount), 0),
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
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
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
                <p className="text-sm text-muted-foreground">{o.order_items?.length || 0} items • {new Date(o.created_at).toLocaleString()}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3">
            {users.map(u => {
              const currentRoles: string[] = (u.user_roles || []).map((r: any) => r.role);
              const availableRoles = ALL_ROLES.filter(r => !currentRoles.includes(r));
              return (
                <div key={u.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{u.full_name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{u.user_id?.slice(0, 12)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentRoles.map((role: string) => (
                      <Badge key={role} variant="secondary" className="flex items-center gap-1">
                        {role.replace('vendor_', '')}
                        <button onClick={() => removeRole(u.user_id, role as AppRole)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {availableRoles.length > 0 && (
                      <Select onValueChange={(val) => addRole(u.user_id, val as AppRole)}>
                        <SelectTrigger className="w-auto h-7 text-xs gap-1">
                          <Plus className="w-3 h-3" />
                          <SelectValue placeholder="Add role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map(r => (
                            <SelectItem key={r} value={r}>{r.replace('vendor_', '')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="products" className="mt-4 space-y-3">
            {products.map(p => (
              <div key={p.id} className="border border-border rounded-lg p-4 bg-card flex items-center gap-4">
                <div className="w-12 h-12 rounded overflow-hidden border border-border flex-shrink-0" style={{ backgroundColor: p.garment_color }}>
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-contain" /> : <span className="flex items-center justify-center h-full text-lg">👕</span>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">${Number(p.price).toFixed(2)} • {p.is_published ? 'Published' : 'Draft'}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="assignments" className="mt-4 space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="border border-border rounded-lg p-4 bg-card">
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
