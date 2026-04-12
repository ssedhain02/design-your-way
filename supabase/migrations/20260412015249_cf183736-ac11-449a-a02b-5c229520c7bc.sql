
-- 1. Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Public read access for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own images
CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own images
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Auto-assign printer on order insert
CREATE OR REPLACE FUNCTION public.auto_assign_printer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _printer_id uuid;
BEGIN
  -- Pick a printer vendor with the fewest active (non-completed) assignments
  SELECT ur.user_id INTO _printer_id
  FROM user_roles ur
  WHERE ur.role = 'vendor_printer'
  ORDER BY (
    SELECT count(*) FROM vendor_assignments va
    WHERE va.vendor_id = ur.user_id AND va.status != 'completed'
  ) ASC
  LIMIT 1;

  IF _printer_id IS NOT NULL THEN
    INSERT INTO vendor_assignments (order_id, vendor_id, vendor_type, status)
    VALUES (NEW.id, _printer_id, 'vendor_printer', 'pending');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_printer
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_printer();

-- 3. Auto-assign delivery when order becomes ready_for_pickup
CREATE OR REPLACE FUNCTION public.auto_assign_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _driver_id uuid;
BEGIN
  IF NEW.status = 'ready_for_pickup' AND (OLD.status IS DISTINCT FROM 'ready_for_pickup') THEN
    -- Pick a delivery vendor with fewest active assignments
    SELECT ur.user_id INTO _driver_id
    FROM user_roles ur
    WHERE ur.role = 'vendor_delivery'
    ORDER BY (
      SELECT count(*) FROM vendor_assignments va
      WHERE va.vendor_id = ur.user_id AND va.status != 'completed'
    ) ASC
    LIMIT 1;

    IF _driver_id IS NOT NULL THEN
      INSERT INTO vendor_assignments (order_id, vendor_id, vendor_type, status)
      VALUES (NEW.id, _driver_id, 'vendor_delivery', 'pending');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_delivery();

-- 4. Enable realtime on orders and vendor_assignments
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_assignments;
