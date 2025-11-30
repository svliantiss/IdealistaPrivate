import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MapPin, DollarSign, Bed, Bath, Maximize2, Image as ImageIcon, Plus, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const CURRENT_AGENT_ID = 1;

export default function Sales() {
  const [searchLocation, setSearchLocation] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");

  const { data: properties = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/sales-properties?status=active`],
    queryFn: async () => {
      const res = await fetch("/api/sales-properties?status=active");
      return res.json();
    },
  });

  const filteredProperties = properties.filter(p => {
    const matchesLocation = !searchLocation || p.location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesPrice = !maxPriceFilter || parseFloat(p.price) <= parseFloat(maxPriceFilter);
    return matchesLocation && matchesPrice;
  });

  return (
    <Layout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Properties for Sale</h1>
            <p className="text-muted-foreground mt-1">Browse and manage sales listings from agents</p>
          </div>
          <Link href="/sales/add">
            <Button className="bg-secondary hover:bg-secondary/90 gap-2" data-testid="button-add-sales-property">
              <Plus className="h-4 w-4" />
              List Property for Sale
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  data-testid="input-search-location"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Max price..."
                  type="number"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value)}
                  data-testid="input-max-price"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">No properties found matching your criteria</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer" data-testid={`card-property-${property.id}`}>
                {/* Property Image */}
                <div className="relative bg-gradient-to-br from-blue-100 to-emerald-100 h-48 flex items-center justify-center overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      data-testid={`img-property-${property.id}`}
                    />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                      <ImageIcon className="h-12 w-12" />
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-emerald-500">{property.propertyType}</Badge>
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-2">{property.title}</CardTitle>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    {property.location}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features Grid */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4 text-blue-500" />
                      <span data-testid={`text-beds-${property.id}`}>{property.beds} beds</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4 text-blue-500" />
                      <span data-testid={`text-baths-${property.id}`}>{property.baths} baths</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Maximize2 className="h-4 w-4 text-blue-500" />
                      <span data-testid={`text-sqm-${property.id}`}>{property.sqm} m²</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 pt-2 border-t">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <span className="text-2xl font-bold text-primary" data-testid={`text-price-${property.id}`}>
                      €{parseFloat(property.price).toLocaleString('es-ES')}
                    </span>
                  </div>

                  {/* CTA Button */}
                  <Link href={`/sales/${property.id}`}>
                    <Button className="w-full bg-sidebar hover:bg-sidebar/90" data-testid={`button-view-${property.id}`}>
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
