// src/pages/SalesPropertyDetails.tsx
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, Calendar, Share2, Heart, Check, User, Mail, Phone, FileText, Euro, Building2, Home, Tag, Layers, CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import { AgentContactDialog } from "@/components/AgentContactDialog";
import { useToast } from "@/hooks/use-toast";
import { useSalesProperty } from "./../store/query/property.queries";

export default function SalesPropertyDetails() {
  const params = useParams<{ id: string }>();
  const propertyId = parseInt(params.id || "0");
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [financing, setFinancing] = useState<boolean>(false);
  const { toast } = useToast();

  // Use TanStack Query hook for sales property
  const {
    data: propertyData,
    isLoading: propertyLoading,
    error: propertyError
  } = useSalesProperty(propertyId);

  // Extract property from response
  const property = propertyData?.data || propertyData?.property || propertyData;

  const handleSubmitInquiry = () => {
    if (!clientName || !clientEmail || !clientPhone || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally send the inquiry to your backend
    // For now, we'll just show a success message
    toast({
      title: "Inquiry Sent!",
      description: "Your inquiry has been sent to the agent. They will contact you soon.",
      variant: "default",
    });

    // Reset form and close dialog
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setMessage("");
    setBudget("");
    setTimeline("");
    setFinancing(false);
    setInquiryDialogOpen(false);
  };

  if (propertyLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading property details...</div>
        </div>
      </Layout>
    );
  }

  if (propertyError || !property) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Property not found</h2>
            <p className="text-muted-foreground mb-4">The property you're looking for doesn't exist or has been removed.</p>
            <Link href="/sales">
              <Button className="bg-secondary hover:bg-secondary/90">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sales Properties
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Get property image
  const getPropertyImage = () => {
    if (property.media && property.media.length > 0) {
      return property.media[0].url;
    }
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    return '/placeholder.jpg';
  };

  // Format price
  const formatPrice = () => {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
    return `€${price.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate price per square meter
  const calculatePricePerSqm = () => {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
    const sqm = property.sqm || 1; // Avoid division by zero
    const pricePerSqm = price / sqm;
    return `€${pricePerSqm.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/m²`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get property type icon
  const getPropertyTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'villa': <Building2 className="h-4 w-4" />,
      'house': <Home className="h-4 w-4" />,
      'apartment': <Building2 className="h-4 w-4" />,
      'condo': <Building2 className="h-4 w-4" />,
      'townhouse': <Home className="h-4 w-4" />,
      'studio': <Building2 className="h-4 w-4" />,
    };
    return icons[type] || <Home className="h-4 w-4" />;
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/sales">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-serif font-bold text-primary" data-testid="text-property-title">{property.title}</h1>
              <Badge className={`
                ${property.status === 'published' ? 'bg-green-500' : 
                  property.status === 'draft' ? 'bg-blue-500' : 
                  'bg-gray-500'
                } text-white capitalize
              `}>
                {property.status}
              </Badge>
              {property.status === 'sold' && (
                <Badge className="bg-red-500 text-white">
                  Sold
                </Badge>
              )}
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span data-testid="text-property-location">{property.location}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="aspect-[16/9] rounded-lg overflow-hidden">
              <img
                src={getPropertyImage()}
                alt={property.title}
                className="w-full h-full object-cover"
                data-testid="img-property-main"
              />
            </div>

            {/* Additional Images Gallery */}
            {property.media && property.media.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {property.media.slice(1, 5).map((media: any, index: number) => (
                  <div key={index} className="aspect-square rounded-md overflow-hidden">
                    <img
                      src={media.url}
                      alt={`${property.title} - Image ${index + 2}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Property Description */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Property Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground" data-testid="text-property-description">{property.description}</p>

                {/* Key Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getPropertyTypeIcon(property.propertyType)}
                      <span className="text-lg font-bold" data-testid="text-type">{property.propertyType}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Property Type</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Bed className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-beds">{property.beds || 0}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Bath className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-baths">{property.baths || 0}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Maximize2 className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-sqm">{property.sqm || 0}</p>
                    <p className="text-sm text-muted-foreground">Square Meters</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Price Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2 p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Asking Price</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{formatPrice()}</p>
                  </div>
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Price per m²</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{calculatePricePerSqm()}</p>
                  </div>
                  <div className="space-y-2 p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Listed On</span>
                    </div>
                    <p className="text-lg font-bold text-purple-700">{formatDate(property.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities Card */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Amenities & Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location & Nearby */}
            {property.nearestTo && property.nearestTo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Location & Nearby</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.nearestTo.map((location: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{location}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Property Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {property.licenseNumber && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Property License</span>
                      </div>
                      <Badge variant="outline">{property.licenseNumber}</Badge>
                    </div>
                  )}
                  {/* Add more document sections as needed */}
                  <div className="text-sm text-muted-foreground italic">
                    Additional property documents available upon request. Contact the agent for more information.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Price & Action Card */}
            <Card className="sticky top-8">
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary" data-testid="text-price">{formatPrice()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {property.sqm ? `${property.sqm} m² • ${calculatePricePerSqm()}` : 'Price negotiable'}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90 text-white"
                  size="lg"
                  onClick={() => setInquiryDialogOpen(true)}
                  data-testid="button-inquire"
                >
                  Make an Inquiry
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Agent
                </Button>

                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property ID</span>
                    <span className="font-mono font-medium">#{property.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium capitalize">{property.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Listed On</span>
                    <span className="font-medium">{formatDate(property.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">{formatDate(property.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        property.status === 'published' ? 'default' :
                          property.status === 'draft' ? 'secondary' :
                            property.status === 'sold' ? 'destructive' :
                              'outline'
                      }
                      className="capitalize"
                    >
                      {property.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Information Card */}
            {property.agency && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Listing Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {property.createdBy?.name?.charAt(0) || property.agency.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-medium" data-testid="text-agent-name">
                          {property.createdBy?.name || 'Agent Name'}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid="text-agent-agency">
                          {property.agency.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {property.createdBy?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{property.createdBy.email}</span>
                        </div>
                      )}
                      {property.createdBy?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{property.createdBy.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <AgentContactDialog
                        agent={{
                          name: property.createdBy?.name || 'Agent',
                          email: property.createdBy?.email,
                          phone: property.createdBy?.phone,
                          agency: property.agency.name
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Viewing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Schedule a Viewing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Interested in viewing this property? Contact the agent to schedule a visit.
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setInquiryDialogOpen(true)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Request Viewing
                </Button>
              </CardContent>
            </Card>

            {/* Similar Properties (Placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Similar Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground italic">
                    View similar properties in the same area.
                  </p>
                  <Link href="/sales">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      <Layers className="mr-2 h-4 w-4" />
                      Browse All Properties
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Inquiry Dialog */}
      <Dialog open={inquiryDialogOpen} onOpenChange={setInquiryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Property Inquiry</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Interested in {property.title}? Fill out the form below and the agent will contact you.
            </p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">{property.title}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{formatPrice()}</span>
                <span className="text-sm text-muted-foreground">
                  {property.sqm && `${property.sqm} m²`}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Information
              </h4>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="clientName">Full Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter your full name"
                    data-testid="input-client-name"
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail">Email Address *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="your@email.com"
                    data-testid="input-client-email"
                  />
                </div>

                <div>
                  <Label htmlFor="clientPhone">Phone Number *</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    data-testid="input-client-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Budget Range (Optional)</Label>
                  <Input
                    id="budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g., €300,000 - €350,000"
                  />
                </div>

                <div>
                  <Label htmlFor="timeline">Purchase Timeline (Optional)</Label>
                  <Input
                    id="timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g., 1-3 months, ASAP, etc."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="financing"
                    checked={financing}
                    onChange={(e) => setFinancing(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="financing" className="text-sm">
                    I need financing/mortgage assistance
                  </Label>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your interest in this property, ask questions, or request additional information..."
                    rows={4}
                    data-testid="input-message"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setInquiryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
                onClick={handleSubmitInquiry}
                data-testid="button-submit-inquiry"
              >
                Send Inquiry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}