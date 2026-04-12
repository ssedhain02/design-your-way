
-- Fix 1: Broken vendor orders RLS policy (self-referential join bug)
DROP POLICY IF EXISTS "Vendors can view assigned orders" ON orders;
CREATE POLICY "Vendors can view assigned orders" ON orders
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM vendor_assignments va
    WHERE va.order_id = orders.id
      AND va.vendor_id = auth.uid()
  )
);

-- Fix 2: Add WITH CHECK to admin ALL policy on user_roles to prevent privilege escalation
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles" ON user_roles
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
