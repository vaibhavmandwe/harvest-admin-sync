import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function RefundModal({ open, onOpenChange, order }: RefundModalProps) {
  const [refundAmount, setRefundAmount] = useState(order?.amount || "0");
  const [refundReason, setRefundReason] = useState("");
  const queryClient = useQueryClient();

  const maxRefundable = Number(order?.amount || 0) - (order?.metadata?.total_refunded || 0);

  const refundMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      if (amount > maxRefundable) {
        throw new Error(`Refund amount cannot exceed $${maxRefundable.toFixed(2)}`);
      }

      // Create refund transaction
      const { error: txnError } = await supabase.from("transactions").insert({
        order_id: order.id,
        amount: -amount,
        status: "refunded",
        method: order.payment_method,
        gateway_response: { reason, refunded_at: new Date().toISOString() },
      });

      if (txnError) throw txnError;

      // Update order metadata
      const totalRefunded = (order.metadata?.total_refunded || 0) + amount;
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: totalRefunded >= order.amount ? "refunded" : order.status,
          metadata: {
            ...order.metadata,
            total_refunded: totalRefunded,
            refund_history: [
              ...(order.metadata?.refund_history || []),
              {
                amount,
                reason,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        })
        .eq("id", order.id);

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] });
      toast.success("Refund processed successfully!");
      onOpenChange(false);
      setRefundAmount("0");
      setRefundReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process refund");
    },
  });

  const handleSubmit = () => {
    const amount = Number(refundAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    if (!refundReason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    if (amount > maxRefundable) {
      toast.error(`Refund amount cannot exceed $${maxRefundable.toFixed(2)}`);
      return;
    }

    refundMutation.mutate({ amount, reason: refundReason });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Refund</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Amount</span>
              <span className="font-medium">${Number(order?.amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Refunded</span>
              <span className="font-medium">${(order?.metadata?.total_refunded || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Maximum Refundable</span>
              <span className="text-primary">${maxRefundable.toFixed(2)}</span>
            </div>
          </div>

          {maxRefundable <= 0 && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-600">
                This order has already been fully refunded. No additional refunds can be issued.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund Amount ($)</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              min="0"
              max={maxRefundable}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              disabled={maxRefundable <= 0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason for Refund</Label>
            <Textarea
              id="refund-reason"
              placeholder="Please explain why this refund is being issued..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              disabled={maxRefundable <= 0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={refundMutation.isPending || maxRefundable <= 0}
          >
            {refundMutation.isPending ? "Processing..." : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
