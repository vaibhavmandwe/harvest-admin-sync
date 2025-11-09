import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderTimeline } from "./OrderTimeline";
import { OrderItemsList } from "./OrderItemsList";
import { OrderActions } from "./OrderActions";
import { Loader2, Mail, Phone, MapPin, Package, CreditCard, FileText } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { RefundModal } from "./RefundModal";
import { StatusChangeModal } from "./StatusChangeModal";

interface OrderDetailDrawerProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDrawer({ orderId, open, onOpenChange }: OrderDetailDrawerProps) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
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
      
      if (error) throw error;
      return data;
    },
    enabled: !!orderId && open,
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

  const calculateOrderTotals = () => {
    if (!order?.order_items) return { subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 };
    
    const subtotal = order.order_items.reduce(
      (sum: number, item: any) => sum + (item.unit_price * item.qty),
      0
    );
    
    // Get from metadata or calculate
    const metadata = order.metadata as any || {};
    const tax = metadata.tax || 0;
    const shipping = metadata.shipping_charge || 0;
    const discount = metadata.discount || 0;
    
    return {
      subtotal: Number(subtotal),
      tax: Number(tax),
      shipping: Number(shipping),
      discount: Number(discount),
      total: Number(order.amount),
    };
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] max-w-3xl mx-auto">
          <DrawerHeader className="border-b">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-muted-foreground">Loading order details...</span>
              </div>
            ) : order ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DrawerTitle>Order #{order.id.slice(0, 8).toUpperCase()}</DrawerTitle>
                  <Badge className={getStatusColor(order.status)} variant="outline">
                    {order.status}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">${Number(order.amount).toFixed(2)}</div>
              </div>
            ) : null}
          </DrawerHeader>

          <div className="overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : order ? (
              <>
                {/* Customer Information */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Customer Information
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.profiles?.full_name || order.profiles?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">Customer ID: {order.user_id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <a href={`mailto:${order.profiles?.email}`} className="text-sm flex items-center gap-2 text-primary hover:underline">
                        <Mail className="h-3 w-3" />
                        {order.profiles?.email}
                      </a>
                      {order.profiles?.phone && (
                        <a href={`tel:${order.profiles.phone}`} className="text-sm flex items-center gap-2 text-primary hover:underline">
                          <Phone className="h-3 w-3" />
                          {order.profiles.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </section>

                {/* Order Timeline */}
                <section>
                  <h3 className="text-lg font-semibold mb-3">Order Timeline</h3>
                  <OrderTimeline 
                    status={order.status} 
                    createdAt={order.created_at}
                    updatedAt={order.updated_at}
                    metadata={order.metadata as any}
                  />
                </section>

                {/* Order Items */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Items ({order.order_items?.length || 0})
                  </h3>
                  <OrderItemsList items={order.order_items || []} />
                </section>

                {/* Order Summary */}
                <section>
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    {(() => {
                      const totals = calculateOrderTotals();
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>${totals.subtotal.toFixed(2)}</span>
                          </div>
                          {totals.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Discount</span>
                              <span>-${totals.discount.toFixed(2)}</span>
                            </div>
                          )}
                          {totals.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Tax</span>
                              <span>${totals.tax.toFixed(2)}</span>
                            </div>
                          )}
                          {totals.shipping > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Shipping</span>
                              <span>${totals.shipping.toFixed(2)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Grand Total</span>
                            <span>${totals.total.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>

                {/* Payment Information */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Details
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium uppercase">{order.payment_method}</span>
                    </div>
                    {order.transactions && order.transactions.length > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Payment ID</span>
                          <span className="font-mono text-xs">{order.transactions[0].id.slice(0, 12)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Payment Status</span>
                          <Badge variant={order.transactions[0].status === 'completed' ? 'default' : 'secondary'}>
                            {order.transactions[0].status}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Shipping Information */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Information
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Shipping Address</p>
                      {(() => {
                        const addr = order.shipping_address as any;
                        return (
                          <p className="text-sm text-muted-foreground">
                            {addr?.street}, {addr?.city}, {addr?.state} {addr?.zip}<br />
                            {addr?.country || 'India'}
                          </p>
                        );
                      })()}
                    </div>
                    {order.delivery_slot && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Slot</span>
                        <span>{order.delivery_slot}</span>
                      </div>
                    )}
                    {(order.metadata as any)?.tracking_number && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tracking Number</span>
                        <a 
                          href={`#track/${(order.metadata as any).tracking_number}`}
                          className="text-primary hover:underline font-mono"
                        >
                          {(order.metadata as any).tracking_number}
                        </a>
                      </div>
                    )}
                  </div>
                </section>

                {/* Admin Notes */}
                {(order.metadata as any)?.admin_notes && (
                  <section>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Admin Notes
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">{(order.metadata as any).admin_notes}</p>
                    </div>
                  </section>
                )}

                {/* Order Metadata */}
                <section>
                  <p className="text-xs text-muted-foreground">
                    Order placed on {format(new Date(order.created_at), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </section>

                {/* Admin Actions */}
                <OrderActions 
                  order={order}
                  onStatusChange={() => setShowStatusModal(true)}
                  onRefund={() => setShowRefundModal(true)}
                />
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Order not found
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {order && (
        <>
          <StatusChangeModal
            open={showStatusModal}
            onOpenChange={setShowStatusModal}
            order={order}
          />
          <RefundModal
            open={showRefundModal}
            onOpenChange={setShowRefundModal}
            order={order}
          />
        </>
      )}
    </>
  );
}
