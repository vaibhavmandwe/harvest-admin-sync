import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface StatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function StatusChangeModal({ open, onOpenChange, order }: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState(order?.status || "pending");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  // All valid statuses - admin can change to any status
  const allStatuses = [
    "pending",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
    "refunded",
  ];

  const currentStatus = order?.status || "pending";
  const availableStatuses = allStatuses.filter(s => s !== currentStatus);

  const statusMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason: string }) => {
      if (!allStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const statusHistory = {
        ...(order.metadata?.status_history || {}),
        [status]: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("orders")
        .update({
          status,
          metadata: {
            ...order.metadata,
            status_history: statusHistory,
            status_changes: [
              ...(order.metadata?.status_changes || []),
              {
                from: currentStatus,
                to: status,
                reason,
                timestamp: new Date().toISOString(),
              },
            ],
            ...(status === "cancelled" && { cancellation_reason: reason }),
          },
        })
        .eq("id", order.id);

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: "ORDER_STATUS_UPDATED",
        entity: {
          order_id: order.id,
          from: currentStatus,
          to: status,
          reason,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] });
      toast.success("Order status updated successfully!");
      onOpenChange(false);
      setReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update order status");
    },
  });

  const handleSubmit = () => {
    if (newStatus === currentStatus) {
      toast.error("Please select a different status");
      return;
    }

    if (!allStatuses.includes(newStatus)) {
      toast.error(`Invalid status: ${newStatus}`);
      return;
    }

    if (!reason.trim() && (newStatus === "cancelled")) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    statusMutation.mutate({ status: newStatus, reason });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Order Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Current Status:</span>{" "}
              <span className="font-medium capitalize">{currentStatus.replace(/_/g, " ")}</span>
            </p>
          </div>

          {availableStatuses.length === 0 ? (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-600">
                No other statuses available.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="new-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select any status to update the order
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-reason">
                  Reason {newStatus === "cancelled" && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="status-reason"
                  placeholder="Explain why the status is being changed..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={statusMutation.isPending || availableStatuses.length === 0}
          >
            {statusMutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
