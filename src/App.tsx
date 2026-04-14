import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Marketplace from "./pages/Marketplace";
import Designer from "./pages/Index";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import ProductSelection from "./pages/ProductSelection";
import PrinterDashboard from "./pages/vendor/PrinterDashboard";
import DeliveryDashboard from "./pages/vendor/DeliveryDashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/marketplace" element={<ProductSelection />} />
            <Route path="/designer" element={<Designer />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/vendor/printer" element={<ProtectedRoute requiredRole="vendor_printer"><PrinterDashboard /></ProtectedRoute>} />
            <Route path="/vendor/delivery" element={<ProtectedRoute requiredRole="vendor_delivery"><DeliveryDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
