import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Phone, User, ShoppingBag, Calendar, Package } from "lucide-react";
import { format } from "date-fns";

interface CustomerData {
  id: string;
  user_id: string;
  name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  total_orders: number;
  total_spend: number;
  last_order_date: string | null;
}

interface CustomerDetailDrawerProps {
  customer: CustomerData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDrawer({ customer, open, onOpenChange }: CustomerDetailDrawerProps) {
  const { data: recentOrders, isLoading } = useQuery({
    queryKey: ["customer-orders", customer?.user_id],
    queryFn: async () => {
      if (!customer?.user_id) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          amount,
          status,
          created_at,
          order_items(
            id,
            qty,
            products(name)
          )
        `)
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!customer?.user_id && open,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
      confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      processing: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      packed: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      out_for_delivery: "bg-violet-500/10 text-violet-500 border-violet-500/20",
      delivered: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
      returned: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      refunded: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    };
    return colors[status] || "bg-secondary";
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          {customer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DrawerTitle>{customer.full_name || customer.name || "N/A"}</DrawerTitle>
                  <p className="text-sm text-muted-foreground">Customer since {format(new Date(customer.created_at), "MMM yyyy")}</p>
                </div>
              </div>
              <Badge variant={customer.total_orders > 0 ? "default" : "secondary"}>
                {customer.total_orders > 0 ? "Active" : "Inactive"}
              </Badge>
            </div>
          ) : null}
        </DrawerHeader>

        <div className="overflow-y-auto p-6 space-y-6">
          {customer && (
            <>
              {/* Contact Information */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone || "No phone"}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined: {format(new Date(customer.created_at), "MMM dd, yyyy")}</span>
                  </div>
                </div>
              </section>

              {/* Order Statistics */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Order Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{customer.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">₹{customer.total_spend.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Total Spend</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">
                      {customer.total_orders > 0 ? `₹${(customer.total_spend / customer.total_orders).toFixed(0)}` : "₹0"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg. Order</p>
                  </div>
                </div>
              </section>

              {/* Recent Orders */}
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Recent Orders
                </h3>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : recentOrders && recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                          <Badge className={getStatusColor(order.status || 'pending')} variant="outline">
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(order.created_at), "MMM dd, yyyy")}
                          </span>
                          <span className="font-semibold">₹{Number(order.amount).toFixed(2)}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {order.order_items?.length || 0} item(s)
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
                    No orders yet
                  </div>
                )}
              </section>

              {/* Last Activity */}
              {customer.last_order_date && (
                <section>
                  <p className="text-xs text-muted-foreground">
                    Last order on {format(new Date(customer.last_order_date), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
