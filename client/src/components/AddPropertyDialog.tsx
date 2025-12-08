import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import { Plus, Building2, Home, ArrowLeft } from "lucide-react";

const CURRENT_AGENT_ID = 1;

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
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    propertyType: "apartment",
    price: "",
    beds: "",
    baths: "",
    sqm: "",
    amenities: "",
    imageUrl: "",
    licenseNumber: "",
    status: "active",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      propertyType: "apartment",
      price: "",
      beds: "",
      baths: "",
      sqm: "",
      amenities: "",
      imageUrl: "",
      licenseNumber: "",
      status: "active",
    });
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

  const createRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create property");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${CURRENT_AGENT_ID}/properties`] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast.success("Rental property created successfully!");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create property");
    },
  });

  const createSalesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/sales-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create sales property");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${CURRENT_AGENT_ID}/sales-properties`] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-properties"] });
      toast.success("Sales property created successfully!");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create sales property");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amenitiesArray = formData.amenities
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const imagesArray = formData.imageUrl ? [formData.imageUrl] : [];

    const propertyData = {
      agentId: CURRENT_AGENT_ID,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      propertyType: formData.propertyType,
      price: parseFloat(formData.price) || 0,
      beds: parseInt(formData.beds) || 0,
      baths: parseInt(formData.baths) || 0,
      sqm: parseInt(formData.sqm) || 0,
      amenities: amenitiesArray,
      images: imagesArray,
      licenseNumber: formData.licenseNumber,
      status: formData.status,
    };

    if (step === "rental") {
      createRentalMutation.mutate(propertyData);
    } else if (step === "sale") {
      createSalesMutation.mutate(propertyData);
    }
  };

  const isLoading = createRentalMutation.isPending || createSalesMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-sidebar text-white hover:bg-sidebar/90 shadow-md gap-2" data-testid="button-add-property">
            <Plus className="h-4 w-4" />
            Add New Property
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {step === "choose" && "Add New Property"}
            {step === "rental" && "Add Rental Property"}
            {step === "sale" && "Add Property for Sale"}
          </DialogTitle>
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
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Marbella, Costa del Sol"
                  required
                  data-testid="input-location"
                />
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger data-testid="select-property-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">
                  {step === "rental" ? "Price per Night (€) *" : "Sale Price (€) *"}
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder={step === "rental" ? "e.g., 250" : "e.g., 500000"}
                  required
                  data-testid="input-price"
                />
              </div>

              <div>
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, baths: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, sqm: e.target.value })}
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
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="e.g., Pool, WiFi, Parking, Sea View, AC"
                  data-testid="input-amenities"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-image-url"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
  );
}
