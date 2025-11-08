import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  onViewOrder: (orderId: string) => void;
}

export function OrdersTable({ orders, isLoading, onViewOrder }: OrdersTableProps) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const order = orders.find(o => o.id === orderId);
      
      const statusHistory = {
        ...(order.metadata?.status_history || {}),
        [newStatus]: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          metadata: {
            ...order.metadata,
            status_history: statusHistory,
            status_changes: [
              ...(order.metadata?.status_changes || []),
              {
                from: order.status,
                to: newStatus,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        })
        .eq("id", orderId);

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: "ORDER_STATUS_UPDATED",
        entity: {
          order_id: orderId,
          from: order.status,
          to: newStatus,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update order status");
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    statusMutation.mutate({ orderId, newStatus });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (!orders.length) {
    return <div className="text-center py-8 text-muted-foreground">No orders found</div>;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      confirmed: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      packed: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      out_for_delivery: "bg-violet-500/10 text-violet-500 border-violet-500/20",
      delivered: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status] || "bg-secondary";
  };

  const allowedTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };
  const formatStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
                <div className="font-medium">{order.profiles?.name || order.shipping_address?.name || "N/A"}</div>
                <div className="text-muted-foreground text-xs">{order.profiles?.email || order.shipping_address?.email}</div>
              </div>
            </TableCell>
            <TableCell className="font-semibold">${Number(order.amount).toFixed(2)}</TableCell>
            <TableCell className="uppercase text-sm">{order.payment_method}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Select 
                value={order.status} 
                onValueChange={(value) => handleStatusChange(order.id, value)}
                disabled={statusMutation.isPending || order.status === "delivered" || order.status === "cancelled"}
              >
                <SelectTrigger className={`w-[160px] ${getStatusColor(order.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={order.status} disabled>
                    {formatStatus(order.status)}
                  </SelectItem>
                  {(allowedTransitions[order.status] || []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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