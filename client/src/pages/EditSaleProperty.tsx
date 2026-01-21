// src/pages/sales/[id]/edit.tsx
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge
} from "@/components/ui/badge";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Euro, 
  Home,
  Image as ImageIcon,
  Video,
  Trash2,
  Grid3x3,
  Plus,
  Eye,
  DollarSign
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  useSalesProperty,
  useUpdateSalesProperty,
  useUpdateSalesPropertyStatus,
  useDeleteSalesProperty,
  type Property,
  type UpdatePropertyInput
} from "../store/query/property.queries"
import { MediaManager } from "@/components/MediaManager";
import { uploadToR2 } from "@/lib/utils";

// Sales specific property type (remove rental-specific fields)
interface SalesProperty extends Omit<Property, 'priceType' | 'minimumStayValue' | 'minimumStayUnit' | 'classification'> {
  // Sales properties don't have priceType, minimum stay, or classification
}

export default function EditSalesProperty() {
  const params = useParams<{ id: string }>();
  const propertyId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  // Use TanStack Query hooks for sales
  const { data: propertyData, isLoading } = useSalesProperty(propertyId);
  const updateProperty = useUpdateSalesProperty();
  const updateStatus = useUpdateSalesPropertyStatus();
  const deleteProperty = useDeleteSalesProperty();

  console.log('📊 [EditSalesProperty] Sales property data:', propertyData);

  // Extract property from the response
  const property: SalesProperty | undefined = propertyData?.data || propertyData;

  const [formData, setFormData] = useState<UpdatePropertyInput>({
    title: "",
    description: "",
    location: "",
    propertyType: "apartment",
    price: "",
    beds: 0,
    baths: 0,
    sqm: 0,
    amenities: [],
    nearestTo: [],
    media: [],
    licenseNumber: "",
    status: "draft",
  });

  const [amenitiesInput, setAmenitiesInput] = useState("");
  const [nearestToInput, setNearestToInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [yearBuilt, setYearBuilt] = useState<string>("");
  const [lotSize, setLotSize] = useState<string>("");

  useEffect(() => {
    if (property) {
      console.log('📝 [EditSalesProperty] Setting form data from property:', property);
      setFormData({
        title: property.title || "",
        description: property.description || "",
        location: property.location || "",
        propertyType: property.propertyType || "apartment",
        price: property.price || "",
        beds: property.beds || 0,
        baths: property.baths || 0,
        sqm: property.sqm || 0,
        amenities: property.amenities || [],
        nearestTo: property.nearestTo || [],
        media: property.media || [],
        licenseNumber: property.licenseNumber || "",
        status: property.status || "draft",
      });
      
      // Set comma-separated inputs
      setAmenitiesInput((property.amenities || []).join(", "));
      setNearestToInput((property.nearestTo || []).join(", "));
      
      // Extract additional sales data if available
      if ((property as any).yearBuilt) setYearBuilt(String((property as any).yearBuilt));
      if ((property as any).lotSize) setLotSize(String((property as any).lotSize));
    }
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 [EditSalesProperty] Submitting form data:', formData);
    
    // Convert amenities and nearestTo from comma-separated strings to arrays
    const amenitiesArray = amenitiesInput
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a);
    
    const nearestToArray = nearestToInput
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n);
    
    const updateData: UpdatePropertyInput = {
      ...formData,
      amenities: amenitiesArray,
      nearestTo: nearestToArray,
      price: parseFloat(String(formData.price)) || 0,
      beds: Number(formData.beds) || 0,
      baths: Number(formData.baths) || 0,
      sqm: Number(formData.sqm) || 0,
    };

    // Add additional sales-specific fields
    const additionalData: any = {};
    if (yearBuilt) additionalData.yearBuilt = parseInt(yearBuilt);
    if (lotSize) additionalData.lotSize = parseInt(lotSize);
    
    const finalUpdateData = { ...updateData, ...additionalData };

    console.log('📝 [EditSalesProperty] Sending update data:', finalUpdateData);

    updateProperty.mutate(
      { id: propertyId, data: finalUpdateData },
      {
        onSuccess: (data) => {
          console.log('✅ [EditSalesProperty] Sales property updated successfully:', data);
          toast.success("Sales property updated successfully");
          navigate("/sales");
        },
        onError: (error) => {
          console.error('❌ [EditSalesProperty] Failed to update sales property:', error);
          toast.error(error.message || "Failed to update sales property");
        },
      }
    );
  };

  const handleStatusChange = (newStatus: 'draft' | 'published' | 'archived' | 'sold') => {
    console.log('📝 [EditSalesProperty] Changing status to:', newStatus);
    
    updateStatus.mutate(
      { id: propertyId, status: newStatus },
      {
        onSuccess: (data) => {
          console.log('✅ [EditSalesProperty] Status updated successfully:', data);
          toast.success(`Sales property ${newStatus} successfully`);
          setFormData(prev => ({ ...prev, status: newStatus as any }));
        },
        onError: (error) => {
          console.error('❌ [EditSalesProperty] Failed to update status:', error);
          toast.error(error.message || "Failed to update status");
        },
      }
    );
  };

  const handleDeleteProperty = () => {
    if (confirm('Are you sure you want to delete this sales property? This action cannot be undone.')) {
      setIsDeleting(true);
      console.log('🗑️ [EditSalesProperty] Deleting sales property:', propertyId);
      
      deleteProperty.mutate(propertyId, {
        onSuccess: (data) => {
          console.log('✅ [EditSalesProperty] Sales property deleted successfully:', data);
          toast.success('Sales property deleted successfully');
          navigate("/sales");
        },
        onError: (error) => {
          console.error('❌ [EditSalesProperty] Failed to delete sales property:', error);
          toast.error(error.message || 'Failed to delete sales property');
          setIsDeleting(false);
        }
      });
    }
  };

  const handleFormChange = (field: keyof UpdatePropertyInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMediaChange = (media: any[]) => {
    console.log('📸 [EditSalesProperty] Media updated:', media);
    setFormData(prev => ({ ...prev, media }));
  };

  const removeMedia = (index: number) => {
    const newMedia = [...(formData.media || [])];
    newMedia.splice(index, 1);
    handleMediaChange(newMedia);
    toast.success('Media removed');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading sales property details...</div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Sales property not found</h2>
            <p className="text-muted-foreground mb-6">The sales property you're looking for doesn't exist or has been removed.</p>
            <Link href="/sales">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sales Properties
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isProcessing = updateProperty.isPending || updateStatus.isPending || isDeleting;

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/sales">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">Edit Sales Property</h1>
              <p className="text-muted-foreground mt-1">Update your sales property listing details</p>
            </div>
          </div>

          {/* Status Badge and Actions */}
          <div className="flex items-center gap-3">
            <Badge 
              className={`
                px-3 py-1 font-medium
                ${formData.status === 'published' ? 'bg-emerald-500' : 
                  formData.status === 'draft' ? 'bg-amber-500' : 
                  formData.status === 'sold' ? 'bg-purple-500' :
                  'bg-gray-500'} 
                text-white
              `}
            >
              {(formData.status || 'draft').charAt(0).toUpperCase() + (formData.status || 'draft').slice(1)}
            </Badge>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteProperty}
                disabled={isDeleting}
                data-testid="button-delete"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>

        {/* Status Update Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={formData.status === 'draft' ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange('draft')}
            disabled={updateStatus.isPending || formData.status === 'draft'}
          >
            Set as Draft
          </Button>
          <Button
            variant={formData.status === 'published' ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange('published')}
            disabled={updateStatus.isPending || formData.status === 'published'}
          >
            Publish Property
          </Button>
          <Button
            variant={formData.status === 'sold' ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange('sold')}
            disabled={updateStatus.isPending || formData.status === 'sold'}
          >
            Mark as Sold
          </Button>
          <Button
            variant={formData.status === 'archived' ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange('archived')}
            disabled={updateStatus.isPending || formData.status === 'archived'}
          >
            Archive Property
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g., Luxury Villa with Sea View"
                    required
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Describe the property features and highlights..."
                    rows={4}
                    required
                    data-testid="input-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g., Marbella, Costa del Sol"
                    required
                    data-testid="input-location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type *</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => handleFormChange('propertyType', value)}
                    >
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber || ''}
                      onChange={(e) => handleFormChange('licenseNumber', e.target.value)}
                      placeholder="e.g., VUT-MA-12345"
                      data-testid="input-license"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Section */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Property Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Images & Videos ({formData.media?.length || 0})</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setMediaManagerOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Manage Media
                    </Button>
                  </div>

                  {formData.media && formData.media.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formData.media.map((item: any, index: number) => (
                        <div key={index} className="relative group border rounded-md overflow-hidden bg-gray-100">
                          <div className="aspect-square">
                            {item.type === "image" ? (
                              <img
                                src={item.url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                <Video className="h-6 w-6 text-gray-500 mb-1" />
                                <span className="text-xs text-gray-600">{item.title}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Media Type Badge */}
                          <div className="absolute top-1 left-1">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              {item.type === "image" ? (
                                <ImageIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <Video className="h-3 w-3 mr-1" />
                              )}
                              {item.type}
                            </Badge>
                          </div>

                          {/* Actions Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => window.open(item.url, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => removeMedia(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Order Badge */}
                          {index === 0 && (
                            <div className="absolute top-1 right-1">
                              <Badge className="bg-primary text-xs px-1.5 py-0.5">
                                Thumbnail
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Grid3x3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <h4 className="font-medium mb-1">No media uploaded yet</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add images and videos to showcase your property
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMediaManagerOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Media
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    First image will be used as the property thumbnail. Drag to reorder in media manager.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Property Details Card */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Sale Price (€) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    placeholder="e.g., 500,000"
                    required
                    min="0"
                    step="1000"
                    data-testid="input-price"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the total sale price for the property
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="beds" className="flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      Bedrooms *
                    </Label>
                    <Input
                      id="beds"
                      type="number"
                      value={formData.beds}
                      onChange={(e) => handleFormChange('beds', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 3"
                      required
                      min="0"
                      data-testid="input-beds"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baths" className="flex items-center gap-2">
                      <Bath className="h-4 w-4" />
                      Bathrooms *
                    </Label>
                    <Input
                      id="baths"
                      type="number"
                      value={formData.baths}
                      onChange={(e) => handleFormChange('baths', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 2"
                      required
                      min="0"
                      data-testid="input-baths"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sqm" className="flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" />
                      Size (m²) *
                    </Label>
                    <Input
                      id="sqm"
                      type="number"
                      value={formData.sqm}
                      onChange={(e) => handleFormChange('sqm', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 150"
                      required
                      min="0"
                      data-testid="input-sqm"
                    />
                  </div>
                </div>

                {/* Additional Sales Information */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Additional Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearBuilt">Year Built</Label>
                      <Input
                        id="yearBuilt"
                        type="number"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(e.target.value)}
                        placeholder="e.g., 2010"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lotSize">Lot Size (m²)</Label>
                      <Input
                        id="lotSize"
                        type="number"
                        value={lotSize}
                        onChange={(e) => setLotSize(e.target.value)}
                        placeholder="e.g., 300"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Amenities & Features Card */}
          <Card className="mt-6">
            <CardHeader className="border-b">
              <CardTitle>Amenities & Nearby Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                    <Textarea
                      id="amenities"
                      value={amenitiesInput}
                      onChange={(e) => setAmenitiesInput(e.target.value)}
                      placeholder="Pool, Garden, Terrace, Parking, Security, Gym, Wine Cellar, Home Office"
                      rows={3}
                      data-testid="input-amenities"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate amenities with commas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Selected Amenities</Label>
                    <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md">
                      {amenitiesInput
                        .split(",")
                        .map((a) => a.trim())
                        .filter((a) => a)
                        .map((amenity, index) => (
                          <Badge key={index} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      {amenitiesInput
                        .split(",")
                        .map((a) => a.trim())
                        .filter((a) => a).length === 0 && (
                        <span className="text-sm text-muted-foreground italic">
                          No amenities added yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nearestTo">Nearest To (comma-separated)</Label>
                    <Textarea
                      id="nearestTo"
                      value={nearestToInput}
                      onChange={(e) => setNearestToInput(e.target.value)}
                      placeholder="Beach, Downtown, Restaurants, Shopping Mall, Airport, Train Station"
                      rows={3}
                      data-testid="input-nearest-to"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate locations with commas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Selected Nearby Locations</Label>
                    <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md">
                      {nearestToInput
                        .split(",")
                        .map((n) => n.trim())
                        .filter((n) => n)
                        .map((location, index) => (
                          <Badge key={index} variant="outline" className="border-blue-200">
                            {location}
                          </Badge>
                        ))}
                      {nearestToInput
                        .split(",")
                        .map((n) => n.trim())
                        .filter((n) => n).length === 0 && (
                        <span className="text-sm text-muted-foreground italic">
                          No nearby locations added yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <Link href="/sales">
              <Button variant="outline" type="button" disabled={isProcessing}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-primary"
              disabled={isProcessing}
              data-testid="button-save"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateProperty.isPending ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Media Manager Dialog */}
      <MediaManager
        open={mediaManagerOpen}
        onOpenChange={setMediaManagerOpen}
        media={formData.media || []}
        onMediaChange={handleMediaChange}
        uploadToR2={uploadToR2}
      />
    </Layout>
  );
}