import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, Home, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function FindHouse() {
  const [, navigate] = useLocation();

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Find House</h1>
            <p className="text-muted-foreground mt-1">Search for rental properties or properties for sale.</p>
          </div>
        </div>

        <div className="flex justify-center gap-6 py-8">
          <div
            onClick={() => navigate("/search?type=rental")}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-8 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all w-64 h-40"
            data-testid="button-rental-property"
          >
            <Building2 className="mb-3 h-12 w-12 text-blue-500" />
            <span className="text-xl font-semibold">Rental Property</span>
            <span className="text-sm text-muted-foreground mt-1">Short-term vacation rentals</span>
          </div>
          
          <div
            onClick={() => navigate("/search?type=sale")}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-8 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all w-64 h-40"
            data-testid="button-property-for-sale"
          >
            <Home className="mb-3 h-12 w-12 text-green-500" />
            <span className="text-xl font-semibold">Property For Sale</span>
            <span className="text-sm text-muted-foreground mt-1">List property for purchase</span>
          </div>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Profiles
            </CardTitle>
            <CardDescription>Your saved and active search profiles (continuous searches)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>No saved searches yet.</p>
              <p className="text-sm mt-2">Your saved search profiles will appear here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
