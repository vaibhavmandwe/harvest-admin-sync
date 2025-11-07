# Harvest Hub - Orders API Contract & Implementation Guide

## 1. UI/UX Layout Description

### Desktop View
- **Main Orders Table**: Full-width table with search bar and status filter at the top
- **Click to View**: Clicking any row opens a right-side drawer (max-width: 768px) sliding from the right
- **Drawer Sections** (scrollable):
  - Header: Order ID (large), status badge, grand total (right-aligned)
  - Customer Information: Name, email (clickable), phone (clickable), customer ID
  - Timeline: Vertical progress bar showing order status progression with timestamps
  - Order Items: Collapsible list with thumbnails, product details, quantities, and prices
  - Order Summary: Subtotal, discounts, taxes, shipping, grand total
  - Payment Details: Method, payment ID, status badge
  - Shipping Information: Full address, delivery slot, tracking number (if available)
  - Admin Notes (if any)
  - Action Buttons: Update Status, Issue Refund, Download Invoice, etc.

### Mobile View (< 768px)
- Orders table becomes vertically stacked cards
- Drawer becomes full-screen modal
- All sections remain but optimized for mobile scrolling
- Action buttons stack vertically

### Microcopy Examples
- "Need to contact customer? We've pre-filled a quick message."
- "Loading order details..."
- "Order confirmation email sent!"
- "This order has already been fully refunded."
- "Allowed transitions: processing, cancelled"

---

## 2. React Component Structure

### Component Tree
```
OrdersPage
├── Search & Filter Controls
├── OrdersTable
│   └── OrderRow (clickable)
└── OrderDetailDrawer
    ├── OrderDetailHeader
    ├── CustomerInfoSection
    ├── OrderTimeline
    ├── OrderItemsList
    │   └── OrderItemCard
    ├── OrderSummarySection
    ├── PaymentSection
    ├── ShippingSection
    ├── AdminNotesSection (conditional)
    ├── OrderActions
    │   ├── StatusChangeModal
    │   └── RefundModal
```

### Key Component: OrderDetailDrawer (Skeleton)

```tsx
interface OrderDetailDrawerProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDrawer({ orderId, open, onOpenChange }: OrderDetailDrawerProps) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId && open,
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] max-w-3xl mx-auto">
        <DrawerHeader>
          <OrderDetailHeader order={order} />
        </DrawerHeader>
        
        <div className="overflow-y-auto p-6 space-y-6">
          <CustomerInfoSection customer={order?.customer} />
          <OrderTimeline status={order?.status} history={order?.statusHistory} />
          <OrderItemsList items={order?.items} />
          <OrderSummarySection totals={order?.totals} />
          <PaymentSection payment={order?.payment} />
          <ShippingSection shipping={order?.shipping} />
          {order?.adminNotes && <AdminNotesSection notes={order.adminNotes} />}
          <OrderActions order={order} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

---

## 3. API Contract

### A. GET /api/admin/orders (List Orders)

**Query Parameters:**
- `limit` (optional, default: 20): Number of records per page
- `page` (optional, default: 1): Page number
- `search` (optional): Search by order ID, customer name, or email
- `status` (optional): Filter by order status

**Request Example:**
```
GET /api/admin/orders?limit=20&page=1&search=john&status=processing
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "amount": 125.50,
      "status": "processing",
      "payment_method": "credit_card",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

---

### B. GET /api/admin/orders/{orderId} (Order Detail)

