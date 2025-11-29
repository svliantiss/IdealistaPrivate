import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search as SearchIcon, MapPin, Calendar, Filter, Heart, Share2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Search() {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>("all");
  
  const { data: properties = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/properties', { location, propertyType: propertyType === 'all' ? undefined : propertyType, status: 'active' }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      if (propertyType && propertyType !== 'all') params.append('propertyType', propertyType);
      params.append('status', 'active');
      
      const response = await fetch(`/api/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] flex-col">
        {/* Search Header */}
        <div className="bg-white border-b border-border p-6 shadow-sm z-10 sticky top-0">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="City, neighborhood..." 
                    className="pl-9 bg-slate-50 border-slate-200"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    data-testid="input-location"
                  />
                </div>
              </div>
              
              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Dates</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Select dates" className="pl-9 bg-slate-50 border-slate-200" data-testid="input-dates" />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Type</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="select-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex items-end">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium" data-testid="button-search">
                  <SearchIcon className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </div>
          </div>
          
          {/* Active Filters Row */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            <Button variant="outline" size="sm" className="h-8 border-dashed text-muted-foreground">
              <Filter className="mr-2 h-3 w-3" /> More Filters
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              Found <strong data-testid="text-result-count">{properties.length}</strong> results
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content - Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            {isLoading ? (
              <div className="text-center py-12">Loading properties...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property: any) => (
                  <div key={property.id} className="group bg-white rounded-lg border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden" data-testid={`card-property-${property.id}`}>
                    {/* Image Carousel Placeholder */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={property.images?.[0] || '/placeholder.jpg'} 
                        alt={property.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 text-slate-900 hover:bg-white hover:text-red-500 shadow-sm">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm shadow-sm border-0 capitalize">
                          {property.propertyType}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agent listing</div>
                        <div className="flex items-center text-amber-500 text-xs font-bold">
                          ★ 4.9
                        </div>
                      </div>
                      
                      <h3 className="font-serif text-lg font-bold text-primary mb-1 line-clamp-1 group-hover:text-secondary transition-colors" data-testid={`text-title-${property.id}`}>
                        {property.title}
                      </h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-4">
                        <MapPin className="h-3 w-3 mr-1" />
                        {property.location}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{property.beds}</span> <span className="text-muted-foreground text-xs">Beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{property.baths}</span> <span className="text-muted-foreground text-xs">Baths</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{property.sqm}</span> <span className="text-muted-foreground text-xs">m²</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-primary" data-testid={`text-price-${property.id}`}>€{property.price}</span>
                          <span className="text-muted-foreground text-sm">/night</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="h-8 bg-primary text-white hover:bg-primary/90" data-testid={`button-details-${property.id}`}>
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
