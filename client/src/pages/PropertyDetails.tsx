import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, Calendar, Share2, Heart, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { AgentContactDialog } from "@/components/AgentContactDialog";

export default function PropertyDetails() {
  const params = useParams<{ id: string }>();
  const propertyId = parseInt(params.id || "0");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: property, isLoading } = useQuery<any>({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: propertyId > 0,
  });

  const { data: availability = [] } = useQuery<any[]>({
    queryKey: [`/api/property-availability/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/property-availability/${propertyId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: propertyId > 0,
  });

  const { data: agent } = useQuery<any>({
    queryKey: [`/api/agents/${property?.agentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${property?.agentId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!property?.agentId,
  });

  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    availability.forEach((a: any) => {
      if (a.isAvailable === 0) {
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

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading property details...</div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Property not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/search">
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
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[16/9] rounded-lg overflow-hidden">
              <img 
                src={property.images?.[0] || '/placeholder.jpg'} 
                alt={property.title}
                className="w-full h-full object-cover"
                data-testid="img-property-main"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">About this property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground" data-testid="text-property-description">{property.description}</p>
                
                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <Bed className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-beds">{property.beds}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <Bath className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-baths">{property.baths}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="text-center">
                    <Maximize2 className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold" data-testid="text-sqm">{property.sqm}</p>
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

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(property.amenities || []).map((amenity: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif">Availability Calendar</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
                    <span>Booked</span>
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
                      className={`text-center py-2 rounded text-sm ${
                        date 
                          ? isDateBooked(date)
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : ''
                      }`}
                    >
                      {date?.getDate() || ''}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary" data-testid="text-price">€{property.price}</span>
                  <span className="text-muted-foreground">/night</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Check-in</label>
                    <input type="date" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Check-out</label>
                    <input type="date" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
                  </div>
                </div>
                
                <Button className="w-full bg-primary text-white" size="lg" data-testid="button-book-now">
                  Book Now
                </Button>
                
                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Number</span>
                    <span className="font-medium">{property.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={property.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {property.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {agent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Listed by</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {agent.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-medium" data-testid="text-agent-name">{agent.name}</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-agent-agency">{agent.agency}</p>
                    </div>
                  </div>
                  <AgentContactDialog agent={agent} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
