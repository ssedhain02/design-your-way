import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'customer' | 'vendor_printer' | 'vendor_delivery' | 'admin';

export default function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: AppRole }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && !hasRole(requiredRole) && !hasRole('admin')) return <Navigate to="/" replace />;

  return <>{children}</>;
}