**Request Example:**
```
GET /api/admin/orders/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T14:20:00Z",
  "status": "shipped",
  "customer": {
    "id": "user-123",
    "name": "John Doe",
    "full_name": "John Michael Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123"
  },
  "items": [
    {
      "id": "item-1",
      "product_id": "prod-456",
      "product_name": "Organic Tomatoes",
      "sku": "ORG-TOM-500",
      "thumbnail": "https://storage.example.com/products/tomatoes.jpg",
      "variant": {
        "size": "500g",
        "type": "organic"
      },
      "quantity": 3,
      "unit": "kg",
      "unit_price": 5.99,
      "subtotal": 17.97
    },
    {
      "id": "item-2",
      "product_id": "prod-789",
      "product_name": "Fresh Basil",
      "sku": "HERB-BAS-100",
      "thumbnail": "https://storage.example.com/products/basil.jpg",
      "variant": null,
      "quantity": 2,
      "unit": "bunch",
      "unit_price": 2.50,
      "subtotal": 5.00
    }
  ],
  "totals": {
    "subtotal": 22.97,
    "discount": 2.00,
    "tax": 1.88,
    "shipping": 5.00,
    "grand_total": 27.85
  },
  "payment": {
    "method": "credit_card",
    "payment_id": "pay_1A2B3C4D5E6F",
    "status": "paid",
    "paid_at": "2025-01-15T10:32:15Z",
    "gateway_response": {
      "card_last4": "4242",
      "card_brand": "visa"
    }
  },
  "shipping": {
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "country": "USA"
    },
    "billing_address": null,
    "delivery_slot": "2025-01-16 14:00-16:00",
    "tracking_number": "1Z999AA10123456784",
    "estimated_delivery": "2025-01-16T15:00:00Z",
    "delivery_partner": "UPS"
  },
  "status_history": {
    "pending": "2025-01-15T10:30:00Z",
    "processing": "2025-01-15T11:00:00Z",
    "packed": "2025-01-15T13:00:00Z",
    "shipped": "2025-01-15T14:20:00Z"
  },
  "refund_info": {
    "total_refunded": 0,
    "refundable_amount": 27.85,
    "refund_history": []
  },
  "metadata": {
    "admin_notes": "Customer requested early delivery",
    "customer_message": "Please leave at doorstep"
  }
}
```

---

### C. PATCH /api/admin/orders/{orderId}/status

**Request Body:**
```json
{
  "status": "shipped",
  "reason": "Package handed to delivery partner"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "shipped",
    "updated_at": "2025-01-15T14:20:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid status transition",
  "message": "Cannot transition from delivered to processing",
  "allowed_transitions": ["cancelled"]
}
```

---

### D. POST /api/admin/orders/{orderId}/refund

**Request Body:**
```json
{
  "amount": 15.50,
  "reason": "Customer reported damaged tomatoes",
  "items": ["item-1"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "refund": {
    "id": "refund-xyz",
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 15.50,
    "status": "completed",
    "processed_at": "2025-01-15T16:00:00Z"
  },
  "order": {
    "total_refunded": 15.50,
    "refundable_amount": 12.35
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid refund amount",
  "message": "Refund amount exceeds refundable total",
  "refundable_amount": 12.35,
  "requested_amount": 15.50
}
```

---

## 4. Database Queries

### A. Fetch Orders List (SQL)

```sql
SELECT 
  o.id,
  o.amount,
  o.status,
  o.payment_method,
  o.created_at,
  p.name AS customer_name,
  p.email AS customer_email
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.user_id
WHERE 
  (o.id ILIKE '%' || $search || '%' 
   OR p.name ILIKE '%' || $search || '%' 
   OR p.email ILIKE '%' || $search || '%')
  AND ($status = 'all' OR o.status = $status)
ORDER BY o.created_at DESC
LIMIT $limit OFFSET $offset;
```

### B. Fetch Order Detail (SQL with JOIN)

```sql
SELECT 
  o.*,
  p.name, p.email, p.phone, p.full_name,
  json_agg(
    json_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'product_name', pr.name,
      'sku', pr.sku,
      'images', pr.images,
      'unit', pr.unit,
      'quantity', oi.qty,
      'unit_price', oi.unit_price,
      'variant', oi.variant,
      'subtotal', oi.unit_price * oi.qty
    )
  ) AS items,
  (
    SELECT json_agg(
      json_build_object(
        'id', t.id,
        'amount', t.amount,
        'status', t.status,
        'method', t.method,
        'txn_at', t.txn_at
      )
    )
    FROM transactions t
    WHERE t.order_id = o.id
  ) AS transactions
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.user_id
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products pr ON pr.id = oi.product_id
WHERE o.id = $orderId
GROUP BY o.id, p.name, p.email, p.phone, p.full_name;
```

### C. Supabase TypeScript Query (ORM-style)

