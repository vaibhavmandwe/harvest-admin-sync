import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomersTable } from "@/components/admin/CustomersTable";
import { CustomerDetailDrawer } from "@/components/admin/CustomerDetailDrawer";
import { Users, UserCheck, UserPlus, Repeat, Search, Loader2 } from "lucide-react";
import { subDays } from "date-fns";

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

type FilterType = "all" | "active" | "new" | "repeat";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch all profiles with role = customer
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch order aggregates per user
  const { data: orderAggregates, isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-order-aggregates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("user_id, amount, created_at");
      
      if (error) throw error;
      
      // Aggregate orders by user_id
      const aggregates: Record<string, { 
        total_orders: number; 
        total_spend: number; 
        last_order_date: string | null 
      }> = {};
      
      data?.forEach((order) => {
        if (!order.user_id) return;
        
        if (!aggregates[order.user_id]) {
          aggregates[order.user_id] = {
            total_orders: 0,
            total_spend: 0,
            last_order_date: null,
          };
        }
        
        aggregates[order.user_id].total_orders += 1;
        aggregates[order.user_id].total_spend += Number(order.amount) || 0;
        
        const orderDate = order.created_at;
        if (!aggregates[order.user_id].last_order_date || 
            orderDate > aggregates[order.user_id].last_order_date!) {
          aggregates[order.user_id].last_order_date = orderDate;
        }
      });
      
      return aggregates;
    },
  });

  // Combine profiles with order aggregates
  const customers: CustomerData[] = useMemo(() => {
    if (!profiles) return [];
    
    return profiles.map((profile) => ({
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      created_at: profile.created_at,
      total_orders: orderAggregates?.[profile.user_id]?.total_orders || 0,
      total_spend: orderAggregates?.[profile.user_id]?.total_spend || 0,
      last_order_date: orderAggregates?.[profile.user_id]?.last_order_date || null,
    }));
  }, [profiles, orderAggregates]);

  // Calculate stats
  const stats = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    
    return {
      total: customers.length,
      active: customers.filter((c) => c.total_orders > 0).length,
      new: customers.filter((c) => new Date(c.created_at) >= sevenDaysAgo).length,
      repeat: customers.filter((c) => c.total_orders >= 2).length,
    };
  }, [customers]);

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    let result = customers;
    
    // Apply filter
    const sevenDaysAgo = subDays(new Date(), 7);
    switch (activeFilter) {
      case "active":
        result = result.filter((c) => c.total_orders > 0);
        break;
      case "new":
        result = result.filter((c) => new Date(c.created_at) >= sevenDaysAgo);
        break;
      case "repeat":
        result = result.filter((c) => c.total_orders >= 2);
        break;
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) =>
        (c.name?.toLowerCase().includes(query)) ||
        (c.full_name?.toLowerCase().includes(query)) ||
        (c.email?.toLowerCase().includes(query)) ||
        (c.phone?.includes(query))
      );
    }
    
    return result;
  }, [customers, activeFilter, searchQuery]);

  const handleRowClick = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const isLoading = profilesLoading || ordersLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground">View all registered customers and their activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter("all")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "-" : stats.total}</div>
            <p className="text-xs text-muted-foreground">All registered customers</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter("active")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{isLoading ? "-" : stats.active}</div>
            <p className="text-xs text-muted-foreground">Customers with ≥1 order</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter("new")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{isLoading ? "-" : stats.new}</div>
            <p className="text-xs text-muted-foreground">Joined in last 7 days</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFilter("repeat")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
            <Repeat className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{isLoading ? "-" : stats.repeat}</div>
            <p className="text-xs text-muted-foreground">Customers with ≥2 orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <CardTitle>All Customers</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <div className="flex gap-1">
                {(["all", "active", "new", "repeat"] as FilterType[]).map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !filteredCustomers.length ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || activeFilter !== "all" 
                ? "No customers match your filters" 
                : "No customers found"}
            </div>
          ) : (
            <CustomersTable 
              customers={filteredCustomers} 
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
