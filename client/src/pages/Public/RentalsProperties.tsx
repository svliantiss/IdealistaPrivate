// src/components/public/RentalListing.tsx
import { useState, useRef, useEffect } from "react";
import { Heart, Share2, MapPin, Bed, Bath, Maximize2, Calendar, Clock, Check, ChevronLeft, ChevronRight, Building, Image as ImageIcon, Star, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePublicRentalProperty, usePublicSimilarRentalProperties } from "../../store/query/property.queries";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to get contrast color (black or white)
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#ffffff';
  
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Helper to generate gradient from primary color
const generateGradient = (color: string) => {
  return `linear-gradient(135deg, ${color}40 0%, ${color}20 50%, ${color}10 100%)`;
};

// Helper to generate hover color
const generateHoverColor = (color: string) => {
  return `${color}20`;
};

export function RentalListing() {
  const params = useParams();
  const rentalId = params?.id;
  const id = rentalId ? parseInt(rentalId) : null;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sidebarHeight, setSidebarHeight] = useState<number>(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Refs for elements that need dynamic colors
  const agencyLogoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const agencyNameRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const priceRef = useRef<HTMLDivElement>(null);
  const websiteLinkRef = useRef<HTMLAnchorElement>(null);
  const footerLogoRef = useRef<HTMLDivElement>(null);
  const footerNameRef = useRef<HTMLSpanElement>(null);

  const { data: property, isLoading, error } = usePublicRentalProperty(id!);
  const { data: similarProperties = [] } = usePublicSimilarRentalProperties(id!);
  
  // Get agency color
  const agencyColor = property?.agency?.primaryColor || '#7c3aed';
  const contrastColor = getContrastColor(agencyColor);
  const gradientBg = generateGradient(agencyColor);
  const hoverBg = generateHoverColor(agencyColor);

  useEffect(() => {
    if (sidebarRef.current && contentRef.current) {
      const updateSidebarHeight = () => {
        const contentHeight = contentRef.current?.offsetHeight || 0;
        const viewportHeight = window.innerHeight;
        const height = Math.min(contentHeight, viewportHeight);
        setSidebarHeight(height);
      };

      updateSidebarHeight();
      window.addEventListener('resize', updateSidebarHeight);
      return () => window.removeEventListener('resize', updateSidebarHeight);
    }
  }, [property, isLoading]);

  if (isLoading) return <RentalListingSkeleton agencyColor={agencyColor} />;
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-xl border">
          <Building className="h-20 w-20 mx-auto mb-4 text-gray-300" style={{ color: agencyColor }} />
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Property Not Found</h1>
          <p className="text-gray-600 mb-6">This rental property is no longer available.</p>
          <Link href="/">
            <Button 
              className="text-white font-semibold px-8 py-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${agencyColor}, ${agencyColor}cc)`,
                borderColor: agencyColor
              }}
            >
              Browse Properties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = () => {
    const price = property.price;
    if (property.classification === 'Long-Term') {
      return `€${price.toLocaleString('es-ES')}/month`;
    }
    return `€${price.toLocaleString('es-ES')}/night`;
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(!isFavorite ? "Added to favorites" : "Removed from favorites");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this rental: ${property.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const nextImage = () => {
    if (property.media.length > 0) {
      setCurrentImageIndex((prev) => prev === property.media.length - 1 ? 0 : prev + 1);
    }
  };

  const prevImage = () => {
    if (property.media.length > 0) {
      setCurrentImageIndex((prev) => prev === 0 ? property.media.length - 1 : prev - 1);
    }
  };

  const getCurrentImage = () => {
    return property.media[currentImageIndex]?.url || '';
  };

  const renderAmenities = () => {
    return property.amenities.slice(0, 12).map((amenity, index) => (
      <div 
        key={index} 
        className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm group"
        style={{ backgroundColor: index % 2 === 0 ? `${agencyColor}08` : 'transparent' }}
      >
        <div 
          className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${agencyColor}20`, color: agencyColor }}
        >
          <Check className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{amenity}</span>
      </div>
    ));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get gradient for badges
  const badgeGradient = `linear-gradient(135deg, ${agencyColor} 0%, ${agencyColor}dd 100%)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Gradient Header */}
      <header className="sticky top-0 z-50 border-b shadow-lg backdrop-blur-lg bg-white/90">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {property.agency.logo ? (
                <div className="relative">
                  <img
                    src={property.agency.logo}
                    alt={property.agency.name}
                    className="h-10 w-10 object-contain rounded-xl border-2 p-1"
                    style={{ borderColor: agencyColor }}
                  />
                </div>
              ) : (
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ 
                    background: badgeGradient,
                    color: contrastColor
                  }}
                >
                  <span className="font-bold text-lg">{property.agency.name.charAt(0)}</span>
                </div>
              )}
              <span 
                className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
              >
                {property.agency.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full h-10 w-10 transition-all duration-300 hover:scale-110 ${isFavorite ? 'text-red-500' : 'text-gray-600'}`}
                onClick={handleFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current animate-pulse' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 transition-all duration-300 hover:scale-110 text-gray-600"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8" ref={contentRef}>
            {/* Image Gallery with Gradient Overlay */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl group">
              {property.media.length > 0 ? (
                <>
                  <div className="relative w-full h-[550px] overflow-hidden">
                    <img
                      src={getCurrentImage()}
                      alt={property.title}
                      className="w-full h-full object-cover transition-all duration-700 ease-out transform group-hover:scale-110"
                      key={currentImageIndex}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  
                  {/* Navigation Arrows */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white border-none shadow-xl h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    onClick={prevImage}
                    style={{ color: agencyColor }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white border-none shadow-xl h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    onClick={nextImage}
                    style={{ color: agencyColor }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.media.slice(0, 8).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 w-8 rounded-full transition-all duration-300 ${
                          index === currentImageIndex 
                            ? 'shadow-lg' 
                            : 'opacity-50 hover:opacity-75'
                        }`}
                        style={{ 
                          backgroundColor: index === currentImageIndex ? agencyColor : 'white'
                        }}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Property Badge */}
                  <div className="absolute top-6 left-6">
                    <Badge className="px-4 py-2 rounded-full font-semibold shadow-lg border-0"
                      style={{ 
                        background: badgeGradient,
                        color: contrastColor
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Premium Rental
                    </Badge>
                  </div>

                  {/* Image Counter */}
                  <div className="absolute top-6 right-6">
                    <Badge variant="outline" className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white border-white/30">
                      {currentImageIndex + 1} / {property.media.length}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="w-full h-[550px] flex items-center justify-center" style={{ background: gradientBg }}>
                  <Building className="h-32 w-32" style={{ color: agencyColor }} />
                </div>
              )}
            </div>

            {/* Property Header */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">{property.title}</h1>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-5 w-5" style={{ color: agencyColor }} />
                      <span className="text-lg font-medium">{property.location}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="px-4 py-2 text-sm border-2" style={{ borderColor: agencyColor, color: agencyColor }}>
                    {property.classification || 'Rental'}
                  </Badge>
                </div>

                {/* Price Display with Gradient */}
                <div className="mb-8 p-6 rounded-2xl shadow-lg"
                  style={{ background: gradientBg }}
                >
                  <div 
                    className="text-5xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                  >
                    {formatPrice()}
                  </div>
                  {property.minimumStayValue > 0 && (
                    <p className="text-gray-700 font-medium">
                      <Clock className="inline h-4 w-4 mr-2" style={{ color: agencyColor }} />
                      Minimum stay: {property.minimumStayValue} {property.minimumStayUnit}
                    </p>
                  )}
                </div>
              </div>

              {/* Property Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Bed, label: 'Bedrooms', value: property.beds, color: agencyColor },
                  { icon: Bath, label: 'Bathrooms', value: property.baths, color: agencyColor },
                  { icon: Maximize2, label: 'Area', value: `${property.sqm} m²`, color: agencyColor },
                  { icon: Building, label: 'Type', value: property.propertyType, color: agencyColor },
                ].map((item, index) => (
                  <div 
                    key={index}
                    className="text-center p-5 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border"
                    style={{ 
                      backgroundColor: index % 2 === 0 ? `${agencyColor}05` : 'white',
                      borderColor: `${agencyColor}20`
                    }}
                  >
                    <item.icon className="h-8 w-8 mx-auto mb-3" style={{ color: agencyColor }} />
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                    <div className="text-sm font-medium text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stacked Sections */}
            <div className="space-y-8">
              {/* Description Section */}
              <section className="rounded-2xl overflow-hidden shadow-xl border"
                style={{ borderColor: `${agencyColor}20`, background: 'white' }}
              >
                <div className="p-1" style={{ background: badgeGradient }}></div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{ background: gradientBg, color: agencyColor }}
                    >
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Description</h2>
                      <p className="text-gray-500">Learn more about this beautiful property</p>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line text-lg leading-relaxed">
                    {property.description || "No description provided."}
                  </p>
                </div>
              </section>

              {/* Amenities Section */}
              {property.amenities && property.amenities.length > 0 && (
                <section className="rounded-2xl overflow-hidden shadow-xl border"
                  style={{ borderColor: `${agencyColor}20`, background: 'white' }}
                >
                  <div className="p-1" style={{ background: badgeGradient }}></div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center"
                        style={{ background: gradientBg, color: agencyColor }}
                      >
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Amenities & Features</h2>
                        <p className="text-gray-500">Everything this property has to offer</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {renderAmenities()}
                    </div>
                    {property.amenities.length > 12 && (
                      <div className="mt-6 pt-6 border-t" style={{ borderColor: `${agencyColor}20` }}>
                        <p className="text-sm font-medium" style={{ color: agencyColor }}>
                          +{property.amenities.length - 12} more amenities available
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Additional Images Section */}
              {property.media.length > 1 && (
                <section className="rounded-2xl overflow-hidden shadow-xl border"
                  style={{ borderColor: `${agencyColor}20`, background: 'white' }}
                >
                  <div className="p-1" style={{ background: badgeGradient }}></div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center"
                        style={{ background: gradientBg, color: agencyColor }}
                      >
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Gallery</h2>
                        <p className="text-gray-500">Explore all photos of this property</p>
                      </div>
                      <Badge className="ml-auto" style={{ background: badgeGradient, color: contrastColor }}>
                        {property.media.length} images
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.media.map((media, index) => (
                        <div
                          key={index}
                          className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-2 ${
                            index === currentImageIndex ? 'ring-4 shadow-2xl' : 'shadow-lg hover:shadow-2xl'
                          }`}
                          style={{ 
                            borderColor: index === currentImageIndex ? agencyColor : 'transparent',
                            borderWidth: index === currentImageIndex ? '4px' : '0'
                          }}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img
                            src={media.url}
                            alt={`${property.title} - Image ${index + 1}`}
                            className="w-full h-56 object-cover hover:scale-110 transition-transform duration-500"
                          />
                          {index === currentImageIndex && (
                            <div className="absolute inset-0 flex items-center justify-center"
                              style={{ backgroundColor: `${agencyColor}20` }}
                            >
                              <Badge className="absolute top-3 right-3 px-3 py-1.5 rounded-full shadow-lg"
                                style={{ background: badgeGradient, color: contrastColor }}
                              >
                                Active
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Similar Properties */}
            {similarProperties.length > 0 && (
              <div className="space-y-8 mt-12 pt-12 border-t" style={{ borderColor: `${agencyColor}20` }}>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8" style={{ color: agencyColor }} />
                  <h2 className="text-2xl font-bold text-gray-900">Similar Properties</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {similarProperties.slice(0, 4).map((similar) => (
                    <Link key={similar.id} href={`/rentals/${similar.id}`}>
                      <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border hover:-translate-y-2 overflow-hidden group"
                        style={{ borderColor: `${agencyColor}20` }}
                      >
                        <CardContent className="p-0">
                          <div className="relative">
                            {similar.thumbnail ? (
                              <img
                                src={similar.thumbnail}
                                alt={similar.title}
                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-48 flex items-center justify-center"
                                style={{ background: gradientBg }}
                              >
                                <Building className="h-16 w-16" style={{ color: agencyColor }} />
                              </div>
                            )}
                            <Badge className="absolute top-3 left-3 px-3 py-1.5 rounded-full shadow-lg"
                              style={{ background: badgeGradient, color: contrastColor }}
                            >
                              Similar
                            </Badge>
                          </div>
                          <div className="p-6">
                            <h3 className="font-semibold text-lg line-clamp-1 mb-2 group-hover:text-gray-900">{similar.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-1 mb-4">{similar.location}</p>
                            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Bed className="h-4 w-4" style={{ color: agencyColor }} />
                                <span>{similar.beds}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bath className="h-4 w-4" style={{ color: agencyColor }} />
                                <span>{similar.baths}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Maximize2 className="h-4 w-4" style={{ color: agencyColor }} />
                                <span>{similar.sqm} m²</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xl font-bold" style={{ color: agencyColor }}>
                                €{similar.price.toLocaleString('es-ES')}/{similar.priceType}
                              </div>
                              <Button 
                                size="sm" 
                                className="rounded-full px-4 transition-all duration-300 hover:scale-105"
                                style={{ 
                                  background: badgeGradient,
                                  color: contrastColor
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar (Sticky) */}
          <div className="lg:col-span-1">
            <div
              ref={sidebarRef}
              style={{
                position: 'sticky',
                top: 'calc(72px + 2rem)',
                height: sidebarHeight > 0 ? `${sidebarHeight}px` : 'auto',
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 72px - 2rem)'
              }}
              className="space-y-6"
            >
              {/* Agency Information Card */}
              <Card className="border-0 shadow-xl overflow-hidden"
                style={{ borderColor: `${agencyColor}20`, background: 'white' }}
              >
                <div className="p-1" style={{ background: badgeGradient }}></div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <Shield className="h-5 w-5" style={{ color: agencyColor }} />
                    Agency Information
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      {property.agency.logo ? (
                        <div className="relative">
                          <img
                            src={property.agency.logo}
                            alt={property.agency.name}
                            className="h-16 w-16 object-contain rounded-xl border-2 p-1"
                            style={{ borderColor: agencyColor }}
                          />
                        </div>
                      ) : (
                        <div 
                          className="h-16 w-16 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ 
                            background: badgeGradient,
                            color: contrastColor
                          }}
                        >
                          <span className="font-bold text-2xl">{property.agency.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-lg">{property.agency.name}</h4>
                        <p className="text-sm text-gray-600">Verified Agency</p>
                        <Badge className="mt-1 px-2 py-0.5 text-xs" style={{ background: `${agencyColor}20`, color: agencyColor }}>
                          <Star className="h-2 w-2 mr-1 inline" />
                          Trusted Partner
                        </Badge>
                      </div>
                    </div>

                    <Separator style={{ backgroundColor: `${agencyColor}20` }} />

                    <div className="space-y-4 text-sm">
                      {property.agency.phone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all duration-200"
                          style={{ backgroundColor: hoverBg }}
                        >
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${agencyColor}20`, color: agencyColor }}
                          >
                            <span className="font-bold">P</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Phone</span>
                            <span className="font-medium">{property.agency.phone}</span>
                          </div>
                        </div>
                      )}
                      {property.agency.email && (
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all duration-200"
                          style={{ backgroundColor: hoverBg }}
                        >
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${agencyColor}20`, color: agencyColor }}
                          >
                            <span className="font-bold">@</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Email</span>
                            <span className="font-medium">{property.agency.email}</span>
                          </div>
                        </div>
                      )}
                      {property.agency.website && (
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition-all duration-200"
                          style={{ backgroundColor: hoverBg }}
                        >
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${agencyColor}20`, color: agencyColor }}
                          >
                            <span className="font-bold">W</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block text-xs">Website</span>
                            <a
                              href={property.agency.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline block"
                              style={{ color: agencyColor }}
                            >
                              Visit website
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    
                  </div>
                </CardContent>
              </Card>

              {/* Property Quick Info */}
              <Card className="border-0 shadow-xl overflow-hidden"
                style={{ borderColor: `${agencyColor}20`, background: 'white' }}
              >
                <div className="p-1" style={{ background: badgeGradient }}></div>
                <CardContent className="p-6">
                  <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Zap className="h-5 w-5" style={{ color: agencyColor }} />
                    Property Details
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Reference', value: `#${property.id}` },
                      { label: 'Published', value: new Date(property.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                      { label: 'Type', value: property.propertyType },
                      { label: 'Classification', value: property.classification || 'Not specified' },
                      { label: 'License', value: property.licenseNumber || 'Not specified' },
                    ].map((item, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:shadow-sm"
                        style={{ backgroundColor: index % 2 === 0 ? `${agencyColor}05` : 'transparent' }}
                      >
                        <span className="text-gray-600 font-medium">{item.label}</span>
                        <span className="font-bold" style={{ color: agencyColor }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Nearby Locations */}
              {property.nearestTo && property.nearestTo.length > 0 && (
                <Card className="border-0 shadow-xl overflow-hidden"
                  style={{ borderColor: `${agencyColor}20`, background: 'white' }}
                >
                  <div className="p-1" style={{ background: badgeGradient }}></div>
                  <CardContent className="p-6">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <MapPin className="h-5 w-5" style={{ color: agencyColor }} />
                      Nearby Locations
                    </h4>
                    <div className="space-y-3">
                      {property.nearestTo.slice(0, 5).map((location, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm group"
                          style={{ backgroundColor: index % 2 === 0 ? `${agencyColor}05` : 'transparent' }}
                        >
                          <div 
                            className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${agencyColor}20`, color: agencyColor }}
                          >
                            <Clock className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium group-hover:text-gray-900">{location}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Gradient Footer */}
      <footer className="mt-12 border-t" style={{ borderColor: `${agencyColor}20` }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                {property.agency.logo ? (
                  <div className="relative">
                    <img
                      src={property.agency.logo}
                      alt={property.agency.name}
                      className="h-10 w-10 object-contain rounded-xl border-2 p-1"
                      style={{ borderColor: agencyColor }}
                    />
                  </div>
                ) : (
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ 
                      background: badgeGradient,
                      color: contrastColor
                    }}
                  >
                    <span className="font-bold text-lg">{property.agency.name.charAt(0)}</span>
                  </div>
                )}
                <span 
                  className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
                >
                  {property.agency.name}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Professional property listing by {property.agency.name}
              </p>
            </div>
            <div className="text-center md:text-right">
              {property.agent && (
                <p className="mb-2 font-medium" style={{ color: agencyColor }}>
                  <Shield className="inline h-4 w-4 mr-2" />
                  Agent: {property.agent.name}
                </p>
              )}
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} {property.agency.name}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Skeleton loader with gradient
function RentalListingSkeleton({ agencyColor = '#7c3aed' }: { agencyColor?: string }) {
  const gradient = `linear-gradient(135deg, ${agencyColor}10 0%, ${agencyColor}05 50%, ${agencyColor}10 100%)`;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-8 w-48" style={{ background: gradient }} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="w-full h-[550px] rounded-2xl" style={{ background: gradient }} />
            <Skeleton className="w-full h-32 rounded-2xl" style={{ background: gradient }} />
            <Skeleton className="w-full h-64 rounded-2xl" style={{ background: gradient }} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="w-full h-80 rounded-2xl" style={{ background: gradient }} />
            <Skeleton className="w-full h-60 rounded-2xl" style={{ background: gradient }} />
          </div>
        </div>
      </main>
    </div>
  );
}