import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [products, orders, customers] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const totalRevenue = orders.data?.reduce((sum, order) => sum + Number(order.amount || 0), 0) || 0;

      return {
        products: products.count || 0,
        orders: orders.data?.length || 0,
        customers: customers.count || 0,
        revenue: totalRevenue,
      };
    },
  });

  const statCards = [
    {
      title: "Total Products",
      value: stats?.products || 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Total Orders",
      value: stats?.orders || 0,
      icon: ShoppingCart,
      color: "text-green-600",
    },
    {
      title: "Total Customers",
      value: stats?.customers || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Total Revenue",
      value: `$${(stats?.revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}