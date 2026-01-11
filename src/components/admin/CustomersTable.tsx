import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

interface CustomersTableProps {
  customers: CustomerData[];
  onRowClick: (customer: CustomerData) => void;
}

export function CustomersTable({ customers, onRowClick }: CustomersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-center">Total Orders</TableHead>
          <TableHead className="text-right">Total Spend</TableHead>
          <TableHead>Last Order</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow 
            key={customer.id} 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onRowClick(customer)}
          >
            <TableCell className="font-medium">
              {customer.full_name || customer.name || "N/A"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {customer.email || "N/A"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {customer.phone || "N/A"}
            </TableCell>
            <TableCell className="text-center">
              {customer.total_orders}
            </TableCell>
            <TableCell className="text-right font-medium">
              ₹{customer.total_spend.toFixed(2)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {customer.last_order_date 
                ? format(new Date(customer.last_order_date), "MMM dd, yyyy")
                : "Never"
              }
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={customer.total_orders > 0 ? "default" : "secondary"}>
                {customer.total_orders > 0 ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {format(new Date(customer.created_at), "MMM dd, yyyy")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
