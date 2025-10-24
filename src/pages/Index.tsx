import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <ShoppingCart className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-4xl font-bold">Quick Mart</h1>
        <p className="text-xl text-muted-foreground">Your Grocery Shopping Experience</p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/admin/login">Admin Panel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
