import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const CURRENT_AGENT_ID = 1;

export default function ActiveListings() {
  const [listingType, setListingType] = useState<'rentals' | 'sales'>('rentals');

  const { data: properties = [], isLoading: rentalLoading } = useQuery<any[]>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}/properties`],
  });

  const { data: salesProperties = [], isLoading: salesLoading } = useQuery<any[]>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}/sales-properties`],
  });

  const isLoading = rentalLoading || salesLoading;
  const activeRentals = properties.filter((p: any) => p.status === 'active').slice(0, 3);
  const activeSales = salesProperties.filter((p: any) => p.status !== 'sold').slice(0, 3);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading active listings...</div>
        </div>
      </Layout>
    );
  }

  const displayProperties = listingType === 'rentals' ? activeRentals : activeSales;
  const emptyMessage = listingType === 'rentals' 
    ? "You don't have any active rental listings at the moment."
    : "You don't have any active sales listings at the moment.";

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
            <h1 className="text-3xl font-serif font-bold text-primary">Active Listings</h1>
            <p className="text-muted-foreground mt-1">View your active rental and sales properties.</p>
          </div>
        </div>

        <div className="flex gap-3 border-b border-border">
          <Button
            variant={listingType === 'rentals' ? 'default' : 'ghost'}
            className={listingType === 'rentals' ? 'bg-sidebar text-white hover:bg-sidebar/90 border-b-2 rounded-none' : 'border-b-2 border-transparent rounded-none'}
            onClick={() => setListingType('rentals')}
            data-testid="button-rentals-tab"
          >
            <Building className="h-4 w-4 mr-2" />
            For Rent
          </Button>
          <Button
            variant={listingType === 'sales' ? 'default' : 'ghost'}
            className={listingType === 'sales' ? 'bg-sidebar text-white hover:bg-sidebar/90 border-b-2 rounded-none' : 'border-b-2 border-transparent rounded-none'}
            onClick={() => setListingType('sales')}
            data-testid="button-sales-tab"
          >
            <Home className="h-4 w-4 mr-2" />
            For Sale
          </Button>
        </div>

        <div className="space-y-4">
          {displayProperties.map((property: any) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-active-listing-${property.id}`}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto relative">
                    <img 
                      src={property.images?.[0] || '/placeholder.jpg'} 
                      alt={property.title}
                      className="object-cover w-full h-full" 
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={listingType === 'rentals' ? 'bg-emerald-500' : 'bg-blue-500'}>
                        {listingType === 'rentals' ? 'Active' : property.status === 'sold' ? 'Sold' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-primary mb-1" data-testid={`text-title-${property.id}`}>{property.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{property.location}</p>
                      <p className="text-sm text-foreground mb-4 line-clamp-2">{property.description}</p>
                      
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Price</span>
                          <span className="font-semibold" data-testid={`text-price-${property.id}`}>
                            €{parseFloat(property.price).toLocaleString()}{listingType === 'rentals' ? '/night' : ''}
                          </span>
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

          {displayProperties.length === 0 && (
            <Card className="p-12 text-center">
              {listingType === 'rentals' ? <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /> : <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />}
              <h3 className="font-serif text-xl font-bold mb-2">No {listingType === 'rentals' ? 'rental' : 'sales'} listings</h3>
              <p className="text-muted-foreground mb-6">{emptyMessage}</p>
              <Link href={listingType === 'rentals' ? '/properties' : '/sales'}>
                <Button className="bg-secondary hover:bg-secondary/90 text-white" data-testid="button-go-to-properties">
                  {listingType === 'rentals' ? 'View All Rentals' : 'View All Sales'}
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
