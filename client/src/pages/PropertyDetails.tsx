// src/pages/PropertyDetails.tsx
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, Calendar, Share2, Heart, Check, User, Mail, Phone, FileText, Loader2, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { AgentContactDialog } from "@/components/AgentContactDialog";
import { useToast } from "@/hooks/use-toast";
import {
  useRentalProperty,
  usePropertyAvailability,
  // useCreateBooking
} from "@/store/query/property.queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReactToPrint } from "react-to-print";
import { RentalListing } from "./Public/RentalsProperties";

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
        poster="/video-poster.jpg" // Optional: Add a poster image
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
          <div className="bg-primary/80 hover:bg-primary p-4 rounded-full">
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
  console.log('Current Media:', currentMedia);

  return (
    <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
      {/* Main Media Display */}
      <div className="w-full h-full">
        {media.length > 1 && currentMedia.type === 'video' && (
          <VideoPlayer src={currentMedia.url} title={currentMedia.title || 'Property Video'} />
        )}

        {media.length > 1 && currentMedia.type === 'image' && (
          <img
            src={currentMedia.url}
            alt={currentMedia.title || 'Property Image'}
            className="w-full h-full object-cover"
            
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
                ? 'bg-primary w-6'
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
                ? 'border-primary'
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

export default function PropertyDetails() {
  const params = useParams<{ id: string }>();
  const propertyId = parseInt(params.id || "0");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  /** ✅ IMPORTANT: ref must exist BEFORE printing */
  const printRef = useRef<HTMLDivElement>(null);

  /** ✅ FIX: use contentRef (NOT content()) */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `property-${propertyId}`,
    removeAfterPrint: true,
  });

  // Use TanStack Query hooks from your API
  const {
    data: propertyData,
    isLoading: propertyLoading,
    error: propertyError
  } = useRentalProperty(propertyId);

  // Extract property from response
  const property = propertyData?.data || propertyData?.property || propertyData;

  const {
    data: availabilityData = [],
    refetch: refetchAvailability
  } = usePropertyAvailability(propertyId);

  // Extract availability from response
  const availability = availabilityData?.data || availabilityData?.availability || availabilityData;

  // const createBookingMutation = useCreateBooking();

  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    (availability || []).forEach((a: any) => {
      if (a.isAvailable === 0 || a.isAvailable === false) {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
      }
    });
    return dates;
  }, [availability]);

  const isDateBooked = (date: Date) => {
    return bookedDates.some(d =>
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date: Date) => {
    if (!checkInDate) return false;
    if (checkInDate && !checkOutDate) {
      return date.getTime() === checkInDate.getTime();
    }
    if (checkInDate && checkOutDate) {
      return date >= checkInDate && date <= checkOutDate;
    }
    return false;
  };

  const isCheckIn = (date: Date) => {
    return checkInDate && date.getTime() === checkInDate.getTime();
  };

  const isCheckOut = (date: Date) => {
    return checkOutDate && date.getTime() === checkOutDate.getTime();
  };

  const handleDateClick = (date: Date) => {
    if (isPast(date) || isDateBooked(date)) return;

    if (!checkInDate) {
      setCheckInDate(date);
      setCheckOutDate(null);
    } else if (!checkOutDate) {
      if (date > checkInDate) {
        // Check if any dates in range are booked
        const hasBookedDates = bookedDates.some(d => d > checkInDate && d <= date);
        if (hasBookedDates) {
          toast({
            title: "Invalid Selection",
            description: "Selected range includes booked dates. Please choose different dates.",
            variant: "destructive",
          });
          return;
        }
        setCheckOutDate(date);
      } else {
        setCheckInDate(date);
        setCheckOutDate(null);
      }
    } else {
      setCheckInDate(date);
      setCheckOutDate(null);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const price = typeof property?.price === 'string' ? parseFloat(property.price) : property?.price || 0;
    return (nights * price).toFixed(2);
  };

  const handleBookNow = () => {
    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Select Dates",
        description: "Please select check-in and check-out dates from the calendar.",
        variant: "destructive",
      });
      return;
    }
    setBookingDialogOpen(true);
  };

  const handleSubmitBooking = () => {
    if (!clientName || !clientEmail || !clientPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
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
        // Fallback for older browsers
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

  /** ✅ FIX: small delay avoids ref timing race */
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
            <Link href="/properties">
              <Button className="bg-primary hover:bg-primary/90">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Properties
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

  // Format price with period
  const formatPrice = () => {
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
          <RentalListing prop_id={property.id} />
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/properties">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-primary" data-testid="text-property-title">{property.title}</h1>
            <div className="flex items-center text-muted-foreground mt-1">
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
          <div className="lg:col-span-2 space-y-6">
            {/* Media Slider Component */}
            <MediaSlider media={mediaItems} />

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">About this property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground" data-testid="text-property-description">{property.description}</p>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <Bed className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-beds">{property.beds || 0}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <Bath className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-baths">{property.baths || 0}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="text-center">
                    <Maximize2 className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-sqm">{property.sqm || 0}</p>
                    <p className="text-sm text-muted-foreground">m²</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold capitalize" data-testid="text-type">{property.propertyType}</p>
                    <p className="text-sm text-muted-foreground">Type</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities Card */}
            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nearest To Card */}
            {property.nearestTo && property.nearestTo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Nearest To</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.nearestTo.map((location: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{location}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Minimum Stay Info */}
            {property.minimumStayValue && property.minimumStayUnit && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Rental Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Stay</p>
                      <p className="text-lg font-semibold">
                        {property.minimumStayValue} {property.minimumStayUnit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Classification</p>
                      <Badge className={`
                        ${property.classification === 'Long-Term' ? 'bg-blue-500' : 'bg-green-500'}
                        text-white
                      `}>
                        {property.classification}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-serif">Availability Calendar</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Click to select check-in and check-out dates</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary border border-primary"></div>
                    <span>Selected</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    Previous
                  </Button>
                  <h3 className="text-lg font-semibold">
                    {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    Next
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(selectedMonth).map((date, i) => (
                    <div
                      key={i}
                      onClick={() => date && handleDateClick(date)}
                      className={`text-center py-2 rounded text-sm transition-all ${date
                        ? isPast(date)
                          ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
                          : isDateBooked(date)
                            ? 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed'
                            : isCheckIn(date) || isCheckOut(date)
                              ? 'bg-primary text-white border border-primary cursor-pointer font-semibold'
                              : isDateSelected(date)
                                ? 'bg-primary/20 text-primary border border-primary/30 cursor-pointer'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                        : ''
                        }`}
                      data-testid={date ? `calendar-date-${date.getDate()}` : undefined}
                    >
                      {date?.getDate() || ''}
                    </div>
                  ))}
                </div>

                {checkInDate && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Check-in:</span>
                      <Badge variant="outline" className="font-medium">
                        {checkInDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                    {checkOutDate && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Check-out:</span>
                          <Badge variant="outline" className="font-medium">
                            {checkOutDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Duration:</span>
                          <Badge className="bg-primary">{calculateNights()} nights</Badge>
                        </div>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setCheckInDate(null); setCheckOutDate(null); }}
                      className="ml-auto"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary" data-testid="text-price">{formatPrice()}</span>
                </div>
                {property.minimumStayValue && property.minimumStayUnit && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum stay: {property.minimumStayValue} {property.minimumStayUnit}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Check-in</label>
                    <input
                      type="date"
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      value={formatDate(checkInDate)}
                      readOnly
                      placeholder="Select from calendar"
                      data-testid="input-checkin"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Check-out</label>
                    <input
                      type="date"
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      value={formatDate(checkOutDate)}
                      readOnly
                      placeholder="Select from calendar"
                      data-testid="input-checkout"
                    />
                  </div>
                </div>

                {checkInDate && checkOutDate && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {typeof property.price === 'string' ? parseFloat(property.price) : property.price} x {calculateNights()} nights
                      </span>
                      <span>€{calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">€{calculateTotal()}</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-primary text-white"
                  size="lg"
                  onClick={handleBookNow}
                  disabled={!checkInDate || !checkOutDate}
                  data-testid="button-book-now"
                >
                  Book Now
                </Button>

                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Number</span>
                    <span className="font-medium">{property.licenseNumber || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        property.status === 'published' ? 'default' :
                          property.status === 'draft' ? 'secondary' :
                            'destructive'
                      }
                      className="capitalize"
                    >
                      {property.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Classification</span>
                    <Badge
                      className={`
                        ${property.classification === 'Long-Term' ? 'bg-blue-500' : 'bg-green-500'}
                        text-white
                      `}
                    >
                      {property.classification}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Information Card */}
            {property.agency && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Listed by</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {property.agency.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-medium" data-testid="text-agent-name">{property.agency.name}</p>
                      {property.createdBy && (
                        <p className="text-sm text-muted-foreground" data-testid="text-agent-agency">
                          Agent: {property.createdBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <AgentContactDialog
                      agent={{
                        name: property.agency.name,
                        email: property.createdBy?.email,
                        phone: property.createdBy?.phone,
                        agency: property.agency.name
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Complete Your Booking</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">{property.title}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Check-in:</span>
                  <p className="font-medium">{checkInDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>
                  <p className="font-medium">{checkOutDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>{calculateNights()} nights</span>
                <span className="text-primary">€{calculateTotal()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Information
              </h4>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="clientName">Full Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client's full name"
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
                    placeholder="client@example.com"
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
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBookingDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-white"
                onClick={handleSubmitBooking}
                // disabled={createBookingMutation.isPending}
                data-testid="button-confirm-booking"
              >
                {false ? "Creating..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}