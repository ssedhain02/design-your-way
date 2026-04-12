

## Plan: Wire Up the Full Marketplace Flow

The backend schema and pages exist but are mostly disconnected. This plan wires everything together: designer saves to DB, marketplace displays real products, cart/checkout auto-routes orders, and vendor dashboards handle the workflow.

### What will be built

**1. Designer "Save & Publish" flow**
- Add a save dialog to the designer (triggered by the "Save product" button) with fields: title, description, price
- On save, capture the current design elements as JSON + garment color/type, generate a canvas-based preview image, upload preview to a Supabase storage bucket, and insert a row into `products` with `is_published = true`
- Requires creating a `product-images` storage bucket with public read access
- User must be logged in to save; redirect to `/login` if not

**2. Marketplace product cards with real previews**
- Update `ProductCard` to show the uploaded preview image instead of the emoji placeholder
- Add size selector (S/M/L/XL/XXL) before adding to cart
- Show garment type badge on cards

**3. Cart checkout auto-routing**
- After placing an order in `Cart.tsx`, automatically invoke the `route-order` edge function to assign to a printer vendor
- Update the edge function to be callable by the order owner (not just admins) for the `assign_printer` action on their own order, OR use a database trigger instead
- Simpler approach: use a DB trigger on `orders` INSERT to auto-assign to a printer vendor, removing the need for the edge function call from the client

**4. Printer Dashboard enhancements**
- Show design preview image in the order card
- Show order items detail (sizes, quantities)
- When printer marks "Ready for Pickup", auto-trigger delivery assignment (via edge function call or DB trigger)

**5. Delivery Dashboard enhancements**
- Auto-assignment when printer marks order as ready (extend the edge function or add a DB trigger on `orders` UPDATE where status changes to `ready_for_pickup`)
- Show shipping address prominently, design preview

**6. Admin ERP improvements**
- Add role assignment UI (dropdown to add/remove roles for users)
- Show product management tab
- Revenue chart placeholder

### Database changes

- Create storage bucket `product-images` with public read policy
- Create a DB trigger: on `orders` INSERT, auto-insert a `vendor_assignments` row for `vendor_printer` (picks first available printer)
- Create a DB trigger: on `orders` UPDATE to `ready_for_pickup`, auto-insert `vendor_assignments` row for `vendor_delivery`
- Enable realtime on `orders` and `vendor_assignments` tables

### Files to create/modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add save dialog with title/description/price, canvas preview generation, storage upload, product insert |
| `src/pages/Marketplace.tsx` | Real image previews, size selector on product cards |
| `src/pages/Cart.tsx` | Size display fix, no manual routing needed (DB trigger handles it) |
| `src/pages/Orders.tsx` | Add order status timeline visualization |
| `src/pages/vendor/PrinterDashboard.tsx` | Design preview images, auto-trigger delivery on "ready" |
| `src/pages/vendor/DeliveryDashboard.tsx` | Design preview, shipping address emphasis |
| `src/pages/Admin.tsx` | Role assignment dropdown, products tab |
| `src/components/designer/SaveProductDialog.tsx` | New: modal for saving designs as products |
| Migration SQL | Storage bucket, DB triggers for auto-routing |

### Implementation order

1. Storage bucket + migration for auto-routing triggers
2. SaveProductDialog component + wire into designer
3. Marketplace with real images and size selector
4. Auto-routing on order placement (via DB triggers)
5. Enhance vendor dashboards with previews and auto-assignment
6. Admin role management UI