```typescript
const { data, error } = await supabase
  .from("orders")
  .select(`
    *,
    profiles!orders_user_id_fkey(name, email, phone, full_name),
    order_items(
      id,
      qty,
      unit_price,
      variant,
      products(id, name, sku, images, unit)
    ),
    transactions(id, amount, status, method, txn_at, gateway_response)
  `)
  .eq("id", orderId)
  .single();
```

---

## 5. Acceptance Criteria

### ✅ Order Detail View
- [ ] Admin can click any order row to open detail drawer
- [ ] Drawer displays all required fields: customer, items, payment, shipping, timeline
- [ ] Order timeline shows visual progress with timestamps
- [ ] Order items show thumbnail, name, SKU, variant, qty, prices
- [ ] Grand total matches sum of subtotal + tax + shipping - discount

### ✅ Status Management
- [ ] Admin can only change status along allowed transitions
- [ ] Forbidden transitions show error message
- [ ] Status changes are logged with timestamp and reason
- [ ] Cancellation requires a reason

### ✅ Refund Management
- [ ] Refund modal shows refundable amount (total - already refunded)
- [ ] Refund amount validation prevents exceeding refundable total
- [ ] Partial refunds are supported
- [ ] Full refund updates order status to "refunded"

### ✅ Mobile Responsiveness
- [ ] Drawer becomes full-screen on mobile (< 768px)
- [ ] All sections remain accessible and scrollable
- [ ] Action buttons stack vertically
- [ ] Table becomes card-based layout

### ✅ Performance
- [ ] Orders list loads in < 200ms (summary data only)
- [ ] Order detail loads on-demand (lazy load)
- [ ] Search and filters update instantly
- [ ] Real-time updates reflect immediately

---

## 6. Test Cases

### Test Case 1: View Normal Delivered Order (Happy Path)
**Scenario**: Admin views a completed order with all data present

**Steps**:
1. Navigate to Orders page
2. Click on order with status "delivered"
3. Drawer opens with full order details

**Expected**:
- ✅ All fields populated: customer info, items, payment, shipping
- ✅ Timeline shows all statuses: placed → confirmed → packed → shipped → delivered
- ✅ All timestamps present and chronological
- ✅ Status change and refund buttons disabled (order is delivered)
- ✅ Download invoice button functional

---

### Test Case 2: Partial Refund (Edge Case)
**Scenario**: Admin issues a partial refund for a $50 order that already has $20 refunded

**Steps**:
1. Open order with total $50, already refunded $20
2. Click "Issue Refund"
3. Enter amount: $25 (total would be $45)
4. Enter reason: "Damaged item"
5. Click "Process Refund"

**Expected**:
- ✅ Refund modal shows: Max refundable = $30
- ✅ Refund processes successfully
- ✅ Order shows total refunded: $45
- ✅ Refundable amount updates to: $5
- ✅ Order status remains "delivered" (not fully refunded)

**Edge Case Test**:
- Try refunding $35 (exceeds refundable)
- ✅ Shows error: "Refund amount cannot exceed $30.00"

---

### Test Case 3: Forbidden Status Transition (Error Case)
**Scenario**: Admin attempts invalid status change

**Steps**:
1. Open order with status "delivered"
2. Click "Update Status"
3. Attempt to change to "processing"

**Expected**:
- ✅ Status change modal shows: "This order is in a terminal state (delivered). Status cannot be changed."
- ✅ Update button is disabled
- ✅ Modal shows allowed transitions: [] (empty)

**Additional Edge Case**:
- Order status "shipped"
- Try changing to "pending"
- ✅ Error: "Cannot transition from shipped to pending"
- ✅ Shows allowed transitions: "delivered, cancelled"

---

## Accessibility Notes

- All buttons have ARIA labels
- Drawer is keyboard-navigable (Tab, Escape to close)
- Focus trap within drawer when open
- Status badges use semantic colors with sufficient contrast
- Clickable elements have clear hover/focus states

---

## Security Notes

- Role-based access control enforced (admin roles only)
- CSRF protection on all POST/PATCH endpoints
- Input validation on refund amounts and status transitions
- Audit logging for all status changes and refunds
