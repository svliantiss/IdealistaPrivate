// src/pages/Properties.tsx
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MoreHorizontal, Eye, Building, Calendar, ImageIcon, MapPin, Bed, Bath, Maximize2 } from "lucide-react";
import { useLocation } from "wouter";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PropertyAvailabilityDialog } from "@/components/PropertyAvailabilityDialog";
import {
  useRentalProperties,
  useDeleteRentalProperty,
  type Property
} from "@/store/query/property.queries";

const CURRENT_AGENT_ID = 1;

// Helper function to format price with period
const formatPrice = (property: Property) => {
  const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
  
  if (property.priceType) {
    const priceTypeMap: Record<string, string> = {
      'night': 'night',
      'week': 'week',
      'month': 'month'
    };
    
    const period = priceTypeMap[property.priceType] || property.priceType;
    return `€${price.toLocaleString('es-ES')}/${period}`;
  }
  
  return `€${price.toLocaleString('es-ES')}/night`;
};

export default function Properties() {
  const [, navigate] = useLocation();

  // Use TanStack Query hooks - FIXED: Now uses useRentalProperties with agent filter
  const { data: propertiesData, isLoading } = useRentalProperties({ agentId: CURRENT_AGENT_ID });
  const deleteProperty = useDeleteRentalProperty();

  console.log('📊 [Properties] Properties data:', propertiesData);

  // Extract properties from the response - handle different response structures
  let properties: Property[] = [];
  if (propertiesData) {
    if (Array.isArray(propertiesData)) {
      properties = propertiesData;
    } else if (propertiesData.data && Array.isArray(propertiesData.data)) {
      properties = propertiesData.data;
    } else if (propertiesData.properties && Array.isArray(propertiesData.properties)) {
      properties = propertiesData.properties;
    }
  }

  const handleDeleteProperty = (propertyId: number) => {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      deleteProperty.mutate(propertyId, {
        onSuccess: () => {
          toast.success('Property deleted successfully');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to delete property');
        }
      });
    }
  };

  const getPropertyImage = (property: Property) => {
    if (property.media && property.media.length > 0) {
      return property.media[0].url;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading properties...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">My Rentals</h1>
            <p className="text-muted-foreground mt-1">Manage your listings and availability.</p>
          </div>
          <AddPropertyDialog defaultType="rental">
            <Button className="bg-secondary hover:bg-secondary/90 text-white" data-testid="button-add-property">
              <Plus className="mr-2 h-4 w-4" /> Add Property
            </Button>
          </AddPropertyDialog>
        </div>

        <div className="space-y-4">
          {properties.length === 0 ? (
            <Card className="p-12 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-serif text-xl font-bold mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-6">Start adding properties to your inventory to collaborate with other agents.</p>
              <AddPropertyDialog defaultType="rental">
                <Button className="bg-secondary hover:bg-secondary/90 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Property
                </Button>
              </AddPropertyDialog>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property: Property) => {
                const propertyImage = getPropertyImage(property);
                
                return (
                  <Card 
                    key={property.id} 
                    className="hover:shadow-lg transition-shadow overflow-hidden group border"
                    data-testid={`card-property-${property.id}`}
                  >
                    {/* Property Image Section */}
                    <div className="relative bg-gradient-to-br from-blue-100 to-emerald-100 h-48 flex items-center justify-center overflow-hidden">
                      {propertyImage ? (
                        <img
                          src={propertyImage}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          data-testid={`img-property-${property.id}`}
                        />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                          <ImageIcon className="h-12 w-12" />
                          <span className="text-sm">No image available</span>
                        </div>
                      )}
                      
                      {/* Top Right Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge 
                          className={`${property.status === 'published' ? 'bg-emerald-500' : property.status === 'draft' ? 'bg-amber-500' : 'bg-gray-500'} text-white`}
                        >
                          {property.status?.charAt(0).toUpperCase() + property.status?.slice(1) || 'Draft'}
                        </Badge>
                        {property.classification && (
                          <Badge 
                            className={`
                              ${property.classification === 'Long-Term' ? 'bg-blue-500' : 'bg-green-500'} 
                              text-white
                            `}
                          >
                            {property.classification}
                          </Badge>
                        )}
                      </div>
                      
                      <Badge className="absolute top-2 right-2 bg-purple-500 text-white capitalize">
                        {property.propertyType || 'Property'}
                      </Badge>
                      
                      {/* Action Menu */}
                      <div className="absolute top-2 left-2/3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                              data-testid={`button-menu-${property.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/rentals/${property.id}`); }}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/properties/${property.id}/edit`); }}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeleteProperty(property.id);
                              }}
                              disabled={deleteProperty.isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> 
                              {deleteProperty.isPending ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="line-clamp-1 text-lg font-bold" title={property.title}>
                        {property.title}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Features Grid */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Bed className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold" data-testid={`text-beds-${property.id}`}>
                              {property.beds || 0}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">Beds</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Bath className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold" data-testid={`text-baths-${property.id}`}>
                              {property.baths || 0}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">Baths</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Maximize2 className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold" data-testid={`text-sqm-${property.id}`}>
                              {property.sqm || 0}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">m²</span>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="pt-3 border-t">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-bold text-primary" data-testid={`text-price-${property.id}`}>
                              {formatPrice(property)}
                            </span>
                            {property.minimumStayValue && property.minimumStayUnit && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Min. stay: {property.minimumStayValue} {property.minimumStayUnit}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {property.amenities?.length || 0} amenities
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <PropertyAvailabilityDialog 
                          propertyId={property.id} 
                          propertyTitle={property.title}
                          showLabel={false}
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Calendar className="mr-2 h-4 w-4" />
                            Availability
                          </Button>
                        </PropertyAvailabilityDialog>
                        
                        <Button 
                          className="w-full bg-sidebar hover:bg-sidebar/90 text-white"
                          onClick={() => navigate(`/rentals/${property.id}`)}
                          data-testid={`button-view-${property.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}