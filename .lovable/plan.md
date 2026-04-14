

## Plan: Add Homepage → Marketplace Selection → Designer Flow

This plan shifts the flow so that **vendors list blank products** (garments), **users pick a product from the marketplace**, then **design on it** in the designer tool. Designs are saved to the user's profile for reordering — not published to the marketplace.

---

### What Changes

**1. New DB table: `vendor_products`**
Vendor-listed blank garments with properties (colors, sizes, description, image). Separate from the existing `products` table (which stores user designs).

```
vendor_products:
  id, vendor_id, name, image_url, colors (jsonb), sizes (jsonb),
  description, base_price, is_active, created_at
```

RLS: public read, vendor_printer can insert/update their own.

**2. Admin/Vendor: "List Product" section in Printer Dashboard**
Add a simple form in `PrinterDashboard.tsx` for vendors to create/manage their blank garment listings (name, image, colors array, sizes array, description, base price).

**3. Homepage (Marketplace.tsx) — light update**
- Add a subtle CSS animation in the hero section (a simple rotating/sliding mockup of a designed t-shirt using keyframes — no new deps)
- Change "Start Designing" CTA to navigate to `/marketplace` (the product selection page)
- Remove the "Published Designs" grid from homepage (or keep as secondary section)

**4. New route: `/marketplace` — Product Selection Page**
- New page `src/pages/ProductSelection.tsx`
- Fetches `vendor_products` where `is_active = true`
- Displays grid of blank garments with name, image, available colors, sizes, base price
- Each card has a "Start Designing" button
- On click: stores selected product info in designerStore and navigates to `/designer`

**5. Designer Store — extend with selected product**
Add to `designerStore.ts`:
- `selectedProduct: { id, name, colors, sizes, basePrice } | null`
- `selectedSize: string | null`
- `setSelectedProduct()`, `setSelectedSize()`
- Garment color picker already exists — reuse it with the product's available colors

**6. Designer — "Save to Profile" instead of "Publish"**
- Rename `SaveProductDialog` to save the design privately to the user's profile
- Change `is_published: false` (private save for reordering)
- Add "Add to Cart" button alongside "Save" — this adds the designed product directly to cart with selected size/color/design data
- Dialog text: "Save Design" instead of "Publish Design"

**7. Designer Preview — Simple 3D mannequin**
- Install `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@>=0.133`
- When mode is `preview`, replace the flat SVG with a simple 3D scene:
  - A basic torso/mannequin shape using drei primitives (RoundedBox or custom geometry)
  - Apply the garment color as material
  - Overlay design as a texture (canvas-generated from current elements)
  - Slow auto-rotation via `useFrame`
- Falls back to flat SVG if WebGL unavailable

**8. Cart update**
- Cart items from designer include `designData` (element JSON) and `imageUrl` (preview) for the vendor to print
- Cart already persists via Zustand — just extend `CartItem` with optional `designData` and `previewUrl` fields

---

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `vendor_products` table with RLS |
| `src/pages/ProductSelection.tsx` | New: vendor product grid with "Start Designing" |
| `src/pages/Marketplace.tsx` | Light hero animation, CTA → `/marketplace` |
| `src/store/designerStore.ts` | Add `selectedProduct`, `selectedSize` state |
| `src/components/designer/SaveProductDialog.tsx` | Save privately + "Add to Cart" option |
| `src/components/designer/DesignCanvas.tsx` | Show 3D preview when mode === 'preview' |
| `src/components/designer/MannequinPreview.tsx` | New: React Three Fiber 3D mannequin scene |
| `src/pages/vendor/PrinterDashboard.tsx` | Add "My Products" tab for listing garments |
| `src/store/cartStore.ts` | Extend CartItem with `designData`, `previewUrl` |
| `src/App.tsx` | Add `/marketplace` route |

### Implementation Order

1. DB migration for `vendor_products`
2. Extend designerStore + cartStore
3. ProductSelection page + route
4. Homepage hero animation update
5. Vendor product listing UI in PrinterDashboard
6. SaveProductDialog → private save + add-to-cart
7. 3D mannequin preview component

