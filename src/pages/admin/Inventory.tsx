import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTable } from "@/components/admin/InventoryTable";

export default function Inventory() {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*, products(name, sku)")
        .order("stock", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  useRealtimeSubscription("inventory", ["inventory"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Monitor stock levels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryTable inventory={inventory || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}