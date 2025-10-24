import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface InventoryTableProps {
  inventory: any[];
  isLoading: boolean;
}

export function InventoryTable({ inventory, isLoading }: InventoryTableProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const updateMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase
        .from("inventory")
        .update({ stock })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock updated!");
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update stock");
    },
  });

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.stock.toString());
  };

  const handleSave = (id: string) => {
    const stock = parseInt(editValue);
    if (!isNaN(stock) && stock >= 0) {
      updateMutation.mutate({ id, stock });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  if (!inventory.length) {
    return <div className="text-center py-8 text-muted-foreground">No inventory data found</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Reorder Threshold</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map((item) => {
          const isLowStock = item.stock <= item.reorder_threshold;
          const isEditing = editingId === item.id;

          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.products?.name || "N/A"}</TableCell>
              <TableCell>{item.products?.sku}</TableCell>
              <TableCell>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20"
                    autoFocus
                  />
                ) : (
                  item.stock
                )}
              </TableCell>
              <TableCell>{item.reorder_threshold}</TableCell>
              <TableCell>
                <Badge variant={isLowStock ? "destructive" : "default"}>
                  {isLowStock ? "Low Stock" : "In Stock"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {isEditing ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(item.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}