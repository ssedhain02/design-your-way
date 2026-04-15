
CREATE TABLE public.vendor_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  image_url text,
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  base_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active vendor products"
  ON public.vendor_products FOR SELECT
  USING (is_active = true);

-- Vendor printers can insert their own products
CREATE POLICY "Printers can insert own products"
  ON public.vendor_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor_printer'));

-- Vendor printers can update their own products
CREATE POLICY "Printers can update own products"
  ON public.vendor_products FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor_printer'));

-- Vendor printers can delete their own products
CREATE POLICY "Printers can delete own products"
  ON public.vendor_products FOR DELETE
  TO authenticated
  USING (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor_printer'));

-- Admins can manage all
CREATE POLICY "Admins can manage all vendor products"
  ON public.vendor_products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamps
CREATE TRIGGER update_vendor_products_updated_at
  BEFORE UPDATE ON public.vendor_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
