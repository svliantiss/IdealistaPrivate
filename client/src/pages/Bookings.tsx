import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Euro, 
  Check, 
  X,
  Filter,
  CalendarDays,
  ClipboardList,
  Inbox,
  Archive
} from "lucide-react";
import { Link } from "wouter";

const CURRENT_AGENT_ID = 1;

export default function Bookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: currentAgent, isLoading: isLoadingAgent } = useQuery<any>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}`],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${CURRENT_AGENT_ID}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<any[]>({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery<any[]>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<any[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const isLoading = isLoadingAgent || isLoadingBookings || isLoadingAgents || isLoadingProperties;

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
      const messages: Record<string, { title: string; description: string }> = {
        confirmed: { title: 'Booking Approved', description: 'The booking has been approved and dates are now blocked.' },
        cancelled: { title: 'Booking Cancelled', description: 'The booking has been cancelled and dates are now available.' },
      };
      const message = messages[status] || { title: 'Status Updated', description: 'The booking status has been updated.' };
      toast(message);
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

  const requestCancellationMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/bookings/${bookingId}/request-cancellation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to request cancellation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Cancellation Requested',
        description: 'Your cancellation request has been sent to the property owner.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to request cancellation.',
        variant: 'destructive',
      });
    },
  });

  const getAgent = (agentId: number) => agents.find((a: any) => a.id === agentId);
  const getProperty = (propertyId: number) => properties.find((p: any) => p.id === propertyId);

  const agencyAgentIds = agents
    .filter((a: any) => a.agency === currentAgent?.agency)
    .map((a: any) => a.id);

  // My Bookings: bookings made by me or my agency employees
  const myBookings = bookings.filter((booking: any) => 
    agencyAgentIds.includes(booking.bookingAgentId)
  );

  // Helper to get date-only string (YYYY-MM-DD) for timezone-agnostic comparison
  const getDateString = (dateStr: string | Date) => {
    // For date input values (YYYY-MM-DD format), use directly
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // For ISO timestamps, extract the date portion
    const isoStr = new Date(dateStr).toISOString();
    return isoStr.split('T')[0];
  };

  // Split my bookings into active and archived
  const activeMyBookings = myBookings.filter((booking: any) => booking.status !== 'archived');
  const archivedMyBookings = myBookings.filter((booking: any) => booking.status === 'archived');

  // Apply filters to active bookings
  const filteredMyBookings = activeMyBookings.filter((booking: any) => {
    if (statusFilter !== "all" && booking.status !== statusFilter) return false;
    
    if (dateFrom) {
      const bookingCheckIn = getDateString(booking.checkIn);
      // Check-in should be on or after the from date
      if (bookingCheckIn < dateFrom) return false;
    }
    
    if (dateTo) {
      const bookingCheckOut = getDateString(booking.checkOut);
      // Check-out should be on or before the to date
      if (bookingCheckOut > dateTo) return false;
    }
    
    return true;
  });

  // Booking Requests: pending bookings and cancellation requests from other agencies for my properties
  const bookingRequests = bookings.filter((booking: any) => {
    if (booking.status !== 'pending' && booking.status !== 'cancellation_requested') return false;
    const isMyAgencyProperty = agencyAgentIds.includes(booking.ownerAgentId);
    if (!isMyAgencyProperty) return false;
    const bookingAgent = agents.find((a: any) => a.id === booking.bookingAgentId);
    const isDifferentAgency = bookingAgent?.agency !== currentAgent?.agency;
    return isDifferentAgency;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
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

  const handleEmailOwner = (booking: any) => {
    const ownerAgent = getAgent(booking.ownerAgentId);
    const property = getProperty(booking.propertyId);
    if (ownerAgent?.email) {
      const subject = encodeURIComponent(`Booking Inquiry - ${property?.title || 'Property'}`);
      const body = encodeURIComponent(`Hello ${ownerAgent.name},\n\nI would like to discuss the booking (BK-${booking.id}) for ${property?.title || 'your property'}.\n\nCheck-in: ${formatDate(booking.checkIn)}\nCheck-out: ${formatDate(booking.checkOut)}\nClient: ${booking.clientName}\n\nPlease let me know if you have any questions.\n\nBest regards`);
      window.open(`mailto:${ownerAgent.email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancellation_requested': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'archived': return 'bg-slate-100 text-slate-600 border-slate-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'cancellation_requested': return 'Cancel Requested';
      default: return status;
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
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
          <h1 className="text-3xl font-serif font-bold text-primary">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your bookings and approve requests from other agencies
          </p>
        </div>

        <Tabs defaultValue="my-bookings" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="my-bookings" className="flex items-center gap-2" data-testid="tab-my-bookings">
              <ClipboardList className="h-4 w-4" />
              My Bookings
              {filteredMyBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {filteredMyBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2" data-testid="tab-requests">
              <Inbox className="h-4 w-4" />
              Booking Requests
              {bookingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {bookingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2" data-testid="tab-archive">
              <Archive className="h-4 w-4" />
              Archive
              {archivedMyBookings.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                  {archivedMyBookings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* My Bookings Tab */}
          <TabsContent value="my-bookings" className="mt-6 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="filter-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancellation_requested">Cancel Requested</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      placeholder="From"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-[150px]"
                      data-testid="filter-date-from"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="date"
                      placeholder="To"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-[150px]"
                      data-testid="filter-date-to"
                    />
                  </div>

                  {(statusFilter !== "all" || dateFrom || dateTo) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bookings List */}
            {filteredMyBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                  <p className="text-muted-foreground">
                    {statusFilter !== "all" || dateFrom || dateTo 
                      ? "No bookings match your current filters."
                      : "You haven't made any bookings yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMyBookings.map((booking: any) => {
                  const property = getProperty(booking.propertyId);
                  const ownerAgent = getAgent(booking.ownerAgentId);
                  const nights = calculateNights(booking.checkIn, booking.checkOut);

                  return (
                    <Card key={booking.id} className="overflow-hidden" data-testid={`booking-card-${booking.id}`}>
                      <div className="grid md:grid-cols-5 gap-4 p-4">
                        {/* Property Info */}
                        <div className="md:col-span-2 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-mono text-muted-foreground">BK-{booking.id}</span>
                              <Link href={`/rentals/${booking.propertyId}`}>
                                <h3 className="font-semibold text-primary hover:underline cursor-pointer">
                                  {property?.title || 'Property'}
                                </h3>
                              </Link>
                              <div className="flex items-center text-muted-foreground text-sm mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{property?.location || 'Unknown'}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusBadgeClass(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>
                        </div>

                        {/* Dates & Amount */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Check-in</p>
                              <p className="text-sm font-medium">{formatDate(booking.checkIn)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Check-out</p>
                              <p className="text-sm font-medium">{formatDate(booking.checkOut)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{nights} nights</span>
                            <span className="font-semibold text-primary flex items-center">
                              <Euro className="h-3 w-3 mr-0.5" />
                              {parseFloat(booking.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Client */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> Client
                          </p>
                          <p className="text-sm font-medium">{booking.clientName}</p>
                          <p className="text-xs text-muted-foreground">{booking.clientEmail}</p>
                        </div>

                        {/* Owner & Actions */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs font-bold">
                              {ownerAgent?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{ownerAgent?.name}</p>
                              <p className="text-xs text-muted-foreground">{ownerAgent?.agency}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleEmailOwner(booking)}
                            data-testid={`button-email-${booking.id}`}
                          >
                            <Mail className="h-3 w-3 mr-2" />
                            Email Owner
                          </Button>
                          {booking.status !== 'cancelled' && booking.status !== 'cancellation_requested' && (
                            (() => {
                              const isSameAgencyProperty = ownerAgent?.agency === currentAgent?.agency;
                              if (isSameAgencyProperty) {
                                return (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`button-cancel-${booking.id}`}
                                  >
                                    <X className="h-3 w-3 mr-2" />
                                    Cancel Booking
                                  </Button>
                                );
                              } else {
                                return (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full border-amber-200 text-amber-600 hover:bg-amber-50"
                                    onClick={() => requestCancellationMutation.mutate(booking.id)}
                                    disabled={requestCancellationMutation.isPending}
                                    data-testid={`button-request-cancel-${booking.id}`}
                                  >
                                    <X className="h-3 w-3 mr-2" />
                                    Request Cancellation
                                  </Button>
                                );
                              }
                            })()
                          )}
                          {booking.status === 'cancellation_requested' && (
                            <Badge variant="outline" className="w-full justify-center bg-amber-50 text-amber-700 border-amber-200">
                              Cancellation Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Booking Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            {bookingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-muted-foreground">
                    You don't have any booking requests from other agencies at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookingRequests.map((booking: any) => {
                  const property = getProperty(booking.propertyId);
                  const bookingAgent = getAgent(booking.bookingAgentId);
                  const nights = calculateNights(booking.checkIn, booking.checkOut);

                  return (
                    <Card 
                      key={booking.id} 
                      className={`overflow-hidden ${booking.status === 'cancellation_requested' ? 'border-orange-200 bg-orange-50/30' : 'border-amber-200 bg-amber-50/30'}`}
                      data-testid={`request-card-${booking.id}`}
                    >
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
                            <Badge className={booking.status === 'cancellation_requested' 
                              ? 'bg-orange-100 text-orange-700 border-orange-200' 
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                            }>
                              {booking.status === 'cancellation_requested' ? 'Cancel Requested' : 'Pending Approval'}
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
                              <span>{parseFloat(booking.totalAmount).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Client & Agent Info */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-2 mb-2">
                              <User className="h-4 w-4" />
                              Client Information
                            </h4>
                            <p className="font-medium">{booking.clientName}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 mr-2" />
                              {booking.clientEmail}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 mr-2" />
                              {booking.clientPhone}
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
                          {booking.status === 'pending' ? (
                            <>
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
                            </>
                          ) : (
                            <>
                              <Button 
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-approve-cancel-${booking.id}`}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve Cancellation
                              </Button>
                              <Button 
                                variant="outline"
                                className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-deny-cancel-${booking.id}`}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Deny Cancellation
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="mt-6">
            {archivedMyBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Archived Bookings</h3>
                  <p className="text-muted-foreground">
                    Completed bookings with past dates will appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {archivedMyBookings.map((booking: any) => {
                  const property = getProperty(booking.propertyId);
                  const ownerAgent = getAgent(booking.ownerAgentId);
                  const nights = calculateNights(booking.checkIn, booking.checkOut);

                  return (
                    <Card key={booking.id} className="overflow-hidden bg-slate-50/50" data-testid={`archived-card-${booking.id}`}>
                      <div className="grid md:grid-cols-5 gap-4 p-4">
                        {/* Property Info */}
                        <div className="md:col-span-2 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-mono text-muted-foreground">BK-{booking.id}</span>
                              <Link href={`/rentals/${booking.propertyId}`}>
                                <h3 className="font-semibold text-primary hover:underline cursor-pointer">
                                  {property?.title || 'Property'}
                                </h3>
                              </Link>
                              <div className="flex items-center text-muted-foreground text-sm mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{property?.location || 'Unknown'}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusBadgeClass('archived')}>
                              Archived
                            </Badge>
                          </div>
                        </div>

                        {/* Dates & Amount */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Check-in</p>
                              <p className="text-sm font-medium">{formatDate(booking.checkIn)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Check-out</p>
                              <p className="text-sm font-medium">{formatDate(booking.checkOut)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{nights} nights</span>
                            <span className="font-semibold text-primary flex items-center">
                              <Euro className="h-3 w-3 mr-0.5" />
                              {parseFloat(booking.totalAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Client */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> Client
                          </p>
                          <p className="text-sm font-medium">{booking.clientName}</p>
                          <p className="text-xs text-muted-foreground">{booking.clientEmail}</p>
                        </div>

                        {/* Owner */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs font-bold">
                              {ownerAgent?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{ownerAgent?.name}</p>
                              <p className="text-xs text-muted-foreground">{ownerAgent?.agency}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
