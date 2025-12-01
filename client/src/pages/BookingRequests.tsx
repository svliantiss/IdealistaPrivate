import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, User, Building2, Phone, Mail, Euro, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const CURRENT_AGENT_ID = 1;

export default function BookingRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentAgent } = useQuery<any>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${CURRENT_AGENT_ID}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: status === 'confirmed' ? 'Booking Approved' : 'Booking Declined',
        description: status === 'confirmed' 
          ? 'The booking has been approved and dates are now blocked.'
          : 'The booking request has been declined.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/property-availability'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      });
    },
  });

  // Get agents from same agency
  const agencyAgentIds = agents
    .filter((a: any) => a.agency === currentAgent?.agency)
    .map((a: any) => a.id);

  // Filter pending bookings where owner is from my agency but booking agent is from different agency
  const pendingRequests = bookings.filter((booking: any) => {
    if (booking.status !== 'pending') return false;
    
    // Check if the owner is from my agency
    const isMyAgencyProperty = agencyAgentIds.includes(booking.ownerAgentId);
    if (!isMyAgencyProperty) return false;
    
    // Check if booking agent is from a different agency
    const bookingAgent = agents.find((a: any) => a.id === booking.bookingAgentId);
    const isDifferentAgency = bookingAgent?.agency !== currentAgent?.agency;
    
    return isDifferentAgency;
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
          <div className="text-center py-12">Loading booking requests...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Booking Requests</h1>
          <p className="text-muted-foreground mt-1">
            Pending booking requests from other agencies for your properties
          </p>
        </div>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">
                You don't have any booking requests from other agencies at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingRequests.map((booking: any) => {
              const property = getProperty(booking.propertyId);
              const bookingAgent = getAgent(booking.bookingAgentId);
              const ownerAgent = getAgent(booking.ownerAgentId);
              const nights = calculateNights(booking.checkIn, booking.checkOut);

              return (
                <Card key={booking.id} className="overflow-hidden border-amber-200 bg-amber-50/30" data-testid={`request-card-${booking.id}`}>
                  <div className="grid md:grid-cols-4 gap-6 p-6">
                    {/* Property Info */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/rentals/${booking.propertyId}`}>
                            <h3 className="text-lg font-semibold text-primary hover:underline cursor-pointer">
                              {property?.title || 'Property'}
                            </h3>
                          </Link>
                          <div className="flex items-center text-muted-foreground text-sm mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{property?.location || 'Unknown location'}</span>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          Pending Approval
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
                        <p className="font-medium">{booking.clientName}</p>
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

                      <div className="pt-3 border-t">
                        <h4 className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4" />
                          Requesting Agent
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-sm font-bold">
                            {bookingAgent?.name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{bookingAgent?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{bookingAgent?.agency}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 flex flex-col justify-center">
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-approve-${booking.id}`}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve Booking
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-decline-${booking.id}`}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
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
