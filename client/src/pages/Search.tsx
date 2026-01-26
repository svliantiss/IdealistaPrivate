
// src/components/Search.tsx
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search as SearchIcon, MapPin, Calendar, Filter, Heart, Share2, ChevronDown, ChevronUp, X, Building2, Home, Phone, Mail, User } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { PropertyAvailabilityDialog } from "@/components/PropertyAvailabilityDialog";
import {
  useSearchRentalProperties,
  useSearchSalesProperties,
  useSearchFilterOptions,
  useQuickSearch,
  useAgent,
  usePropertyAvailability,
  type AmenityFilter,
  type SearchFilters
} from "@/store/query/search.queries";

export default function Search() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"rentals" | "sales">("rentals");

  // Search filters state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Form state
  const [searchLocation, setSearchLocation] = useState("");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [minBeds, setMinBeds] = useState<string>("any");
  const [minBaths, setMinBaths] = useState<string>("any");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minSqm, setMinSqm] = useState<string>("");
  const [maxSqm, setMaxSqm] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");

  // Amenity filters
  const [rentalAmenityFilters, setRentalAmenityFilters] = useState<AmenityFilter[]>([
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

  const [salesAmenityFilters, setSalesAmenityFilters] = useState<AmenityFilter[]>([
    {
      id: "pool",
      label: "Pool",
      checked: false,
      subFilters: [
        { id: "heated_pool", label: "Heated Pool", checked: false },
        { id: "infinity_pool", label: "Infinity Pool", checked: false }
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
    {
      id: "sea_view",
      label: "Sea View",
      checked: false,
      subFilters: [
        { id: "beach_access", label: "Beach Access", checked: false },
        { id: "beachfront", label: "Beachfront", checked: false }
      ]
    },
    { id: "garden", label: "Garden", checked: false },
    { id: "terrace", label: "Terrace", checked: false },
    { id: "security", label: "Security", checked: false },
    {
      id: "golf",
      label: "Golf",
      checked: false,
      subFilters: [
        { id: "golf_view", label: "Golf View", checked: false }
      ]
    },
    { id: "gym", label: "Gym", checked: false },
    { id: "concierge", label: "Concierge", checked: false },
    { id: "wine_cellar", label: "Wine Cellar", checked: false },
    { id: "home_office", label: "Home Office", checked: false },
    { id: "guest_house", label: "Guest House", checked: false },
  ]);

  // API queries
  const { data: rentalData, isLoading: rentalsLoading } = useSearchRentalProperties(searchFilters);
  const { data: salesData, isLoading: salesLoading } = useSearchSalesProperties(searchFilters);
  const { data: filterOptions } = useSearchFilterOptions(activeTab);
  const { data: quickSearchResults } = useQuickSearch(searchLocation, 'both');

  // Properties data
  const rentalProperties = rentalData?.data || [];
  const salesProperties = salesData?.data || [];

  // Update search filters when form changes
  useEffect(() => {
    const filters: SearchFilters = {
      location: searchLocation || undefined,
      propertyType: propertyType !== 'all' ? propertyType : undefined,
      minBeds: minBeds !== 'any' ? minBeds : undefined,
      minBaths: minBaths !== 'any' ? minBaths : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      checkIn: checkInDate || undefined,
      checkOut: checkOutDate || undefined,
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      amenities: activeTab === 'rentals' ? rentalAmenityFilters : salesAmenityFilters
    };

    if (activeTab === 'sales') {
      filters.minSqm = minSqm || undefined;
      filters.maxSqm = maxSqm || undefined;
    }

    setSearchFilters(filters);
  }, [
    activeTab,
    searchLocation,
    propertyType,
    minBeds,
    minBaths,
    minPrice,
    maxPrice,
    minSqm,
    maxSqm,
    checkInDate,
    checkOutDate,
    rentalAmenityFilters,
    salesAmenityFilters
  ]);

  // Toggle amenity functions
  const toggleRentalAmenity = (id: string, isSubFilter: boolean = false, parentId?: string) => {
    setRentalAmenityFilters(prev => prev.map(filter => {
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

  const toggleSalesAmenity = (id: string, isSubFilter: boolean = false, parentId?: string) => {
    setSalesAmenityFilters(prev => prev.map(filter => {
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

  // Calculate active filters for display
  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    const amenityFilters = activeTab === "rentals" ? rentalAmenityFilters : salesAmenityFilters;

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
    if (minPrice) filters.push(`Min €${parseInt(minPrice).toLocaleString()}`);
    if (maxPrice) filters.push(`Max €${parseInt(maxPrice).toLocaleString()}`);
    if (minSqm) filters.push(`Min ${minSqm}m²`);
    if (maxSqm) filters.push(`Max ${maxSqm}m²`);
    return filters;
  }, [activeTab, rentalAmenityFilters, salesAmenityFilters, minBeds, minBaths, minPrice, maxPrice, minSqm, maxSqm]);

  // Clear all filters
  const clearAllFilters = () => {
    if (activeTab === "rentals") {
      setRentalAmenityFilters(prev => prev.map(filter => ({
        ...filter,
        checked: false,
        subFilters: filter.subFilters?.map(sub => ({ ...sub, checked: false }))
      })));
    } else {
      setSalesAmenityFilters(prev => prev.map(filter => ({
        ...filter,
        checked: false,
        subFilters: filter.subFilters?.map(sub => ({ ...sub, checked: false }))
      })));
    }
    setMinBeds("any");
    setMinBaths("any");
    setMinPrice("");
    setMaxPrice("");
    setMinSqm("");
    setMaxSqm("");
    setCheckInDate("");
    setCheckOutDate("");
  };

  // Handle search submit
  const handleSearch = () => {
    // Trigger API refetch by updating filters
    setSearchFilters(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setSearchFilters(prev => ({ ...prev, page }));
  };

  // Property type options from API or defaults
  const propertyTypeOptions = filterOptions?.data?.propertyTypes || [
    'Villa', 'Apartment', 'Studio', 'House', 'Condo', 'Townhouse'
  ];

  // Agent Contact Dialog Component
  const AgentContactDialog = ({ agent, propertyTitle, propertyId }: {
    agent: any;
    propertyTitle: string;
    propertyId: number
  }) => {
    if (!agent) return null;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="h-8 bg-primary text-white hover:bg-primary/90"
            data-testid={`button-contact-agent-${propertyId}`}
          >
            Contact Agent
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Contact Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Interested in: <span className="font-medium text-foreground">{propertyTitle}</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground">{agent.agency?.name || agent.agency}</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${agent.phone}`} className="text-primary hover:underline">{agent.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${agent.email}?subject=Inquiry: ${encodeURIComponent(propertyTitle)}`}
                    className="text-primary hover:underline"
                  >
                    {agent.email}
                  </a>
                </div>
              </div>

              {agent.agency?.phone && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="text-xs font-medium text-muted-foreground uppercase">Agency Contact</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${agent.agency.phone}`} className="text-primary hover:underline">
                      {agent.agency.phone}
                    </a>
                  </div>
                  {agent.agency.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${agent.agency.email}?subject=Inquiry: ${encodeURIComponent(propertyTitle)}`}
                        className="text-primary hover:underline"
                      >
                        {agent.agency.email}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Quick search suggestions dropdown
  const QuickSearchDropdown = () => {
    if (!searchLocation || searchLocation.length < 2 || !quickSearchResults?.data?.length) {
      return null;
    }

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
        {quickSearchResults.data.map((result: any) => (
          <div
            key={`${result.type}-${result.id}`}
            className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
            onClick={() => {
              setSearchLocation(result.location);
              if (result.type === 'rental') {
                setActiveTab('rentals');
              } else {
                setActiveTab('sales');
              }
            }}
          >
            <div className="flex items-center gap-3">
              {result.thumbnail && (
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="h-10 w-10 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="font-medium text-sm">{result.title}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {result.location}
                </div>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {result.type}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Create a component for Sales Property Card to isolate the useAgent hook
  const SalesPropertyCard = ({ property }: { property: any }) => {
    const { data: agentData } = useAgent(property.agent?.id);
    const agent = property.agent || agentData?.data;

    return (
      <div
        className="group bg-white rounded-lg border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
        data-testid={`card-sale-${property.id}`}
        onClick={() => navigate(`/sales/${property.id}`)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.thumbnail || '/placeholder.jpg'}
            alt={property.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/90 text-slate-900 hover:bg-white hover:text-red-500 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-3 left-3 flex gap-2">
            <Badge className="bg-blue-500 text-white border-0">
              For Sale
            </Badge>
            <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm shadow-sm border-0 capitalize">
              {property.propertyType}
            </Badge>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {property.agency?.name || 'Agency listing'}
            </div>
            <div className="flex items-center gap-2">
              {property.licenseNumber && (
                <Badge variant="outline" className="text-xs">
                  License: {property.licenseNumber}
                </Badge>
              )}
            </div>
          </div>

          <h3 className="font-serif text-lg font-bold text-primary mb-1 line-clamp-1 group-hover:text-secondary transition-colors" data-testid={`text-sale-title-${property.id}`}>
            {property.title}
          </h3>
          <div className="flex items-center text-muted-foreground text-sm mb-3">
            <MapPin className="h-3 w-3 mr-1" />
            {property.location}
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {property.amenities?.slice(0, 4).map((amenity: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 bg-slate-50">
                {amenity}
              </Badge>
            ))}
            {property.amenities?.length > 4 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-50">
                +{property.amenities.length - 4} more
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{property.beds}</span>
              <span className="text-muted-foreground text-xs">Beds</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{property.baths}</span>
              <span className="text-muted-foreground text-xs">Baths</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{property.sqm}</span>
              <span className="text-muted-foreground text-xs">m²</span>
            </div>
          </div>

          {/* Mortgage information for sales properties */}
          {property.mortgage && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-medium text-muted-foreground mb-1">Estimated Mortgage</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-primary">€{property.mortgage.downPayment}</div>
                  <div className="text-xs text-muted-foreground">Down Payment</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">€{property.mortgage.loanAmount}</div>
                  <div className="text-xs text-muted-foreground">Loan Amount</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">€{property.mortgage.monthlyPayment}</div>
                  <div className="text-xs text-muted-foreground">Monthly</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-primary" data-testid={`text-sale-price-${property.id}`}>
                €{typeof property.price === 'number' ? property.price.toLocaleString() : property.price}
              </div>
              <div className="text-xs text-muted-foreground">
                €{property.pricePerSqm}/m²
              </div>
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Share2 className="h-4 w-4" />
              </Button>
              <AgentContactDialog
                agent={agent}
                propertyTitle={property.title}
                propertyId={property.id}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] flex-col">
        <div className="bg-white border-b border-border p-6 shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-serif font-bold text-primary">Find House</h1>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "rentals" | "sales")} className="w-auto">
              <TabsList>
                <TabsTrigger value="rentals" className="flex items-center gap-2" data-testid="tab-rentals">
                  <Building2 className="h-4 w-4" />
                  Find Rentals
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2" data-testid="tab-buy">
                  <Home className="h-4 w-4" />
                  To Buy
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City, neighborhood..."
                    className="pl-9 bg-slate-50 border-slate-200"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    data-testid="input-location"
                  />
                  <QuickSearchDropdown />
                </div>
              </div>

              {activeTab === "rentals" && (
                <>
                  <div className="relative">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      Check-in
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-9 bg-slate-50 border-slate-200"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        data-testid="input-checkin"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      Check-out
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-9 bg-slate-50 border-slate-200"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        data-testid="input-checkout"
                        min={checkInDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Type
                </label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="select-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {propertyTypeOptions.map((type: string) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex items-end">
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium"
                  data-testid="button-search"
                  onClick={handleSearch}
                >
                  <SearchIcon className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </div>
          </div>

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
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => {
                      if (filter.includes("+ Beds")) {
                        setMinBeds("any");
                        return;
                      }
                      if (filter.includes("+ Baths")) {
                        setMinBaths("any");
                        return;
                      }
                      if (filter.startsWith("Min €")) {
                        setMinPrice("");
                        return;
                      }
                      if (filter.startsWith("Max €")) {
                        setMaxPrice("");
                        return;
                      }
                      if (filter.includes("m²") && filter.startsWith("Min")) {
                        setMinSqm("");
                        return;
                      }
                      if (filter.includes("m²") && filter.startsWith("Max")) {
                        setMaxSqm("");
                        return;
                      }

                      const amenityFilters = activeTab === "rentals" ? rentalAmenityFilters : salesAmenityFilters;
                      const toggleFn = activeTab === "rentals" ? toggleRentalAmenity : toggleSalesAmenity;

                      const amenity = amenityFilters.find(f => f.label === filter);
                      if (amenity) toggleFn(amenity.id);
                      else {
                        amenityFilters.forEach(f => {
                          const sub = f.subFilters?.find(s => s.label === filter);
                          if (sub) toggleFn(sub.id, true, f.id);
                        });
                      }
                    }}
                  />
                </Badge>
              ))}

              {activeFilters.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                Found <strong data-testid="text-result-count">
                  {activeTab === "rentals"
                    ? rentalData?.pagination?.total || 0
                    : salesData?.pagination?.total || 0}
                </strong> results
              </div>
            </div>

            <CollapsibleContent className="mt-4">
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      Min Beds
                    </label>
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
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      Min Baths
                    </label>
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
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      {activeTab === "rentals" ? "Min Price/Night" : "Min Price"}
                    </label>
                    <Input
                      type="number"
                      placeholder={activeTab === "rentals" ? "€0" : "€100,000"}
                      className="bg-white"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      data-testid="input-min-price"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      {activeTab === "rentals" ? "Max Price/Night" : "Max Price"}
                    </label>
                    <Input
                      type="number"
                      placeholder={activeTab === "rentals" ? "€1000" : "€5,000,000"}
                      className="bg-white"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      data-testid="input-max-price"
                      min="0"
                    />
                  </div>
                  {activeTab === "sales" && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                          Min Size (m²)
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="bg-white"
                          value={minSqm}
                          onChange={(e) => setMinSqm(e.target.value)}
                          data-testid="input-min-sqm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                          Max Size (m²)
                        </label>
                        <Input
                          type="number"
                          placeholder="1000"
                          className="bg-white"
                          value={maxSqm}
                          onChange={(e) => setMaxSqm(e.target.value)}
                          data-testid="input-max-sqm"
                          min="0"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">
                    {activeTab === "rentals" ? "Amenities" : "Features & Amenities"}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(activeTab === "rentals" ? rentalAmenityFilters : salesAmenityFilters).map((filter) => (
                      <div key={filter.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`${activeTab}-${filter.id}`}
                            checked={filter.checked}
                            onCheckedChange={() => activeTab === "rentals" ? toggleRentalAmenity(filter.id) : toggleSalesAmenity(filter.id)}
                            data-testid={`checkbox-${filter.id}`}
                          />
                          <label
                            htmlFor={`${activeTab}-${filter.id}`}
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
                                  id={`${activeTab}-${subFilter.id}`}
                                  checked={subFilter.checked}
                                  onCheckedChange={() => activeTab === "rentals" ? toggleRentalAmenity(subFilter.id, true, filter.id) : toggleSalesAmenity(subFilter.id, true, filter.id)}
                                  data-testid={`checkbox-${subFilter.id}`}
                                />
                                <label
                                  htmlFor={`${activeTab}-${subFilter.id}`}
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
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            {activeTab === "rentals" ? (
              rentalsLoading ? (
                <div className="text-center py-12">Loading rental properties...</div>
              ) : rentalProperties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No rental properties found matching your criteria.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rentalProperties.map((property: any) => {
                      const unavailableDates = property.hasBookedDates ? [] : [];

                      return (
                        <div
                          key={property.id}
                          className="group bg-white rounded-lg border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
                          data-testid={`card-rental-${property.id}`}
                          onClick={() => navigate(`/rentals/${property.id}`)}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                              src={property.thumbnail || '/placeholder.jpg'}
                              alt={property.title}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 rounded-full bg-white/90 text-slate-900 hover:bg-white hover:text-red-500 shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-3 left-3 flex gap-2">
                              <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm shadow-sm border-0 capitalize">
                                {property.propertyType}
                              </Badge>
                              {property.hasBookedDates && (
                                <Badge className="bg-amber-500 text-white border-0">
                                  Some dates booked
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {property.agency?.name || 'Agent listing'}
                              </div>
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

                            <div className="flex flex-wrap gap-1 mb-3">
                              {property.amenities?.slice(0, 4).map((amenity: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 bg-slate-50">
                                  {amenity}
                                </Badge>
                              ))}
                              {property.amenities?.length > 4 && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-50">
                                  +{property.amenities.length - 4} more
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">{property.beds}</span>
                                <span className="text-muted-foreground text-xs">Beds</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">{property.baths}</span>
                                <span className="text-muted-foreground text-xs">Baths</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">{property.sqm}</span>
                                <span className="text-muted-foreground text-xs">m²</span>
                              </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                              <div>
                                <span className="text-xl font-bold text-primary" data-testid={`text-price-${property.id}`}>
                                  €{property.price.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground text-sm">/night</span>
                              </div>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <PropertyAvailabilityDialog
                                  propertyId={property.id}
                                  propertyTitle={property.title}
                                  propertyType="rental"
                                />
                                <Button variant="outline" size="sm" className="h-8 px-2">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 bg-primary text-white hover:bg-primary/90"
                                  data-testid={`button-details-${property.id}`}
                                  onClick={() => navigate(`/rentals/${property.id}`)}
                                >
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination for rentals */}
                  {rentalData?.pagination && rentalData.pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(searchFilters.page! - 1)}
                          disabled={searchFilters.page === 1}
                        >
                          Previous
                        </Button>

                        {Array.from({ length: Math.min(5, rentalData.pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (rentalData.pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (searchFilters.page! <= 3) {
                            pageNum = i + 1;
                          } else if (searchFilters.page! >= rentalData.pagination.totalPages - 2) {
                            pageNum = rentalData.pagination.totalPages - 4 + i;
                          } else {
                            pageNum = searchFilters.page! - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={searchFilters.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(searchFilters.page! + 1)}
                          disabled={!rentalData.pagination.hasMore}
                        >
                          Next
                        </Button>

                        <div className="ml-4 text-sm text-muted-foreground">
                          Page {searchFilters.page} of {rentalData.pagination.totalPages}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              salesLoading ? (
                <div className="text-center py-12">Loading properties for sale...</div>
              ) : salesProperties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No properties for sale found matching your criteria.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {salesProperties.map((property: any) =>
                      <SalesPropertyCard key={property.id} property={property} />
                    )}
                  </div>

                  {/* Pagination for sales */}
                  {salesData?.pagination && salesData.pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(searchFilters.page! - 1)}
                          disabled={searchFilters.page === 1}
                        >
                          Previous
                        </Button>

                        {Array.from({ length: Math.min(5, salesData.pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (salesData.pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (searchFilters.page! <= 3) {
                            pageNum = i + 1;
                          } else if (searchFilters.page! >= salesData.pagination.totalPages - 2) {
                            pageNum = salesData.pagination.totalPages - 4 + i;
                          } else {
                            pageNum = searchFilters.page! - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={searchFilters.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(searchFilters.page! + 1)}
                          disabled={!salesData.pagination.hasMore}
                        >
                          Next
                        </Button>

                        <div className="ml-4 text-sm text-muted-foreground">
                          Page {searchFilters.page} of {salesData.pagination.totalPages}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}