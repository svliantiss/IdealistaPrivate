import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search as SearchIcon, MapPin, Calendar, Filter, Heart, Share2, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface AmenityFilter {
  id: string;
  label: string;
  checked: boolean;
  subFilters?: AmenityFilter[];
}

export default function Search() {
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minBeds, setMinBeds] = useState<string>("any");
  const [minBaths, setMinBaths] = useState<string>("any");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  
  const [amenityFilters, setAmenityFilters] = useState<AmenityFilter[]>([
    { 
      id: "pool", 
      label: "Pool", 
      checked: false,
      subFilters: [
        { id: "heated", label: "Heated Pool", checked: false }
      ]
    },
    { 
      id: "parking", 
      label: "Parking", 
      checked: false,
      subFilters: [
        { id: "garage", label: "Garage", checked: false },
        { id: "covered", label: "Covered Parking", checked: false }
      ]
    },
    { id: "wifi", label: "WiFi", checked: false },
    { id: "ac", label: "Air Conditioning", checked: false },
    { 
      id: "sea_view", 
      label: "Sea View", 
      checked: false,
      subFilters: [
        { id: "beachfront", label: "Beachfront", checked: false }
      ]
    },
    { id: "garden", label: "Garden", checked: false },
    { id: "bbq", label: "BBQ Area", checked: false },
    { id: "terrace", label: "Terrace", checked: false },
    { id: "gym", label: "Gym", checked: false },
    { id: "pets", label: "Pet Friendly", checked: false },
    { id: "security", label: "Security System", checked: false },
    { id: "elevator", label: "Elevator", checked: false },
  ]);

  const toggleAmenity = (id: string, isSubFilter: boolean = false, parentId?: string) => {
    setAmenityFilters(prev => prev.map(filter => {
      if (isSubFilter && parentId && filter.id === parentId) {
        return {
          ...filter,
          subFilters: filter.subFilters?.map(sub => 
            sub.id === id ? { ...sub, checked: !sub.checked } : sub
          )
        };
      }
      if (!isSubFilter && filter.id === id) {
        const newChecked = !filter.checked;
        return {
          ...filter,
          checked: newChecked,
          subFilters: newChecked ? filter.subFilters : filter.subFilters?.map(sub => ({ ...sub, checked: false }))
        };
      }
      return filter;
    }));
  };

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    amenityFilters.forEach(filter => {
      if (filter.checked) {
        filters.push(filter.label);
        filter.subFilters?.forEach(sub => {
          if (sub.checked) filters.push(sub.label);
        });
      }
    });
    if (minBeds !== "any") filters.push(`${minBeds}+ Beds`);
    if (minBaths !== "any") filters.push(`${minBaths}+ Baths`);
    if (minPrice) filters.push(`Min €${minPrice}`);
    if (maxPrice) filters.push(`Max €${maxPrice}`);
    return filters;
  }, [amenityFilters, minBeds, minBaths, minPrice, maxPrice]);

  const clearAllFilters = () => {
    setAmenityFilters(prev => prev.map(filter => ({
      ...filter,
      checked: false,
      subFilters: filter.subFilters?.map(sub => ({ ...sub, checked: false }))
    })));
    setMinBeds("any");
    setMinBaths("any");
    setMinPrice("");
    setMaxPrice("");
  };
  
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

  const { data: availabilities = [] } = useQuery<any[]>({
    queryKey: ['/api/property-availability'],
    queryFn: async () => {
      const response = await fetch('/api/property-availability');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const filteredProperties = useMemo(() => {
    return properties.filter((property: any) => {
      if (minBeds !== "any" && property.beds < parseInt(minBeds)) return false;
      if (minBaths !== "any" && property.baths < parseInt(minBaths)) return false;
      if (minPrice && parseFloat(property.price) < parseFloat(minPrice)) return false;
      if (maxPrice && parseFloat(property.price) > parseFloat(maxPrice)) return false;
      
      const selectedAmenities = amenityFilters
        .filter(f => f.checked)
        .map(f => f.label.toLowerCase());
      
      amenityFilters.forEach(filter => {
        if (filter.checked && filter.subFilters) {
          filter.subFilters.forEach(sub => {
            if (sub.checked) selectedAmenities.push(sub.label.toLowerCase());
          });
        }
      });
      
      if (selectedAmenities.length > 0) {
        const propertyAmenities = (property.amenities || []).map((a: string) => a.toLowerCase());
        const hasAllAmenities = selectedAmenities.every(amenity => 
          propertyAmenities.some((pa: string) => pa.includes(amenity.split(' ')[0]))
        );
        if (!hasAllAmenities) return false;
      }
      
      return true;
    });
  }, [properties, minBeds, minBaths, minPrice, maxPrice, amenityFilters]);

  const getPropertyAvailability = (propertyId: number) => {
    return availabilities.filter((a: any) => a.propertyId === propertyId);
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] flex-col">
        {/* Search Header */}
        <div className="bg-white border-b border-border p-6 shadow-sm z-10 sticky top-0">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
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
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Check-in</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-9 bg-slate-50 border-slate-200" 
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    data-testid="input-checkin" 
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-9 bg-slate-50 border-slate-200" 
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    data-testid="input-checkout" 
                  />
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
          
          {/* More Filters Button */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-8 border-dashed ${filtersOpen ? 'bg-primary text-white border-primary hover:bg-primary/90' : 'text-muted-foreground'}`}
                  data-testid="button-more-filters"
                >
                  <Filter className="mr-2 h-3 w-3" /> 
                  More Filters
                  {filtersOpen ? <ChevronUp className="ml-2 h-3 w-3" /> : <ChevronDown className="ml-2 h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              
              {activeFilters.map((filter, i) => (
                <Badge key={i} variant="secondary" className="h-7 gap-1 px-2">
                  {filter}
                  <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => {
                    const amenity = amenityFilters.find(f => f.label === filter);
                    if (amenity) toggleAmenity(amenity.id);
                    else {
                      amenityFilters.forEach(f => {
                        const sub = f.subFilters?.find(s => s.label === filter);
                        if (sub) toggleAmenity(sub.id, true, f.id);
                      });
                    }
                  }} />
                </Badge>
              ))}
              
              {activeFilters.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                Found <strong data-testid="text-result-count">{filteredProperties.length}</strong> results
              </div>
            </div>

            <CollapsibleContent className="mt-4">
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-6">
                {/* Beds & Baths */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Min Beds</label>
                    <Select value={minBeds} onValueChange={setMinBeds}>
                      <SelectTrigger className="bg-white" data-testid="select-min-beds">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Min Baths</label>
                    <Select value={minBaths} onValueChange={setMinBaths}>
                      <SelectTrigger className="bg-white" data-testid="select-min-baths">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Min Price/Night</label>
                    <Input 
                      type="number" 
                      placeholder="€0" 
                      className="bg-white"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      data-testid="input-min-price"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Max Price/Night</label>
                    <Input 
                      type="number" 
                      placeholder="€1000" 
                      className="bg-white"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      data-testid="input-max-price"
                    />
                  </div>
                </div>

                {/* Amenities Grid */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {amenityFilters.map((filter) => (
                      <div key={filter.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={filter.id} 
                            checked={filter.checked}
                            onCheckedChange={() => toggleAmenity(filter.id)}
                            data-testid={`checkbox-${filter.id}`}
                          />
                          <label 
                            htmlFor={filter.id} 
                            className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {filter.label}
                          </label>
                        </div>
                        
                        {filter.checked && filter.subFilters && (
                          <div className="ml-6 space-y-2 border-l-2 border-primary/20 pl-3">
                            {filter.subFilters.map((subFilter) => (
                              <div key={subFilter.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={subFilter.id} 
                                  checked={subFilter.checked}
                                  onCheckedChange={() => toggleAmenity(subFilter.id, true, filter.id)}
                                  data-testid={`checkbox-${subFilter.id}`}
                                />
                                <label 
                                  htmlFor={subFilter.id} 
                                  className="text-sm text-muted-foreground leading-none cursor-pointer"
                                >
                                  {subFilter.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content - Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            {isLoading ? (
              <div className="text-center py-12">Loading properties...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property: any) => {
                  const propertyAvailability = getPropertyAvailability(property.id);
                  const unavailableDates = propertyAvailability
                    .filter((a: any) => !a.isAvailable)
                    .map((a: any) => ({ start: a.startDate, end: a.endDate }));
                  
                  return (
                    <div key={property.id} className="group bg-white rounded-lg border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden" data-testid={`card-property-${property.id}`}>
                      {/* Image */}
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
                        <div className="absolute bottom-3 left-3 flex gap-2">
                          <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm shadow-sm border-0 capitalize">
                            {property.propertyType}
                          </Badge>
                          {unavailableDates.length > 0 && (
                            <Badge className="bg-amber-500 text-white border-0">
                              Some dates booked
                            </Badge>
                          )}
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
                        <div className="flex items-center text-muted-foreground text-sm mb-3">
                          <MapPin className="h-3 w-3 mr-1" />
                          {property.location}
                        </div>

                        {/* Amenities preview */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(property.amenities || []).slice(0, 4).map((amenity: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 bg-slate-50">
                              {amenity}
                            </Badge>
                          ))}
                          {(property.amenities || []).length > 4 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-50">
                              +{property.amenities.length - 4} more
                            </Badge>
                          )}
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
                              <Calendar className="h-4 w-4" />
                            </Button>
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
