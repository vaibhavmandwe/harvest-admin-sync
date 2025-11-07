import { format } from "date-fns";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export function OrderTimeline({ status, createdAt, updatedAt, metadata }: OrderTimelineProps) {
  const statuses = [
    { key: "pending", label: "Order Placed", icon: CheckCircle2 },
    { key: "processing", label: "Confirmed", icon: CheckCircle2 },
    { key: "packed", label: "Packed", icon: CheckCircle2 },
    { key: "shipped", label: "Shipped", icon: CheckCircle2 },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  const statusOrder = ["pending", "processing", "packed", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(status);
  const isCancelled = status === "cancelled";

  const getStatusTimestamp = (statusKey: string) => {
    if (statusKey === "pending") return createdAt;
    if (metadata?.status_history?.[statusKey]) return metadata.status_history[statusKey];
    return null;
  };

  return (
    <div className="relative">
      {isCancelled ? (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(updatedAt), "MMM dd, yyyy 'at' HH:mm")}
            </p>
            {metadata?.cancellation_reason && (
              <p className="text-sm text-muted-foreground mt-1">
                Reason: {metadata.cancellation_reason}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const timestamp = getStatusTimestamp(step.key);
            const Icon = isCompleted ? CheckCircle2 : Circle;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="relative flex flex-col items-center">
                  <Icon 
                    className={`h-5 w-5 flex-shrink-0 ${
                      isCompleted ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {index < statuses.length - 1 && (
                    <div 
                      className={`w-0.5 h-8 mt-1 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className={`font-medium ${
                    isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </p>
                  {timestamp && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(timestamp), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
