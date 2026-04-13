
-- Helper function: check if user owns order (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_owns_order(_user_id uuid, _order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = _order_id AND user_id = _user_id
  )
$$;

-- Helper function: check if vendor is assigned to order (bypasses RLS)
CREATE OR REPLACE FUNCTION public.vendor_assigned_to_order(_vendor_id uuid, _order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_assignments
    WHERE order_id = _order_id AND vendor_id = _vendor_id
  )
$$;

-- Fix orders: replace vendor policy that queries vendor_assignments
DROP POLICY IF EXISTS "Vendors can view assigned orders" ON public.orders;
CREATE POLICY "Vendors can view assigned orders"
ON public.orders
FOR SELECT
USING (public.vendor_assigned_to_order(auth.uid(), id));

-- Fix vendor_assignments: replace user policy that queries orders
DROP POLICY IF EXISTS "Users can view assignments for own orders" ON public.vendor_assignments;
CREATE POLICY "Users can view assignments for own orders"
ON public.vendor_assignments
FOR SELECT
USING (public.user_owns_order(auth.uid(), order_id));

-- Fix order_items: replace policies that do subqueries on orders
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Users can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (public.user_owns_order(auth.uid(), order_id));

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
USING (public.user_owns_order(auth.uid(), order_id));

DROP POLICY IF EXISTS "Vendors can view assigned order items" ON public.order_items;
CREATE POLICY "Vendors can view assigned order items"
ON public.order_items
FOR SELECT
USING (public.vendor_assigned_to_order(auth.uid(), order_id));
