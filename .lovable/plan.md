

## Plan: Full-Stack Marketplace with Vendor System

This plan adds a Supabase-powered backend to turn the designer tool into a marketplace with automated order routing to two vendor types.

### Architecture

```text
Customer (Marketplace)          Vendor 1 (Printer)         Vendor 2 (Delivery)
  ┌─────────────────┐          ┌──────────────┐           ┌──────────────┐
  │ Designer Tool    │          │ Dashboard    │           │ Dashboard    │
  │ Product Catalog  │──order──▶│ View orders  │──done────▶│ Pickup jobs  │
  │ Cart & Checkout  │          │ Mark printed │           │ Mark delivered│
  └─────────────────┘          └──────────────┘           └──────────────┘
         │                            │                          │
         └────────────────────────────┴──────────────────────────┘
                              Supabase Backend
                         (Auth, DB, Edge Functions)
```

### Database Tables (via Supabase migrations)

1. **profiles** - user info (name, avatar, phone)
2. **user_roles** - role enum: `customer`, `vendor_printer`, `vendor_delivery`, `admin`
3. **products** - saved designs (design JSON, garment type, colors, pricing)
4. **orders** - customer orders with status workflow: `pending` → `printing` → `ready_for_pickup` → `in_delivery` → `delivered`
5. **order_items** - line items linking orders to products with quantity/size
6. **vendor_assignments** - maps orders to vendor 1 (printer) and vendor 2 (delivery) with acceptance status

### Auth & Roles

- Email/password auth via Lovable Cloud
- Role-based access using `user_roles` table with `has_role()` security definer function
- Separate login redirects based on role (customer → marketplace, vendor → dashboard, admin → ERP)
- RLS on all tables

### Pages to Build

| Route | Purpose |
|-------|---------|
| `/` | Landing/marketplace (product catalog) |
| `/designer` | Current designer tool (move from `/`) |
| `/login` | Auth page (login/signup) |
| `/cart` | Shopping cart & checkout |
| `/orders` | Customer order history |
| `/vendor/printer` | Vendor 1 dashboard - incoming print orders, mark as done |
| `/vendor/delivery` | Vendor 2 dashboard - pickup/delivery jobs, mark as delivered |
| `/admin` | Admin ERP panel - all orders, vendors, analytics |

### Order Flow (automated via edge functions)

1. Customer designs product → saves → adds to cart → places order
2. Edge function auto-assigns order to available Vendor 1 (printer)
3. Vendor 1 sees order in dashboard, prints, marks "ready for pickup"
4. Status change triggers assignment to Vendor 2 (delivery)
5. Vendor 2 picks up, delivers, marks "delivered"
6. Customer sees real-time status updates

### Key Components

- **Vendor Dashboard**: Order list with status filters, order detail with design preview, action buttons
- **Admin ERP Panel**: Overview stats, vendor management, order tracking table
- **Product Catalog**: Grid of saved designs with pricing, add-to-cart
- **Cart/Checkout**: Simple order form (no payment for now)

### Implementation Order

1. Set up Supabase tables, RLS, and roles
2. Build auth pages with role-based routing
3. Move designer to `/designer`, build marketplace landing at `/`
4. Build product save/catalog system
5. Build cart and checkout flow
6. Build Vendor 1 (printer) dashboard
7. Build Vendor 2 (delivery) dashboard
8. Build admin ERP panel
9. Create edge function for order routing automation

### Technical Notes

- All design data stored as JSON in the products table
- Garment mockup images generated client-side for catalog display
- Real-time order updates using Supabase subscriptions
- No payment integration for now (order placement only)

