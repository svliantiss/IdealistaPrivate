import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, Calendar, Share2, Heart, Check, User, Mail, Phone, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { AgentContactDialog } from "@/components/AgentContactDialog";
import { useToast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery<any>({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: propertyId > 0,
  });

  const { data: availability = [], refetch: refetchAvailability } = useQuery<any[]>({
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

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "The booking has been successfully created.",
      });
      setBookingDialogOpen(false);
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setNotes("");
      setCheckInDate(null);
      setCheckOutDate(null);
      refetchAvailability();
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
    const pricePerNight = parseFloat(property?.price || 0);
    return (nights * pricePerNight).toFixed(2);
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

    createBookingMutation.mutate({
      propertyId,
      ownerAgentId: property.agentId,
      bookingAgentId: 1, // Current agent (hardcoded for now)
      clientName,
      clientEmail,
      clientPhone,
      checkIn: checkInDate?.toISOString(),
      checkOut: checkOutDate?.toISOString(),
      totalAmount: calculateTotal(),
      status: "confirmed",
    });
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
                      className={`text-center py-2 rounded text-sm transition-all ${
                        date 
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
                  <span className="text-3xl font-bold text-primary" data-testid="text-price">€{property.price}</span>
                  <span className="text-muted-foreground">/night</span>
                </div>
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
                      <span className="text-muted-foreground">€{property.price} x {calculateNights()} nights</span>
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
                disabled={createBookingMutation.isPending}
                data-testid="button-confirm-booking"
              >
                {createBookingMutation.isPending ? "Creating..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
