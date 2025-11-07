import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: string;
  qty: number;
  unit_price: number;
  variant?: any;
  products: {
    id: string;
    name: string;
    sku: string;
    images: string[];
    unit: string;
  };
}

interface OrderItemsListProps {
  items: OrderItem[];
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const itemTotal = item.unit_price * item.qty;
        const imageUrl = item.products.images?.[0] || "/placeholder.svg";

        return (
          <Card key={item.id} className="p-4">
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={item.products.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium truncate">{item.products.name}</h4>
                    <p className="text-sm text-muted-foreground">SKU: {item.products.sku}</p>
                    
                    {/* Variant Info */}
                    {item.variant && Object.keys(item.variant).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.variant).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-semibold">${itemTotal.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.unit_price.toFixed(2)} × {item.qty}
                    </p>
                  </div>
                </div>

                {/* Quantity & Unit */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    Qty: {item.qty} {item.products.unit}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No items in this order
        </div>
      )}
    </div>
  );
}
