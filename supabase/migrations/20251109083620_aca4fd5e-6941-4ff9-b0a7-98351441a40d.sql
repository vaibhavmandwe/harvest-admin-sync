-- Drop the existing check constraint that's causing the violation
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add updated check constraint with all allowed statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending', 
  'confirmed', 
  'processing', 
  'packed',
  'shipped', 
  'out_for_delivery',
  'delivered', 
  'cancelled',
  'returned',
  'refunded'
));

-- Ensure default status is 'pending' for new orders
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- Add comment for documentation
COMMENT ON COLUMN orders.status IS 'Order status: pending, confirmed, processing, packed, shipped, out_for_delivery, delivered, cancelled, returned, refunded';