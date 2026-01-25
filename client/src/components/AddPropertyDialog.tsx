// AddPropertyDialog.tsx
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Home, ArrowLeft, X, Image as ImageIcon, Video, Grid3x3, MapPin } from "lucide-react";
import { MediaManager } from "@/components/MediaManager";
import { uploadToR2 } from "@/lib/utils";
import {
  useCreateRentalProperty,
  useCreateSalesProperty,
  useCustomAmenities,
  useCustomNearestTo,
  useAddCustomAmenity,
  useAddCustomNearestTo,
  type MediaItem,
  type CreatePropertyInput
} from "@/store/query/property.queries";

const CURRENT_AGENT_ID = 1;

const RENTAL_SUGGESTED_AMENITIES = [
  "Pool", "WiFi", "Air Conditioning", "Parking", "Sea View", "Garden", 
  "BBQ", "Terrace", "Gym", "Pet Friendly", "Security", "Elevator",
  "Beachfront", "Heated Pool", "Private Parking"
];

const SALES_SUGGESTED_AMENITIES = [
  "Pool", "Garden", "Terrace", "Parking", "Sea View", "Security",
  "Gym", "Wine Cellar", "Home Office", "Guest House", "Golf View",
  "Beach Access", "Garage", "Infinity Pool", "Concierge"
];

const SUGGESTED_NEAREST_TO = [
  "Beach", "Downtown", "Restaurants", "Shopping Mall", "Supermarket",
  "Hospital", "School", "University", "Airport", "Train Station",
  "Bus Station", "Park", "Golf Course", "Marina", "Nightlife",
  "Cinema", "Gym", "Spa", "Museum", "Historical Site"
];

// Utility function to convert to months
function convertToMonths(value: number, unit: string) {
  switch (unit) {
    case 'days':
      return value / 30;   // approximate
    case 'weeks':
      return value / 4;    // approximate
    case 'months':
      return value;
    case 'years':
      return value * 12;
    default:
      return 0;
  }
}

interface AddPropertyDialogProps {
  children?: React.ReactNode;
  defaultType?: "rental" | "sale" | "choose";
  onSuccess?: () => void;
}

