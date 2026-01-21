// src/pages/Sales.tsx
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Maximize2, Image as ImageIcon, Plus } from "lucide-react";
import { Link } from "wouter";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { useSalesProperties } from "@/store/query/property.queries";

const CURRENT_AGENT_ID = 1;

export default function Sales() {
  // Use the TanStack Query hook for sales properties
  const { 
    data: response = { data: [], pagination: { total: 0 } }, 
    isLoading 
  } = useSalesProperties({ agentId: CURRENT_AGENT_ID });

  // Extract properties from the response
  const properties = response.data || [];
  
  // Filter to only show active sales properties (not sold/archived)
  const activeProperties = properties.filter((property: any) => 
    property.status !== 'archived' && property.status !== 'sold'
  );

  return (
    <Layout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">My Properties for Sale</h1>
            <p className="text-muted-foreground mt-1">
              Manage your sales listings ({activeProperties.length} active properties, {response.pagination?.total || 0} total)
            </p>
          </div>
          <AddPropertyDialog defaultType="sale">
            <Button className="bg-secondary hover:bg-secondary/90 gap-2" data-testid="button-add-sales-property">
              <Plus className="h-4 w-4" />
              List Property for Sale
            </Button>
          </AddPropertyDialog>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{activeProperties.length}</div>
              <div className="text-sm text-muted-foreground">Active Listings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-500">
                {properties.filter((p: any) => p.status === 'published').length}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-500">
                {properties.filter((p: any) => p.status === 'draft').length}
              </div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-500">
                {properties.filter((p: any) => p.status === 'sold' || p.status === 'archived').length}
              </div>
              <div className="text-sm text-muted-foreground">Closed/Archived</div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        ) : activeProperties.length === 0 ? (
          <Card className="text-center py-12">
            <div className="mb-4">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No active sales listings</h3>
            <p className="text-muted-foreground mb-6">Start listing properties to attract potential buyers</p>
            <AddPropertyDialog defaultType="sale">
              <Button className="bg-secondary hover:bg-secondary/90 gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Property
              </Button>
            </AddPropertyDialog>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProperties.map((property: any) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group" data-testid={`card-property-${property.id}`}>
                {/* Property Image */}
                <div className="relative bg-gradient-to-br from-blue-50 to-emerald-50 h-48 flex items-center justify-center overflow-hidden">
                  {property.media && property.media.length > 0 ? (
                    <img
                      src={property.media[0]?.url || '/placeholder.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      data-testid={`img-property-${property.id}`}
                    />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                      <ImageIcon className="h-12 w-12" />
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-emerald-500">
                    {property.propertyType}
                  </Badge>
                  <Badge className={`absolute top-2 left-2 ${
                    property.status === 'published' 
                      ? 'bg-green-500' 
                      : property.status === 'draft'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }`}>
                    {property.status}
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-2 font-serif text-xl" data-testid={`text-title-${property.id}`}>
                    {property.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1" data-testid={`text-location-${property.id}`}>
                      {property.location}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features Grid */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-md">
                      <Bed className="h-4 w-4 text-blue-500" />
                      <span data-testid={`text-beds-${property.id}`}>
                        {property.beds || 0} beds
                      </span>
                    </div>
                    <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-md">
                      <Bath className="h-4 w-4 text-blue-500" />
                      <span data-testid={`text-baths-${property.id}`}>
                        {property.baths || 0} baths
                      </span>
                    </div>
                    <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-md">
                      <Maximize2 className="h-4 w-4 text-blue-500" />
                      <span data-testid={`text-sqm-${property.id}`}>
                        {property.sqm || 0} m²
                      </span>
                    </div>
                  </div>

                  {/* Amenities Preview */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 3).map((amenity: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {property.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 pt-2 border-t">
                    <span 
                      className="text-2xl font-bold text-primary" 
                      data-testid={`text-price-${property.id}`}
                    >
                      €{typeof property.price === 'number' 
                        ? property.price.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        : parseFloat(property.price || '0').toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }
                    </span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/sales/${property.id}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid={`button-view-${property.id}`}
                      >
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/sales/${property.id}/edit`} className="flex-1">
                      <Button 
                        variant="default" 
                        className="w-full bg-sidebar hover:bg-sidebar/90"
                        data-testid={`button-edit-${property.id}`}
                      >
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State for Drafts */}
        {!isLoading && properties.filter((p: any) => p.status === 'draft').length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Draft Properties ({properties.filter((p: any) => p.status === 'draft').length})</h3>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">You have {properties.filter((p: any) => p.status === 'draft').length} unpublished properties</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Publish them to make them visible to potential buyers
                  </p>
                </div>
                <Link href="/sales?status=draft">
                  <Button variant="outline">
                    View Drafts
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}