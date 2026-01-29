// src/components/public/RentalListingPDF.tsx
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
  
  // Features Grid
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
  
  // Details
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
  
  // Utility
  badge: {
    fontSize: 10,
    fontWeight: "bold",
    padding: "4 12",
    borderRadius: 12,
    marginBottom: 5,
  },
});

interface RentalListingPDFProps {
  property: any;
  similarProperties?: any[];
  agencyColor?: string;
  onDownloadSuccess?: (url: string) => void;
}

interface ProcessedProperty {
  property: any;
  processedMedia: { url: string; isBase64: boolean }[];
  processedAgencyLogo?: string;
}

// Component that processes images before rendering
const ProcessedRentalListingPDF: React.FC<{
  processedData: ProcessedProperty;
  agencyColor?: string;
}> = ({ processedData, agencyColor = "#3182ce" }) => {
  const { property, processedMedia, processedAgencyLogo } = processedData;
  const contrastColor = getContrastColor(agencyColor);
  
  const formatPrice = () => {
    const price = property.price || 0;
    if (property.classification === "Long-Term") {
      return `€${price.toLocaleString("es-ES")}/month`;
    }
    return `€${price.toLocaleString("es-ES")}/night`;
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
          <Text style={styles.title}>{property.title || "PROPERTY LISTING"}</Text>
          <Text style={styles.location}>{property.location || "Location not specified"}</Text>
          <View style={[
            styles.classification,
            {
              backgroundColor: agencyColor,
              color: contrastColor,
            },
          ]}>
            <Text>{property.classification || "RENTAL"}</Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice()}</Text>
          {property.minimumStayValue > 0 && (
            <Text style={styles.priceSubtitle}>
              Minimum stay: {property.minimumStayValue} {property.minimumStayUnit}
            </Text>
          )}
        </View>

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
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
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
              { label: "CLASSIFICATION", value: property.classification || "Not specified" },
              { label: "LICENSE NUMBER", value: property.licenseNumber || "Not specified" },
              { label: "PUBLISHED DATE", value: formatDate(property.updatedAt) },
              { label: "MINIMUM STAY", value: property.minimumStayValue ? `${property.minimumStayValue} ${property.minimumStayUnit}` : "Flexible" },
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
            PROPERTY LISTING PROVIDED BY {property.agency?.name?.toUpperCase() || "OUR AGENCY"}
          </Text>
          <Text style={[styles.footerText, { marginTop: 10 }]}>
            © {new Date().getFullYear()} • THIS DOCUMENT IS GENERATED FOR INFORMATIONAL PURPOSES ONLY
          </Text>
          {property.agent && (
            <Text style={[styles.footerText, { marginTop: 5, color: agencyColor }]}>
              CONTACT AGENT: {property.agent.name.toUpperCase()}
            </Text>
          )}
        </View>
      </Page>
    );

    return sections;
  };

  return <Document>{renderContentInPages()}</Document>;
};

// Main component with image processing
export const RentalListingPDF: React.FC<RentalListingPDFProps> = ({
  property,
  similarProperties = [],
  agencyColor = "#3182ce",
}) => {
  const [processedData, setProcessedData] = useState<ProcessedProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  useEffect(() => {
    const processImages = async () => {
      setLoading(true);
      try {
        setProcessingStatus('Processing images...');
        
        const processedMedia = await Promise.all(
          (property.media || []).slice(0, 6).map(async (media: any, index: number) => {
            if (media?.url) {
              try {
                setProcessingStatus(`Processing image ${index + 1}...`);
                const base64 = await getBase64Image(media.url);
                if (base64 && base64 !== "") {
                  return { url: base64, isBase64: true };
                } else {
                  console.warn(`Failed to process image: ${media.url}`);
                  return { url: "", isBase64: false };
                }
              } catch (error) {
                console.warn(`Failed to process image ${index + 1}:`, error);
                return { url: media.url || "", isBase64: false };
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
  }, [property, similarProperties]);

  if (loading || !processedData) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={{ justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a202c' }}>
              GENERATING PDF...
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

  return <ProcessedRentalListingPDF processedData={processedData} agencyColor={agencyColor} />;
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
export const RentalListingPDFDownload: React.FC<RentalListingPDFProps> = (props) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async (event: React.MouseEvent, instance: any) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsProcessing(true);
    
    if (instance && !instance.loading && instance.url) {
      downloadURI(instance.url, `property-${props.property.id}-${props.property.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      
      if (props.onDownloadSuccess) {
        props.onDownloadSuccess(instance.url);
      }
    }
    
    setTimeout(() => setIsProcessing(false), 1500);
  };

  const fileName = `property-${props.property.id}-${props.property.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;

  return (
    <PDFDownloadLink
      document={<RentalListingPDF {...props} />}
      fileName={fileName}
      style={{
        textDecoration: "none",
        padding: "12px 24px",
        backgroundColor: props.agencyColor || "#3182ce",
        color: getContrastColor(props.agencyColor || "#3182ce"),
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
export const RentalListingPDFViewer: React.FC<RentalListingPDFProps> = (props) => {
  return (
    <PDFViewer width="100%" height="600px">
      <RentalListingPDF {...props} />
    </PDFViewer>
  );
};

export default RentalListingPDF;