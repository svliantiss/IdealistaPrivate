// src/pages/SalesPropertyDetails.tsx
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalesListing } from "./Public/SalesProperties";
import { Textarea } from "@/components/ui/textarea";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, Calendar, Share2, Heart, Check, User, Mail, Phone, FileText, Euro, Building2, Home, Tag, Layers, CalendarDays, Clock, Play, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { AgentContactDialog } from "@/components/AgentContactDialog";
import { useToast } from "@/hooks/use-toast";
import { useSalesProperty } from "./../store/query/property.queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReactToPrint } from "react-to-print";

// Video Player Component
const VideoPlayer = ({ src, title }: { src: string; title: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        controls
        preload="metadata"
        poster="/video-poster.jpg"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
        >
          <div className="bg-secondary/80 hover:bg-secondary p-4 rounded-full">
            <Play className="h-8 w-8 text-white" />
          </div>
        </button>
      )}
    </div>
  );
};

// Media Slider Component
const MediaSlider = ({ media }: { media: Array<{ url: string; type: string; title?: string }> }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted">
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-muted-foreground">No media available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? media.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentMedia = media[currentIndex];

  return (
    <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
      {/* Main Media Display */}
      <div className="w-full h-full">
        {currentMedia.type === 'video' ? (
          <VideoPlayer src={currentMedia.url} title={currentMedia.title || 'Property Video'} />
        ) : (
          <img
            src={currentMedia.url}
            alt={currentMedia.title || 'Property Image'}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        )}
      </div>

      {/* Navigation Arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Media Type Indicator */}
      <div className="absolute top-4 right-4">
        <Badge className="bg-black/70 text-white backdrop-blur-sm">
          {currentMedia.type === 'video' ? 'Video' : 'Image'} {currentIndex + 1}/{media.length}
        </Badge>
      </div>

      {/* Thumbnail Navigation */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                  ? 'bg-secondary w-6'
                  : 'bg-white/60 hover:bg-white'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnails Preview */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          {media.slice(0, 4).map((item, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${index === currentIndex
                  ? 'border-secondary'
                  : 'border-transparent hover:border-white/50'
                }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-black/50 flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              )}
            </button>
          ))}
          {media.length > 4 && (
            <div className="w-16 h-12 rounded bg-black/50 flex items-center justify-center text-white text-sm">
              +{media.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  /** IMPORTANT: ref must exist BEFORE printing */
  const printRef = useRef<HTMLDivElement>(null);

  /** FIX: use contentRef (NOT content()) */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `sales-property-${propertyId}`,
    removeAfterPrint: true,
  });

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

    toast({
      title: "Inquiry Sent!",
      description: "Your inquiry has been sent to the agent. They will contact you soon.",
      variant: "default",
    });

    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setMessage("");
    setBudget("");
    setTimeline("");
    setFinancing(false);
    setInquiryDialogOpen(false);
  };

  const handleSharePublicLink = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: property?.title || 'Property Listing',
        text: `Check out this property: ${property?.title}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link copied!",
          description: "Property link has been copied to clipboard.",
        });
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "Link copied!",
          description: "Property link has been copied to clipboard.",
        });
      });
    }
    setShareDropdownOpen(false);
  };

  /** FIX: small delay avoids ref timing race */
  const handleDownloadPDF = () => {
    if (!property) {
      toast({
        title: "Error",
        description: "Property not loaded",
        variant: "destructive",
      });
      return;
    }

    setShareDropdownOpen(false);
    setIsGeneratingPDF(true);

    toast({
      title: "Generating PDF...",
      description: "Please wait while we prepare your document.",
    });

    setTimeout(() => {
      handlePrint();
      setIsGeneratingPDF(false);
      toast({
        title: "PDF downloaded!",
        description: "Property details have been saved as PDF.",
      });
    }, 100);
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

  // Get all media items (images and videos)
  const getMediaItems = () => {
    const mediaItems: Array<{ url: string; type: string; title?: string }> = [];

    // Check property.media array first (assuming it has type property)
    if (property.media && Array.isArray(property.media)) {
      property.media.forEach((item: any) => {
        if (item.url) {
          const url = item.url.toLowerCase();
          const type = url.match(/\.(mp4|webm|ogg|mov|avi)$/) ? 'video' : 'image';
          mediaItems.push({
            url: item.url,
            type: item.type || type,
            title: item.title || item.description
          });
        }
      });
    }

    // Also check property.images array for backward compatibility
    if (property.images && Array.isArray(property.images)) {
      property.images.forEach((url: string) => {
        if (url) {
          mediaItems.push({
            url,
            type: 'image',
            title: 'Property Image'
          });
        }
      });
    }

    // Check for videos property if exists
    if (property.videos && Array.isArray(property.videos)) {
      property.videos.forEach((video: string | any) => {
        if (typeof video === 'string') {
          mediaItems.push({
            url: video,
            type: 'video',
            title: 'Property Video'
          });
        } else if (video && video.url) {
          mediaItems.push({
            url: video.url,
            type: 'video',
            title: video.title || 'Property Video'
          });
        }
      });
    }

    // If no media found, use placeholder
    if (mediaItems.length === 0) {
      mediaItems.push({
        url: '/placeholder.jpg',
        type: 'image',
        title: 'Property Image'
      });
    }

    return mediaItems;
  };

  // Format price
  const formatPrice = () => {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
    return `€${price.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate price per square meter
  const calculatePricePerSqm = () => {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
    const sqm = property.sqm || 1;
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

  const mediaItems = getMediaItems();

  return (
    <Layout>
      {/* ================= PRINTABLE CONTENT (MUST BE MOUNTED) ================= */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <div ref={printRef}>
          <SalesListing prop_id={property.id} />
        </div>
      </div>

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
              <h1 className="text-3xl font-serif font-bold text-secondary" data-testid="text-property-title">{property.title}</h1>
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
            <DropdownMenu open={shareDropdownOpen} onOpenChange={setShareDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isGeneratingPDF}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleSharePublicLink}
                  className="cursor-pointer"
                  disabled={isGeneratingPDF}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share Public Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadPDF}
                  className="cursor-pointer"
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Slider Component */}
            <MediaSlider media={mediaItems} />

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
                    <Bed className="h-6 w-6 mx-auto text-secondary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-beds">{property.beds || 0}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Bath className="h-6 w-6 mx-auto text-secondary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-baths">{property.baths || 0}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Maximize2 className="h-6 w-6 mx-auto text-secondary mb-2" />
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
                    <span className="text-3xl font-bold text-secondary" data-testid="text-price">{formatPrice()}</span>
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
                      <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
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
                <span className="text-2xl font-bold text-secondary">{formatPrice()}</span>
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