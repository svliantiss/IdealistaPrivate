import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CURRENT_AGENT_ID = 1;

export default function SoldHouses() {
  const { data: salesProperties = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}/sales-properties`],
  });

  const soldHouses = salesProperties.filter((p: any) => p.status === 'sold');

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading sold houses...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Sold Houses</h1>
            <p className="text-muted-foreground mt-1">Your successfully sold properties.</p>
          </div>
        </div>

        <div className="space-y-4">
          {soldHouses.map((property: any) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-sold-house-${property.id}`}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto relative">
                    <img 
                      src={property.images?.[0] || '/placeholder.jpg'} 
                      alt={property.title}
                      className="object-cover w-full h-full" 
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-600">Sold</Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-primary mb-1" data-testid={`text-title-${property.id}`}>{property.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{property.location}</p>
                      <p className="text-sm text-foreground mb-4 line-clamp-2">{property.description}</p>
                      
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Sale Price</span>
                          <span className="font-semibold" data-testid={`text-price-${property.id}`}>€{property.price}</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Type</span>
                          <span className="font-semibold capitalize">{property.propertyType}</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Beds / Baths</span>
                          <span className="font-semibold">{property.beds} / {property.baths}</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Area</span>
                          <span className="font-semibold">{property.sqm} m²</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2 justify-end text-xs text-muted-foreground">
                      <span>License: {property.licenseNumber}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {soldHouses.length === 0 && (
            <Card className="p-12 text-center">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-serif text-xl font-bold mb-2">No sold houses</h3>
              <p className="text-muted-foreground">You don't have any sold properties at the moment.</p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
