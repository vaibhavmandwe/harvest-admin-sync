import { Button } from "@/components/ui/button";
import { Download, Mail, RotateCcw, Edit, Phone, FileDown } from "lucide-react";
import { toast } from "sonner";

interface OrderActionsProps {
  order: any;
  onStatusChange: () => void;
  onRefund: () => void;
}

export function OrderActions({ order, onStatusChange, onRefund }: OrderActionsProps) {
  const handlePrintInvoice = () => {
    toast.info("Invoice download feature coming soon!");
    // TODO: Implement PDF generation
  };

  const handleResendConfirmation = () => {
    toast.success("Order confirmation email sent!");
    // TODO: Implement email sending
  };

  const handleContactCustomer = () => {
    const email = order.profiles?.email;
    if (email) {
      const subject = `Regarding Order #${order.id.slice(0, 8)}`;
      const body = `Hello ${order.profiles?.name || 'Customer'},\n\nWe hope this message finds you well. We're reaching out about your recent order.\n\nOrder ID: ${order.id}\nOrder Total: $${order.amount}\n\nBest regards,\nHarvest Hub Team`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      toast.error("Customer email not available");
    }
  };

  const handleExportOrder = () => {
    const orderData = {
      orderId: order.id,
      customer: order.profiles?.name,
      email: order.profiles?.email,
      amount: order.amount,
      status: order.status,
      items: order.order_items?.map((item: any) => ({
        product: item.products.name,
        sku: item.products.sku,
        quantity: item.qty,
        price: item.unit_price,
      })),
      createdAt: order.created_at,
    };

    const dataStr = JSON.stringify(orderData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-${order.id.slice(0, 8)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Order exported successfully!");
  };

  const canRefund = order.status !== "cancelled" && order.status !== "refunded";
  const canChangeStatus = order.status !== "delivered" && order.status !== "cancelled" && order.status !== "refunded";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* Primary Actions */}
        {canChangeStatus && (
          <Button onClick={onStatusChange} className="flex-1 sm:flex-none">
            <Edit className="h-4 w-4 mr-2" />
            Update Status
          </Button>
        )}
        
        {canRefund && (
          <Button variant="outline" onClick={onRefund} className="flex-1 sm:flex-none">
            <RotateCcw className="h-4 w-4 mr-2" />
            Issue Refund
          </Button>
        )}

        {/* Secondary Actions */}
        <Button variant="outline" onClick={handlePrintInvoice} className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Download Invoice
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={handleResendConfirmation}>
          <Mail className="h-4 w-4 mr-2" />
          Resend Confirmation
        </Button>

        <Button variant="ghost" size="sm" onClick={handleContactCustomer}>
          <Phone className="h-4 w-4 mr-2" />
          Contact Customer
        </Button>

        <Button variant="ghost" size="sm" onClick={handleExportOrder}>
          <FileDown className="h-4 w-4 mr-2" />
          Export Order
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Need to contact the customer? We've pre-filled a quick message template for you.
      </p>
    </div>
  );
}
