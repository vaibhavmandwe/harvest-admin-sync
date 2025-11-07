import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  onViewOrder: (orderId: string) => void;
}

export function OrdersTable({ orders, isLoading, onViewOrder }: OrdersTableProps) {

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (!orders.length) {
    return <div className="text-center py-8 text-muted-foreground">No orders found</div>;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      delivered: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status] || "bg-secondary";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow 
            key={order.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onViewOrder(order.id)}
          >
            <TableCell className="font-mono text-sm font-medium">
              #{order.id.slice(0, 8).toUpperCase()}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div className="font-medium">{order.profiles?.name || "N/A"}</div>
                <div className="text-muted-foreground text-xs">{order.profiles?.email}</div>
              </div>
            </TableCell>
            <TableCell className="font-semibold">${Number(order.amount).toFixed(2)}</TableCell>
            <TableCell className="uppercase text-sm">{order.payment_method}</TableCell>
            <TableCell>
              <Badge 
                variant="outline" 
                className={getStatusColor(order.status)}
              >
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOrder(order.id);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}