export function AddPropertyDialog({ 
  children, 
  defaultType = "choose",
  onSuccess 
}: AddPropertyDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "rental" | "sale">(defaultType === "choose" ? "choose" : defaultType);
  const [showMediaManager, setShowMediaManager] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    propertyType: "apartment",
    price: "",
    priceType: "night",
    beds: "",
    baths: "",
    sqm: "",
    licenseNumber: "",
    status: "draft" as "draft" | "published" | "archived",
    minimumStayValue: "1",
    minimumStayUnit: "month",
  });

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [selectedNearestTo, setSelectedNearestTo] = useState<string[]>([]);
  const [customNearestToInput, setCustomNearestToInput] = useState("");

  // TanStack Query hooks
  const { data: customAmenities = [] } = useCustomAmenities(CURRENT_AGENT_ID);
  const { data: customNearestTo = [] } = useCustomNearestTo(CURRENT_AGENT_ID);
  const addCustomAmenity = useAddCustomAmenity(CURRENT_AGENT_ID);
  const addCustomNearestTo = useAddCustomNearestTo(CURRENT_AGENT_ID);
  const createRentalProperty = useCreateRentalProperty();
  const createSalesProperty = useCreateSalesProperty();

  // Calculate classification based on minimum stay
  const classification = useMemo(() => {
    if (step !== "rental") return null;
    
    const value = parseFloat(formData.minimumStayValue);
    const unit = formData.minimumStayUnit;
    
    if (isNaN(value) || !unit) return null;
    
    const months = convertToMonths(value, unit);
    return months >= 3 ? "Long-Term" : "Short-Term";
  }, [formData.minimumStayValue, formData.minimumStayUnit, step]);

  // Handle form data changes
  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMinimumStayChange = (field: 'minimumStayValue' | 'minimumStayUnit', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      propertyType: "apartment",
      price: "",
      priceType: "night",
      beds: "",
      baths: "",
      sqm: "",
      licenseNumber: "",
      status: "draft",
      minimumStayValue: "1",
      minimumStayUnit: "month",
    });
    setMedia([]);
    setSelectedAmenities([]);
    setCustomAmenityInput("");
    setSelectedNearestTo([]);
    setCustomNearestToInput("");
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleNearestTo = (item: string) => {
    setSelectedNearestTo((prev) =>
      prev.includes(item)
        ? prev.filter((a) => a !== item)
        : [...prev, item]
    );
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (!trimmed) return;
    
    if (!selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed]);
    }
    
    const existsInCustom = customAmenities.some(
      (a: any) => a.name.toLowerCase() === trimmed.toLowerCase()
    );
    const existsInSuggested = 
      RENTAL_SUGGESTED_AMENITIES.some((a) => a.toLowerCase() === trimmed.toLowerCase()) ||
      SALES_SUGGESTED_AMENITIES.some((a) => a.toLowerCase() === trimmed.toLowerCase());
    
    if (!existsInCustom && !existsInSuggested) {
      addCustomAmenity.mutate(trimmed);
    }
    
    setCustomAmenityInput("");
  };

  const handleAddCustomNearestTo = () => {
    const trimmed = customNearestToInput.trim();
    if (!trimmed) return;
    
    if (!selectedNearestTo.includes(trimmed)) {
      setSelectedNearestTo((prev) => [...prev, trimmed]);
    }
    
    const existsInCustom = customNearestTo.some(
      (a: any) => a.name.toLowerCase() === trimmed.toLowerCase()
    );
    const existsInSuggested = SUGGESTED_NEAREST_TO.some((a) => a.toLowerCase() === trimmed.toLowerCase());
    
    if (!existsInCustom && !existsInSuggested) {
      addCustomNearestTo.mutate(trimmed);
    }
    
    setCustomNearestToInput("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setStep(defaultType === "choose" ? "choose" : defaultType);
      resetForm();
    } else {
      resetForm();
      setStep(defaultType === "choose" ? "choose" : defaultType);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseData: CreatePropertyInput = {
      agencyId: 1,
      createdById: CURRENT_AGENT_ID,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      propertyType: formData.propertyType,
      price: parseFloat(formData.price) || 0,
      beds: parseInt(formData.beds) || 0,
      baths: parseInt(formData.baths) || 0,
      sqm: parseInt(formData.sqm) || 0,
      amenities: selectedAmenities,
      nearestTo: selectedNearestTo,
      media: media,
      licenseNumber: formData.licenseNumber,
      status: formData.status,
    };

    if (step === "rental") {
      const rentalData = {
        ...baseData,
        priceType: formData.priceType,
        minimumStayValue: parseInt(formData.minimumStayValue) || 1,
        minimumStayUnit: formData.minimumStayUnit,
        classification: classification || "Short-Term", // Send classification to backend
      };
      createRentalProperty.mutate(rentalData, {
        onSuccess: () => {
          setOpen(false);
          onSuccess?.();
        }
      });
    } else if (step === "sale") {
      createSalesProperty.mutate(baseData, {
        onSuccess: () => {
          setOpen(false);
          onSuccess?.();
        }
      });
    }
  };

  const isLoading = createRentalProperty.isPending || createSalesProperty.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {children || (
            <Button className="bg-sidebar text-white hover:bg-sidebar/90 shadow-md gap-2" data-testid="button-add-property">
              <Plus className="h-4 w-4" />
              Add New Property
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative">
            <DialogTitle className="font-serif text-xl">
              {step === "choose" && "Add New Property"}
              {step === "rental" && "Add Rental Property"}
              {step === "sale" && "Add Property for Sale"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add a new property listing to your portfolio
            </DialogDescription>
            
            {/* Classification Badge - Top Right Corner */}
            {step === "rental" && classification && (
              <div className="absolute top-4 right-6">
                <Badge 
                  className={`
                    px-3 py-1 font-semibold text-sm
                    ${classification === "Long-Term" 
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                    }
                  `}
                  data-testid="classification-badge"
                >
                  {classification}
                </Badge>
              </div>
            )}
          </DialogHeader>

          {step === "choose" && (
            <div className="py-6">
              <p className="text-muted-foreground mb-6">What type of property would you like to list?</p>
              <RadioGroup
                defaultValue=""
                className="grid grid-cols-2 gap-4"
                onValueChange={(value) => setStep(value as "rental" | "sale")}
              >
                <div>
                  <RadioGroupItem value="rental" id="rental" className="peer sr-only" />
                  <Label
                    htmlFor="rental"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    data-testid="option-rental"
                  >
                    <Building2 className="mb-3 h-10 w-10 text-blue-500" />
                    <span className="text-lg font-semibold">Rental Property</span>
                    <span className="text-sm text-muted-foreground mt-1">Short-term vacation rentals</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="sale" id="sale" className="peer sr-only" />
                  <Label
                    htmlFor="sale"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    data-testid="option-sale"
                  >
                    <Home className="mb-3 h-10 w-10 text-green-500" />
                    <span className="text-lg font-semibold">Property for Sale</span>
                    <span className="text-sm text-muted-foreground mt-1">List property for purchase</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {(step === "rental" || step === "sale") && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {defaultType === "choose" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("choose")}
                  className="mb-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to selection
                </Button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
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

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Describe the property features and highlights..."
                    rows={3}
                    required
                    data-testid="input-description"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g., Marbella, Costa del Sol"
                    required
                    data-testid="input-location"
                  />
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => handleFormChange('propertyType', value)}
                  >
                    <SelectTrigger data-testid="select-property-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">
                    {step === "rental" ? "Price (€) *" : "Sale Price (€) *"}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    placeholder={step === "rental" ? "e.g., 250" : "e.g., 500000"}
                    required
                    min="0"
                    step="0.01"
                    data-testid="input-price"
                  />
                </div>

                {step === "rental" && (
                  <>
                    <div>
                      <Label htmlFor="priceType">Price Period *</Label>
                      <Select
                        value={formData.priceType}
                        onValueChange={(value) => handleFormChange('priceType', value)}
                      >
                        <SelectTrigger data-testid="select-price-type">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="night">Per Night</SelectItem>
                          <SelectItem value="week">Per Week</SelectItem>
                          <SelectItem value="month">Per Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minimumStayValue">Minimum Rental Duration *</Label>
                        <Input
                          id="minimumStayValue"
                          type="number"
                          value={formData.minimumStayValue}
                          onChange={(e) => handleMinimumStayChange('minimumStayValue', e.target.value)}
                          placeholder="e.g., 4"
                          required
                          min="1"
                          data-testid="input-minimum-stay-value"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimumStayUnit">Duration Unit *</Label>
                        <Select
                          value={formData.minimumStayUnit}
                          onValueChange={(value) => handleMinimumStayChange('minimumStayUnit', value)}
                        >
                          <SelectTrigger data-testid="select-minimum-stay-unit">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Classification Display below the fields */}
                      <div className="col-span-2 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Classification:</span>
                          {/* {classification && (
                            <Badge 
                              className={`
                                px-2 py-1 text-xs font-medium
                                ${classification === "Long-Term" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-green-100 text-green-800"
                                }
                              `}
                              data-testid="classification-indicator"
                            >
                              {classification} 
                              <span className="ml-1 text-xs opacity-75">
                                ({formData.minimumStayValue} {formData.minimumStayUnit} ≈ {
                                  Math.round(convertToMonths(
                                    parseFloat(formData.minimumStayValue) || 0, 
                                    formData.minimumStayUnit
                                  ) * 10) / 10
                                } months)
                              </span>
                            </Badge>
                          )} */}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {classification === "Long-Term" 
                            ? "Properties with 3+ months minimum stay are considered Long-Term"
                            : "Properties with less than 3 months minimum stay are considered Short-Term"
                          }
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleFormChange('licenseNumber', e.target.value)}
                    placeholder="e.g., VUT-MA-12345"
                    required
                    data-testid="input-license"
                  />
                </div>

                <div>
                  <Label htmlFor="beds">Bedrooms *</Label>
                  <Input
                    id="beds"
                    type="number"
                    value={formData.beds}
                    onChange={(e) => handleFormChange('beds', e.target.value)}
                    placeholder="e.g., 3"
                    required
                    min="0"
                    data-testid="input-beds"
                  />
                </div>

                <div>
                  <Label htmlFor="baths">Bathrooms *</Label>
                  <Input
                    id="baths"
                    type="number"
                    value={formData.baths}
                    onChange={(e) => handleFormChange('baths', e.target.value)}
                    placeholder="e.g., 2"
                    required
                    min="0"
                    data-testid="input-baths"
                  />
                </div>

                <div>
                  <Label htmlFor="sqm">Size (m²) *</Label>
                  <Input
                    id="sqm"
                    type="number"
                    value={formData.sqm}
                    onChange={(e) => handleFormChange('sqm', e.target.value)}
                    placeholder="e.g., 150"
                    required
                    min="0"
                    data-testid="input-sqm"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "draft" | "published" | "archived") => handleFormChange('status', value)}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Media</Label>
                  <div className="space-y-3">
                    {media.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {media.map((item, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-md overflow-hidden border">
                              {item.type === "image" ? (
                                <img 
                                  src={item.url} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <Video className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setMedia(prev => prev.filter((_, i) => i !== index));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed rounded-md">
                        <Grid3x3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No media added</p>
                      </div>
                    )}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMediaManager(true)}
                      className="w-full"
                      data-testid="button-manage-media"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Manage Media
                    </Button>
                  </div>
                </div>

                {/* Amenities Section */}
                <div className="md:col-span-2 space-y-3">
                  <Label className="flex items-center gap-2">
                    <span>Amenities</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedAmenities.length} selected
                    </Badge>
                  </Label>
                  
                  {selectedAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-xs text-emerald-700 w-full mb-1">Selected:</span>
                      {selectedAmenities.map((amenity) => (
                        <Badge
                          key={amenity}
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer gap-1"
                          onClick={() => toggleAmenity(amenity)}
                          data-testid={`badge-selected-amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {amenity}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Click to add:</span>
                    <div className="flex flex-wrap gap-2">
                      {(step === "rental" ? RENTAL_SUGGESTED_AMENITIES : SALES_SUGGESTED_AMENITIES).map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            selectedAmenities.includes(amenity) 
                              ? "bg-primary" 
                              : "hover:bg-primary/10"
                          }`}
                          onClick={() => toggleAmenity(amenity)}
                          data-testid={`badge-amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {customAmenities && customAmenities.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Your custom amenities:</span>
                      <div className="flex flex-wrap gap-2">
                        {customAmenities.map((amenity: any) => (
                          <Badge
                            key={amenity.id}
                            variant={selectedAmenities.includes(amenity.name) ? "default" : "secondary"}
                            className={`cursor-pointer transition-all ${
                              selectedAmenities.includes(amenity.name) 
                                ? "bg-primary" 
                                : "hover:bg-secondary/80"
                            }`}
                            onClick={() => toggleAmenity(amenity.name)}
                            data-testid={`badge-custom-amenity-${amenity.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {amenity.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom amenity..."
                      value={customAmenityInput}
                      onChange={(e) => setCustomAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomAmenity();
                        }
                      }}
                      data-testid="input-custom-amenity"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomAmenity}
                      disabled={!customAmenityInput.trim() || addCustomAmenity.isPending}
                      data-testid="button-add-custom-amenity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Nearest To Section */}
                <div className="md:col-span-2 space-y-3">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Nearest To</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedNearestTo.length} selected
                    </Badge>
                  </Label>
                  
                  {selectedNearestTo.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-xs text-blue-700 w-full mb-1">Selected:</span>
                      {selectedNearestTo.map((item) => (
                        <Badge
                          key={item}
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700 cursor-pointer gap-1"
                          onClick={() => toggleNearestTo(item)}
                          data-testid={`badge-selected-nearest-${item.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {item}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Click to add:</span>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_NEAREST_TO.map((item) => (
                        <Badge
                          key={item}
                          variant={selectedNearestTo.includes(item) ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            selectedNearestTo.includes(item) 
                              ? "bg-blue-500" 
                              : "hover:bg-blue-500/10 border-blue-300"
                          }`}
                          onClick={() => toggleNearestTo(item)}
                          data-testid={`badge-nearest-${item.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {customNearestTo.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Your custom locations:</span>
                      <div className="flex flex-wrap gap-2">
                        {customNearestTo.map((item: any) => (
                          <Badge
                            key={item.id}
                            variant={selectedNearestTo.includes(item.name) ? "default" : "secondary"}
                            className={`cursor-pointer transition-all ${
                              selectedNearestTo.includes(item.name) 
                                ? "bg-blue-500" 
                                : "hover:bg-secondary/80 border-blue-200"
                            }`}
                            onClick={() => toggleNearestTo(item.name)}
                            data-testid={`badge-custom-nearest-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom location (e.g., Central Park, Main Square)..."
                      value={customNearestToInput}
                      onChange={(e) => setCustomNearestToInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomNearestTo();
                        }
                      }}
                      data-testid="input-custom-nearest-to"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomNearestTo}
                      disabled={!customNearestToInput.trim() || addCustomNearestTo.isPending}
                      data-testid="button-add-custom-nearest-to"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add nearby attractions, transportation hubs, or important locations
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-submit"
                >
                  {isLoading ? "Creating..." : step === "rental" ? "Create Rental" : "Create Listing"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <MediaManager
        open={showMediaManager}
        onOpenChange={setShowMediaManager}
        media={media}
        onMediaChange={setMedia}
        uploadToR2={uploadToR2}
      />
    </>
  );
}