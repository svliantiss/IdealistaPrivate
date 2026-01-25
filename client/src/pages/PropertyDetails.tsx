import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Share2,
  Heart,
  Check,
  FileText,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { AgentContactDialog } from "@/components/AgentContactDialog";
import { useToast } from "@/hooks/use-toast";
import {
  useRentalProperty,
  usePropertyAvailability,
} from "@/store/query/property.queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RentalListing } from "./Public/RentalsProperties";
import { useReactToPrint } from "react-to-print";

export default function PropertyDetails() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);

  const { toast } = useToast();

  /** ✅ IMPORTANT: ref must exist BEFORE printing */
  const printRef = useRef<HTMLDivElement>(null);

  /** ✅ FIX: use contentRef (NOT content()) */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `property-${propertyId}`,
    removeAfterPrint: true,
  });

  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);

  const { data: propertyData, isLoading, error } = useRentalProperty(propertyId);
  const property = propertyData?.data || propertyData;

  const { data: availabilityData = [] } =
    usePropertyAvailability(propertyId);

  const availability =
    availabilityData?.data || availabilityData || [];

  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    availability.forEach((a: any) => {
      if (!a.isAvailable) {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
      }
    });
    return dates;
  }, [availability]);

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

    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center">Loading property…</div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Property not found</h2>
          <Link href="/properties">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

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

      {/* ================= PAGE CONTENT ================= */}
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>

          <div className="flex-1">
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {property.location}
            </div>
          </div>

          <div className="flex gap-2">
            <DropdownMenu
              open={shareDropdownOpen}
              onOpenChange={setShareDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon">
              <Heart />
            </Button>
          </div>
        </div>

        {/* IMAGE */}
        <div className="aspect-[16/9] rounded-lg overflow-hidden">
          <img
            src={property.media?.[0]?.url || "/placeholder.jpg"}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* DETAILS */}
        <Card>
          <CardHeader>
            <CardTitle>About this property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              {property.description}
            </p>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <Bed className="mx-auto mb-2" />
                <p className="font-bold">{property.beds}</p>
                Bedrooms
              </div>
              <div className="text-center">
                <Bath className="mx-auto mb-2" />
                <p className="font-bold">{property.baths}</p>
                Bathrooms
              </div>
              <div className="text-center">
                <Maximize2 className="mx-auto mb-2" />
                <p className="font-bold">{property.sqm}</p>
                m²
              </div>
              <div className="text-center">
                <Calendar className="mx-auto mb-2" />
                <p className="font-bold">{property.propertyType}</p>
                Type
              </div>
            </div>
          </CardContent>
        </Card>

        {property.amenities?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.amenities.map((a: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {a}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {property.agency && (
          <Card>
            <CardHeader>
              <CardTitle>Listed by</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentContactDialog
                agent={{
                  name: property.agency.name,
                  email: property.createdBy?.email,
                  phone: property.createdBy?.phone,
                  agency: property.agency.name,
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
