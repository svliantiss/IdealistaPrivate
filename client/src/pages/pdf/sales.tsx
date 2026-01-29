// src/components/public/SalesListingPDF.tsx
import React, { useEffect, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Link,
  PDFViewer,
  PDFDownloadLink
} from "@react-pdf/renderer";

// Register Inter font with bold variant
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf" },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf", fontWeight: 700 }
  ]
});

// Helper function to get contrast color
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return "#ffffff";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// Service configuration
const IMAGE_SERVICE_URL = process.env.REACT_APP_IMAGE_SERVICE_URL || 'http://localhost:3003/api';

// Image conversion service function
const convertWebPToPNG = async (url: string): Promise<string> => {
  if (!url || url.startsWith('data:')) {
    return url;
  }

  try {
    const params = new URLSearchParams({
      url: encodeURI(url),
      format: 'png',
      quality: '90'
    });

    const response = await fetch(`${IMAGE_SERVICE_URL}/convert?${params}`);
    
    if (!response.ok) {
      throw new Error(`Conversion failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.dataUrl) {
      return data.dataUrl;
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.warn('Image conversion service failed, falling back to direct fetch:', error);
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fallbackError) {
      console.error('All conversion methods failed:', fallbackError);
      return '';
    }
  }
};

// Main image processing function
const getBase64Image = async (url: string): Promise<string> => {
  if (!url || url.trim() === '' || url === "undefined" || url === "null") {
    console.warn("Empty or invalid image URL provided");
    return "";
  }

  if (url.startsWith('data:')) {
    return url;
  }

  const isWebP = url.toLowerCase().endsWith('.webp') || 
                url.includes('format=webp') || 
                url.includes('image/webp');

  if (isWebP) {
    console.log('WebP image detected, using conversion service:', url);
    return await convertWebPToPNG(url);
  }

  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      headers: { 'Accept': 'image/*' },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error("Failed to read blob"));
        }
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Image processing failed:", url, error);
    return "";
  }
};

// Safe Image Component
const SafeImage = ({ src, style, alt = "" }: { src: string; style: any; alt?: string }) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  if (!imageSrc || hasError) {
    return (
      <View style={[style, {
        backgroundColor: '#1a202c',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2d3748'
      }]}>
        <Text style={{ fontSize: 12, color: '#718096', fontWeight: 'bold' }}>
          {alt || 'Image not available'}
        </Text>
      </View>
    );
  }

  return <Image src={imageSrc} style={style} cache={false} />;
};

// Define styles with bold text and strong colors
const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontFamily: "Inter",
    backgroundColor: "#ffffff",
    position: 'relative',
  },
  
  // Agency Header at Top Right
  agencyHeaderTopRight: {
    position: 'absolute',
    top: 15,
    right: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  agencyLogoTop: {
    width: 35,
    height: 35,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  agencyNameTop: {
    fontSize: 11,
    color: '#4a5568',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Header
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2d3748",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  location: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 5,
    fontWeight: "bold",
  },
  classification: {
    fontSize: 11,
    fontWeight: "bold",
    padding: "6 16",
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  
  // Price Section
  priceContainer: {
    backgroundColor: "#2d3748",
    padding: 20,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#4a5568",
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  priceSubtitle: {
    fontSize: 12,
    color: "#cbd5e0",
    fontWeight: "bold",
  },
  
  // Features Grid - Updated for Sales
  featuresGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    backgroundColor: "#2d3748",
    padding: 20,
    borderRadius: 8,
  },
  featureItem: {
    alignItems: "center",
    width: "22%",
  },
  featureValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 11,
    color: "#cbd5e0",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  
  // Section
  section: {
    marginBottom: 25,
    breakInside: "avoid",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#2d3748",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  
  // Description
  description: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#2d3748",
    fontWeight: "medium",
  },
  
  // Details - Updated for Sales
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailItem: {
    width: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#f7fafc",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailLabel: {
    fontSize: 11,
    color: "#4a5568",
    fontWeight: "bold",
  },
  detailValue: {
    fontSize: 11,
    color: "#1a202c",
    fontWeight: "bold",
  },
  
  // Amenities
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#f7fafc",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  amenityText: {
    fontSize: 11,
    color: "#2d3748",
    fontWeight: "bold",
    marginLeft: 8,
  },
  
  // Gallery - 100% width images stacked
  gallerySection: {
    breakInside: "avoid",
  },
  galleryItem: {
    width: "100%",
    height: 350,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  
  // Mortgage Calculator Section
  mortgageSection: {
    backgroundColor: "#f0f9ff",
    padding: 20,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  mortgageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0369a1",
    marginBottom: 15,
  },
  mortgageGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  mortgageItem: {
    width: "30%",
    marginBottom: 15,
  },
  mortgageLabel: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 4,
    fontWeight: "bold",
  },
  mortgageValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0c4a6e",
  },
  
  // Agency Info
  agencySection: {
    backgroundColor: "#2d3748",
    padding: 25,
    borderRadius: 8,
    marginBottom: 25,
    breakInside: "avoid",
  },
  agencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  agencyLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 20,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  agencyInfo: {
    flex: 1,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  agencyContact: {
    fontSize: 11,
    color: "#cbd5e0",
    fontWeight: "bold",
  },
  contactGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#4a5568",
  },
  contactItem: {
    width: "30%",
    alignItems: "center",
  },
  contactIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#4a5568",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#718096",
  },
  contactText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  
  // Nearby Locations
  nearbyList: {
    marginTop: 15,
  },
  nearbyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#f7fafc",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  nearbyText: {
    fontSize: 11,
    color: "#2d3748",
    fontWeight: "bold",
    marginLeft: 10,
  },
  
  // Footer
  footer: {
    marginTop: 40,
    paddingTop: 25,
    borderTopWidth: 2,
    borderTopColor: "#2d3748",
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#4a5568",
    fontWeight: "bold",
    textAlign: "center",
  },
  
  // Property Status Badge
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
    padding: "4 12",
    borderRadius: 12,
    marginBottom: 5,
    marginLeft: 10,
  },
  
  // Price Analysis Section
  priceAnalysisGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  priceAnalysisItem: {
    width: "30%",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  priceAnalysisValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  priceAnalysisLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "bold",
  },
});

interface SalesListingPDFProps {
  property: any;
  agencyColor?: string;
  onDownloadSuccess?: (url: string) => void;
}

interface ProcessedProperty {
  property: any;
  processedMedia: { url: string; isBase64: boolean }[];
  processedAgencyLogo?: string;
}

// Component that processes images before rendering
const ProcessedSalesListingPDF: React.FC<{
  processedData: ProcessedProperty;
  agencyColor?: string;
}> = ({ processedData, agencyColor = "#10b981" }) => {
  const { property, processedMedia, processedAgencyLogo } = processedData;
  const contrastColor = getContrastColor(agencyColor);
  
  const formatPrice = (price: number) => {
    return `€${price.toLocaleString("es-ES")}`;
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Not specified";
    }
  };

  const calculatePricePerSqm = () => {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price || 0;
    const sqm = property.sqm || 1;
    const pricePerSqm = Math.round(price / sqm);
    return formatPrice(pricePerSqm);
  };

  const allImages = processedMedia || [];
  
  // Function to render Agency Header at top right
  const renderAgencyHeaderTopRight = () => (
    <View style={styles.agencyHeaderTopRight}>
      <Text style={styles.agencyNameTop}>
        {property.agency?.name?.toUpperCase() || "AGENCY"}
      </Text>
      {processedAgencyLogo ? (
        <SafeImage
          src={processedAgencyLogo}
          style={styles.agencyLogoTop}
          alt="Agency logo"
        />
      ) : (
        <View style={[styles.agencyLogoTop, { 
          backgroundColor: agencyColor, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }]}>
          <Text style={{ color: contrastColor, fontSize: 12, fontWeight: "bold" }}>
            {property.agency?.name?.charAt(0) || "A"}
          </Text>
        </View>
      )}
    </View>
  );

  // Render mortgage calculator
  const renderMortgageCalculator = () => {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price || 0;
    const downPayment = Math.round(price * 0.2);
    const loanAmount = price - downPayment;
    const monthlyPayment = Math.round((loanAmount * 0.035) / 12); // 3.5% annual rate

    return (
      <View style={styles.mortgageSection}>
        <Text style={styles.mortgageTitle}>MORTGAGE ESTIMATE</Text>
        <View style={styles.mortgageGrid}>
          <View style={styles.mortgageItem}>
            <Text style={styles.mortgageLabel}>20% DOWN PAYMENT</Text>
            <Text style={styles.mortgageValue}>{formatPrice(downPayment)}</Text>
          </View>
          <View style={styles.mortgageItem}>
            <Text style={styles.mortgageLabel}>LOAN AMOUNT</Text>
            <Text style={styles.mortgageValue}>{formatPrice(loanAmount)}</Text>
          </View>
          <View style={styles.mortgageItem}>
            <Text style={styles.mortgageLabel}>EST. MONTHLY PAYMENT*</Text>
            <Text style={styles.mortgageValue}>{formatPrice(monthlyPayment)}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 9, color: "#64748b", marginTop: 10 }}>
          *Estimated based on 3.5% interest rate over 25 years. Consult a mortgage advisor for exact figures.
        </Text>
      </View>
    );
  };

  // Render price analysis section
  const renderPriceAnalysis = () => (
    <View style={styles.priceAnalysisGrid}>
      <View style={[styles.priceAnalysisItem, { backgroundColor: "#dcfce7" }]}>
        <Text style={[styles.priceAnalysisValue, { color: "#166534" }]}>
          {formatPrice(property.price || 0)}
        </Text>
        <Text style={styles.priceAnalysisLabel}>ASKING PRICE</Text>
      </View>
      <View style={[styles.priceAnalysisItem, { backgroundColor: "#dbeafe" }]}>
        <Text style={[styles.priceAnalysisValue, { color: "#1e40af" }]}>
          {calculatePricePerSqm()}/m²
        </Text>
        <Text style={styles.priceAnalysisLabel}>PRICE PER M²</Text>
      </View>
      <View style={[styles.priceAnalysisItem, { backgroundColor: "#f3e8ff" }]}>
        <Text style={[styles.priceAnalysisValue, { color: "#6b21a8" }]}>
          {formatDate(property.createdAt)}
        </Text>
        <Text style={styles.priceAnalysisLabel}>LISTED ON</Text>
      </View>
    </View>
  );

  // Render content in pages
  const renderContentInPages = () => {
    const sections = [];
    
    // Page 1: Header, Images, Basic Info
    sections.push(
      <Page key="page1" size="A4" style={styles.page}>
        {/* Agency Header at Top Right */}
        {renderAgencyHeaderTopRight()}
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.title}>{property.title || "PROPERTY FOR SALE"}</Text>
            {/* <View style={[
              styles.statusBadge,
              {
                backgroundColor: property.status === 'sold' ? '#ef4444' : 
                                property.status === 'pending' ? '#f59e0b' : '#10b981',
                color: "#ffffff",
              },
            ]}>
              <Text>{property.status?.toUpperCase() || "AVAILABLE"}</Text>
            </View> */}
          </View>
          <Text style={styles.location}>{property.location || "Location not specified"}</Text>
          <View style={[
            styles.classification,
            {
              backgroundColor: agencyColor,
              color: contrastColor,
            },
          ]}>
            <Text>FOR SALE • {property.propertyType?.toUpperCase() || "PROPERTY"}</Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(property.price || 0)}</Text>
          <Text style={styles.priceSubtitle}>
            {property.sqm ? `${property.sqm} m² • ${calculatePricePerSqm()}/m²` : 'Price negotiable'}
          </Text>
        </View>

        {/* Price Analysis */}
        {renderPriceAnalysis()}

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {[
            { label: "BEDROOMS", value: property.beds || "-" },
            { label: "BATHROOMS", value: property.baths || "-" },
            { label: "AREA (M²)", value: property.sqm || "-" },
            { label: "PROPERTY TYPE", value: property.propertyType || "-" },
          ].map((fact, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureValue}>{fact.value}</Text>
              <Text style={styles.featureLabel}>{fact.label}</Text>
            </View>
          ))}
        </View>

        {/* Mortgage Calculator */}
        {renderMortgageCalculator()}

        {/* Property Images - 100% width stacked */}
        {allImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROPERTY IMAGES</Text>
            <View style={styles.gallerySection}>
              {allImages.slice(0, 3).map((media, index) => (
                <SafeImage
                  key={index}
                  src={media.url}
                  style={styles.galleryItem}
                  alt={`Property image ${index + 1}`}
                />
              ))}
            </View>
          </View>
        )}
      </Page>
    );

    // Page 2: More images, Description, Details
    sections.push(
      <Page key="page2" size="A4" style={styles.page}>
        {/* Agency Header at Top Right */}
        {renderAgencyHeaderTopRight()}
        
        {/* More Images if available */}
        {allImages.length > 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDITIONAL IMAGES</Text>
            <View style={styles.gallerySection}>
              {allImages.slice(3, 6).map((media, index) => (
                <SafeImage
                  key={index}
                  src={media.url}
                  style={styles.galleryItem}
                  alt={`Property image ${index + 4}`}
                />
              ))}
            </View>
          </View>
        )}

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROPERTY DESCRIPTION</Text>
          <Text style={styles.description}>
            {property.description || "No description available for this property."}
          </Text>
        </View>

        {/* Property Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROPERTY DETAILS</Text>
          <View style={styles.detailsGrid}>
            {[
              { label: "REFERENCE ID", value: `#${property.id || "N/A"}` },
              { label: "PROPERTY TYPE", value: property.propertyType || "Not specified" },
              { label: "CONSTRUCTION YEAR", value: property.yearBuilt || "Not specified" },
              { label: "PROPERTY CONDITION", value: property.condition || "Not specified" },
              { label: "LISTED DATE", value: formatDate(property.createdAt) },
              { label: "LAST UPDATED", value: formatDate(property.updatedAt) },
              { label: "FLOOR", value: property.floor || "Ground" },
              { label: "ENERGY RATING", value: property.energyRating || "Not rated" },
              { label: "PARKING SPACES", value: property.parking || "0" },
              { label: "GARDEN/TERRACE", value: property.outdoorSpace ? "Yes" : "No" },
            ].map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{detail.label}</Text>
                <Text style={[styles.detailValue, { color: agencyColor }]}>
                  {detail.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    );

    // Page 3: Amenities, Agency Info, Footer
    sections.push(
      <Page key="page3" size="A4" style={styles.page}>
        {/* Agency Header at Top Right */}
        {renderAgencyHeaderTopRight()}
        
        {/* Amenities Section */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AMENITIES & FEATURES</Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.slice(0, 12).map((amenity: string, index: number) => (
                <View key={index} style={styles.amenityItem}>
                  <Text style={{ fontSize: 12, color: agencyColor, fontWeight: 'bold' }}>✓</Text>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
            {property.amenities.length > 12 && (
              <Text style={{ fontSize: 11, color: agencyColor, marginTop: 10, fontWeight: 'bold' }}>
                +{property.amenities.length - 12} more amenities available
              </Text>
            )}
          </View>
        )}

        {/* Nearby Locations */}
        {property.nearestTo && property.nearestTo.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NEARBY LOCATIONS</Text>
            <View style={styles.nearbyList}>
              {property.nearestTo.slice(0, 6).map((location: string, index: number) => (
                <View key={index} style={styles.nearbyItem}>
                  <Text style={{ fontSize: 12, color: agencyColor, fontWeight: 'bold' }}>📍</Text>
                  <Text style={styles.nearbyText}>{location}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Agency Information */}
        <View style={styles.agencySection}>
          <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>AGENCY INFORMATION</Text>
          <View style={styles.agencyHeader}>
            {processedAgencyLogo ? (
              <SafeImage
                src={processedAgencyLogo}
                style={styles.agencyLogo}
                alt="Agency logo"
              />
            ) : (
              <View style={[styles.agencyLogo, { 
                backgroundColor: agencyColor, 
                justifyContent: 'center', 
                alignItems: 'center' 
              }]}>
                <Text style={{ color: contrastColor, fontSize: 20, fontWeight: "bold" }}>
                  {property.agency?.name?.charAt(0) || "A"}
                </Text>
              </View>
            )}
            <View style={styles.agencyInfo}>
              <Text style={styles.agencyName}>
                {property.agency?.name || "AGENCY NAME"}
              </Text>
              <Text style={styles.agencyContact}>
                VERIFIED AGENCY • PROFESSIONAL SERVICE
              </Text>
            </View>
          </View>

          <View style={styles.contactGrid}>
            {property.agency?.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{property.agency.phone}</Text>
              </View>
            )}
            
            {property.agency?.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactText}>{property.agency.email}</Text>
              </View>
            )}
            
            {property.agency?.website && (
              <View style={styles.contactItem}>
                <Link src={property.agency.website} style={[styles.contactText, { color: '#63b3ed' }]}>
                  VISIT WEBSITE
                </Link>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PROPERTY FOR SALE • PROVIDED BY {property.agency?.name?.toUpperCase() || "OUR AGENCY"}
          </Text>
          <Text style={[styles.footerText, { marginTop: 10 }]}>
            © {new Date().getFullYear()} • THIS DOCUMENT IS FOR INFORMATIONAL PURPOSES ONLY
          </Text>
          {property.agent && (
            <Text style={[styles.footerText, { marginTop: 5, color: agencyColor }]}>
              CONTACT AGENT: {property.agent.name.toUpperCase()}
            </Text>
          )}
          <Text style={[styles.footerText, { marginTop: 5, fontSize: 9 }]}>
            Prices and availability subject to change. Mortgage estimates are approximations.
          </Text>
        </View>
      </Page>
    );

    return sections;
  };

  return <Document>{renderContentInPages()}</Document>;
};

// Main component with image processing
export const SalesListingPDF: React.FC<SalesListingPDFProps> = ({
  property,
  agencyColor = "#10b981",
}) => {
  const [processedData, setProcessedData] = useState<ProcessedProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  useEffect(() => {
    const processImages = async () => {
      setLoading(true);
      try {
        setProcessingStatus('Processing images...');
        
        // Get media from property (could be from media array or images array)
        const mediaItems = [];
        
        // Check property.media array
        if (property.media && Array.isArray(property.media)) {
          mediaItems.push(...property.media);
        }
        
        // Also check property.images array for backward compatibility
        if (property.images && Array.isArray(property.images)) {
          mediaItems.push(...property.images.map((url: string) => ({ url, type: 'image' })));
        }

        const processedMedia = await Promise.all(
          mediaItems.slice(0, 6).map(async (media: any, index: number) => {
            const url = typeof media === 'string' ? media : media?.url;
            if (url) {
              try {
                setProcessingStatus(`Processing image ${index + 1}...`);
                const base64 = await getBase64Image(url);
                if (base64 && base64 !== "") {
                  return { url: base64, isBase64: true };
                } else {
                  console.warn(`Failed to process image: ${url}`);
                  return { url: "", isBase64: false };
                }
              } catch (error) {
                console.warn(`Failed to process image ${index + 1}:`, error);
                return { url: url || "", isBase64: false };
              }
            }
            return { url: "", isBase64: false };
          })
        ).then(results => results.filter(item => item.url && item.url !== ""));

        let processedAgencyLogo: string | undefined;
        if (property.agency?.logo) {
          try {
            setProcessingStatus('Processing agency logo...');
            const logo = await getBase64Image(property.agency.logo);
            if (logo && logo !== "") {
              processedAgencyLogo = logo;
            }
          } catch (error) {
            console.warn("Failed to process agency logo:", error);
          }
        }

        setProcessingStatus('Finalizing PDF...');
        setProcessedData({
          property,
          processedMedia,
          processedAgencyLogo,
        });
      } catch (error) {
        console.error("Error processing images for PDF:", error);
        setProcessedData({
          property,
          processedMedia: [],
          processedAgencyLogo: undefined,
        });
      } finally {
        setLoading(false);
        setProcessingStatus('');
      }
    };

    processImages();
  }, [property]);

  if (loading || !processedData) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={{ justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a202c' }}>
              GENERATING SALES PDF...
            </Text>
            {processingStatus && (
              <Text style={{ fontSize: 12, color: '#4a5568', marginTop: 10, fontWeight: 'bold' }}>
                {processingStatus}
              </Text>
            )}
          </View>
        </Page>
      </Document>
    );
  }

  return <ProcessedSalesListingPDF processedData={processedData} agencyColor={agencyColor} />;
};

// Helper function to download URI
const downloadURI = (uri: string, name: string) => {
  const link = document.createElement("a");
  link.href = uri;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Download Link Component
export const SalesListingPDFDownload: React.FC<SalesListingPDFProps> = (props) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async (event: React.MouseEvent, instance: any) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsProcessing(true);
    
    if (instance && !instance.loading && instance.url) {
      const fileName = `sale-${props.property.id}-${props.property.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      downloadURI(instance.url, fileName);
      
      if (props.onDownloadSuccess) {
        props.onDownloadSuccess(instance.url);
      }
    }
    
    setTimeout(() => setIsProcessing(false), 1500);
  };

  const fileName = `sale-${props.property.id}-${props.property.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;

  return (
    <PDFDownloadLink
      document={<SalesListingPDF {...props} />}
      fileName={fileName}
      style={{
        textDecoration: "none",
        padding: "12px 24px",
        backgroundColor: props.agencyColor || "#10b981",
        color: getContrastColor(props.agencyColor || "#10b981"),
        borderRadius: "6px",
        fontSize: "10px",
        minWidth: "100%",
        textAlign: "center",
        fontWeight: "bold",
        opacity: isProcessing ? 0.7 : 1,
        cursor: isProcessing ? "wait" : "pointer",
        border: '2px solid #2d3748'
      }}
      onClick={handleDownload}
    >
      {({ loading }) => {
        const isLoading = loading || isProcessing;
        return isLoading ? "GENERATING PDF..." : "DOWNLOAD PDF";
      }}
    </PDFDownloadLink>
  );
};

// PDF Viewer Component for Preview
export const SalesListingPDFViewer: React.FC<SalesListingPDFProps> = (props) => {
  return (
    <PDFViewer width="100%" height="600px">
      <SalesListingPDF {...props} />
    </PDFViewer>
  );
};

export default SalesListingPDF;