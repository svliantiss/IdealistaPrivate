import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, User, Building2, Phone, Mail, Euro } from "lucide-react";
import { Link } from "wouter";

const CURRENT_AGENT_ID = 1;

export default function MyBookings() {
  const { data: bookings = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: agents = [] } = useQuery<any[]>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: currentAgent } = useQuery<any>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${CURRENT_AGENT_ID}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Filter bookings: show all bookings made by agents from the same agency (for managers)
  // or just the current agent's bookings
  const myBookings = bookings.filter((booking: any) => {
    // Show bookings where this agent made the booking
    if (booking.bookingAgentId === CURRENT_AGENT_ID) return true;
    
    // For managers: show all bookings from same agency
    if (currentAgent?.agency) {
      const bookingAgent = agents.find((a: any) => a.id === booking.bookingAgentId);
      if (bookingAgent?.agency === currentAgent.agency) return true;
    }
    
    return false;
  });

  const getAgent = (agentId: number) => agents.find((a: any) => a.id === agentId);
  const getProperty = (propertyId: number) => properties.find((p: any) => p.id === propertyId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading bookings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">My Bookings</h1>
          <p className="text-muted-foreground mt-1">
            {currentAgent?.agency 
              ? `Bookings made by ${currentAgent.agency} agents`
              : 'Your property bookings'
            }
          </p>
        </div>

        {myBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't made any property bookings yet.
              </p>
              <Link href="/search">
                <Button className="bg-primary text-white">
                  Browse Properties
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {myBookings.map((booking: any) => {
              const property = getProperty(booking.propertyId);
              const bookingAgent = getAgent(booking.bookingAgentId);
              const ownerAgent = getAgent(booking.ownerAgentId);
              const nights = calculateNights(booking.checkIn, booking.checkOut);

              return (
                <Card key={booking.id} className="overflow-hidden" data-testid={`booking-card-${booking.id}`}>
                  <div className="grid md:grid-cols-4 gap-6 p-6">
                    {/* Property Info */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/rentals/${booking.propertyId}`}>
                            <h3 className="text-lg font-semibold text-primary hover:underline cursor-pointer" data-testid={`text-property-title-${booking.id}`}>
                              {property?.title || 'Property'}
                            </h3>
                          </Link>
                          <div className="flex items-center text-muted-foreground text-sm mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{property?.location || 'Unknown location'}</span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(booking.status)} capitalize`}>
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Check-in</p>
                          <p className="font-medium">{formatDate(booking.checkIn)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Check-out</p>
                          <p className="font-medium">{formatDate(booking.checkOut)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{nights} nights</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <Euro className="h-4 w-4" />
                          <span>{booking.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-3">
                      <h4 className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Client Information
                      </h4>
                      <div className="space-y-2">
                        <p className="font-medium" data-testid={`text-client-name-${booking.id}`}>{booking.clientName}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-2" />
                          <a href={`mailto:${booking.clientEmail}`} className="hover:text-primary">
                            {booking.clientEmail}
                          </a>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-2" />
                          <a href={`tel:${booking.clientPhone}`} className="hover:text-primary">
                            {booking.clientPhone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="space-y-3">
                      <h4 className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Booking Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Booked by</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {bookingAgent?.name?.charAt(0) || 'A'}
                            </div>
                            <span className="text-sm font-medium" data-testid={`text-booking-agent-${booking.id}`}>
                              {bookingAgent?.name || 'Unknown'}
                            </span>
                          </div>
                          {bookingAgent?.agency && (
                            <p className="text-xs text-muted-foreground ml-8">{bookingAgent.agency}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Property Owner</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs font-bold">
                              {ownerAgent?.name?.charAt(0) || 'A'}
                            </div>
                            <span className="text-sm font-medium">
                              {ownerAgent?.name || 'Unknown'}
                            </span>
                          </div>
                          {ownerAgent?.agency && (
                            <p className="text-xs text-muted-foreground ml-8">{ownerAgent.agency}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
