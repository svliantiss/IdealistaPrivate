import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MoreHorizontal, Eye, Building, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
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

const CURRENT_AGENT_ID = 1;

export default function Properties() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const { data: properties = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}/properties`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${CURRENT_AGENT_ID}/properties`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete property');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${CURRENT_AGENT_ID}/properties`] });
      toast.success('Property deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete property');
    },
  });

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
          <Button className="bg-secondary hover:bg-secondary/90 text-white" data-testid="button-add-property">
            <Plus className="mr-2 h-4 w-4" /> Add Property
          </Button>
        </div>

        <div className="space-y-4">
          {properties.map((property: any) => (
            <Card 
              key={property.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
              data-testid={`card-property-${property.id}`}
              onClick={() => navigate(`/rentals/${property.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto relative">
                    <img 
                      src={property.images?.[0] || '/placeholder.jpg'} 
                      alt={property.title}
                      className="object-cover w-full h-full" 
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={property.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}>
                        {property.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-xl font-bold text-primary mb-1" data-testid={`text-title-${property.id}`}>{property.title}</h3>
                          <p className="text-muted-foreground text-sm">{property.location}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              data-testid={`button-menu-${property.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/rentals/${property.id}`); }}>
                              <Eye className="mr-2 h-4 w-4" /> View Public Page
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/properties/${property.id}/edit`); }}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); deletePropertyMutation.mutate(property.id); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex gap-6 mt-4 text-sm">
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Price</span>
                          <span className="font-semibold" data-testid={`text-price-${property.id}`}>€{property.price}/night</span>
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

                    <div className="mt-6 flex gap-3 justify-end" onClick={(e) => e.stopPropagation()}>
                      <PropertyAvailabilityDialog 
                        propertyId={property.id} 
                        propertyTitle={property.title}
                        showLabel={true}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/properties/${property.id}/edit`); }}
                        data-testid={`button-edit-${property.id}`}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {properties.length === 0 && (
            <Card className="p-12 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-serif text-xl font-bold mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-6">Start adding properties to your inventory to collaborate with other agents.</p>
              <Button className="bg-secondary hover:bg-secondary/90 text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Property
              </Button>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
