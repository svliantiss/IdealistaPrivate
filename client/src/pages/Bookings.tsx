import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
  Archive,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

// Import TanStack Query booking hooks
import {
  useBookings,
  useUpdateBookingStatus,
  useRequestCancellation,
  getBookingStatusClass,
  getBookingStatusLabel,
  formatBookingDate,
  calculateNights as calculateNightsUtil,
  type Booking,
  type BookingFilters
} from "@/store/query/booking.queries";

// Import property queries
import { useRentalProperties } from "@/store/query/property.queries";
import { useCurrentAgent } from "@/store/query/auth.queries";

export default function Bookings() {
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Use TanStack Query hooks
  const { data: currentAgentData, isLoading: isLoadingAgent } = useCurrentAgent();
  console.log({ currentAgentData: currentAgentData?.user?.agentId });
  const currentAgent = currentAgentData?.user?.agentId 



  // Build filters for bookings query
  const bookingFilters: BookingFilters = {
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
  };

  const {
    data: bookingsData,
    isLoading: isLoadingBookings,
    error: bookingsError
  } = useBookings(bookingFilters);

  const {
    data: propertiesData,
    isLoading: isLoadingProperties,
    error: propertiesError
  } = useRentalProperties();

  // Use the booking mutations
  const updateStatusMutation = useUpdateBookingStatus();
  const requestCancellationMutation = useRequestCancellation();

  const isLoading = isLoadingAgent || isLoadingBookings || isLoadingProperties;
  const hasError = bookingsError || propertiesError;

  // FIXED: Extract data from responses based on actual API structure
  // FIXED: Extract data from responses based on actual API structure
  const bookings: Booking[] = Array.isArray(bookingsData?.bookings)
    ? bookingsData.bookings
    : [];

  console.log({ currentAgent });
  console.log({ bookingsData, bookings });

  // Extract current agent properlyconst currentAgent = currentAgentData?.data?.agent || currentAgentData?.agent || currentAgentData?.data || currentAgentData;

  // Extract properties properly
  const properties = Array.isArray(propertiesData?.data?.properties)
    ? propertiesData.data.properties
    : Array.isArray(propertiesData?.data)
      ? propertiesData.data
      : Array.isArray(propertiesData?.properties)
        ? propertiesData.properties
        : Array.isArray(propertiesData)
          ? propertiesData
          : [];
  // Extract agents from bookings (fallback solution)
  const [agents, setAgents] = useState<any[]>([]);
  useEffect(() => {
    if (Array.isArray(bookings) && bookings.length > 0) {
      // Extract unique agents from bookings
      const extractedAgents: any[] = [];
      const seenAgentIds = new Set<number>();

      bookings.forEach((booking: Booking) => {
        // Add booking agent if exists and not already seen
        if (booking.bookingAgent && !seenAgentIds.has(booking.bookingAgent.id)) {
          extractedAgents.push(booking.bookingAgent);
          seenAgentIds.add(booking.bookingAgent.id);
        }

        // Add owner agent if exists and not already seen
        if (booking.ownerAgent && !seenAgentIds.has(booking.ownerAgent.id)) {
          extractedAgents.push(booking.ownerAgent);
          seenAgentIds.add(booking.ownerAgent.id);
        }
      });

      setAgents(extractedAgents);
    }
  }, [bookings]);

  // FIXED: Filtering functions with array checks
  const filterMyBookings = (bookingsToFilter: Booking[]): Booking[] => {
    if (!currentAgent || !Array.isArray(bookingsToFilter)) return [];

    // Get bookings where current agent is the booking agent
    return bookingsToFilter.filter((booking: Booking) => {
      console.log({ booking: booking.bookingAgentId, currentAgent: currentAgent.id });
      return booking.bookingAgentId === currentAgentData?.user?.agentId 
    });
  };

  const filterBookingRequests = (bookingsToFilter: Booking[]): Booking[] => {
    if (!currentAgent || !Array.isArray(bookingsToFilter)) return [];

    // Get bookings where:
    // 1. Status is pending or cancellation_requested
    // 2. Property belongs to current agent (owner agent)
    // 3. Booking agent is not the current agent
    return bookingsToFilter.filter((booking: Booking) => {
      if (!['pending', 'cancellation_requested'].includes(booking.status)) return false;

      const isMyProperty = booking.ownerAgentId === currentAgent.id;
      if (!isMyProperty) return false;

      const isMyBooking = booking.bookingAgentId === currentAgent.id;
      return !isMyBooking;
    });
  };

  // Split my bookings into active and archived
  const myBookings = filterMyBookings(bookings);
  const bookingRequests = filterBookingRequests(bookings);

  const activeMyBookings = myBookings.filter((booking: Booking) =>
    booking.status !== 'archived' && booking.status !== 'cancelled'
  );
  const archivedMyBookings = myBookings.filter((booking: Booking) =>
    booking.status === 'archived' || booking.status === 'cancelled'
  );

  // Apply additional client-side filters to active bookings
  const filteredMyBookings = activeMyBookings.filter((booking: Booking) => {
    if (dateFrom) {
      const bookingCheckIn = getDateString(booking.checkIn);
      if (bookingCheckIn < dateFrom) return false;
    }

    if (dateTo) {
      const bookingCheckOut = getDateString(booking.checkOut);
      if (bookingCheckOut > dateTo) return false;
    }

    return true;
  });

  const getAgent = (agentId: number) => {
    // First try to find agent in extracted agents list
    const foundAgent = agents.find((a: any) => a.id === agentId);
    if (foundAgent) return foundAgent;

    // If not found, check if it's the current agent
    if (currentAgent && currentAgent.id === agentId) return currentAgent;

    // Return a fallback agent object
    return {
      id: agentId,
      name: 'Unknown Agent',
      email: 'unknown@example.com',
      agency: { name: 'Unknown Agency' }
    };
  };

  const getProperty = (propertyId: number) =>
    properties.find((p: any) => p.id === propertyId);

  const calculateNights = (checkIn: string, checkOut: string) => {
    return calculateNightsUtil(checkIn, checkOut);
  };

  const formatDate = (dateString: string) => {
    return formatBookingDate(dateString);
  };

  // Helper to get date-only string
  const getDateString = (dateStr: string | Date) => {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    const isoStr = new Date(dateStr).toISOString();
    return isoStr.split('T')[0];
  };

  const handleEmailOwner = (booking: Booking) => {
    const ownerAgent = getAgent(booking.ownerAgentId);
    const property = getProperty(booking.propertyId);
    if (ownerAgent?.email) {
      const subject = encodeURIComponent(`Booking Inquiry - ${property?.title || 'Property'}`);
      const body = encodeURIComponent(`Hello ${ownerAgent.name},\n\nI would like to discuss the booking (BK-${booking.id}) for ${property?.title || 'your property'}.\n\nCheck-in: ${formatDate(booking.checkIn)}\nCheck-out: ${formatDate(booking.checkOut)}\nClient: ${booking.clientName}\n\nPlease let me know if you have any questions.\n\nBest regards`);
      window.open(`mailto:${ownerAgent.email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const handleUpdateStatus = (bookingId: number, status: string) => {
    updateStatusMutation.mutate({ id: bookingId, status });
  };

  const handleRequestCancellation = (bookingId: number) => {
    requestCancellationMutation.mutate(bookingId);
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Loading bookings...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (hasError) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Error Loading Bookings</h2>
            <p className="text-muted-foreground mb-4">
              {bookingsError?.message || propertiesError?.message || 'Failed to load bookings data.'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90"
            >
              Try Again
            </Button>
          </div>
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
                {filteredMyBookings.map((booking: Booking) => {
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
                            <Badge variant="outline" className={getBookingStatusClass(booking.status)}>
                              {getBookingStatusLabel(booking.status)}
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
                              {parseFloat(booking.totalAmount.toString()).toFixed(2)}
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
                              <p className="text-xs text-muted-foreground">{ownerAgent?.agency?.name || ownerAgent?.agency}</p>
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
                              const isMyProperty = booking.ownerAgentId === currentAgent?.id;
                              if (isMyProperty) {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`button-cancel-${booking.id}`}
                                  >
                                    {updateStatusMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    ) : (
                                      <X className="h-3 w-3 mr-2" />
                                    )}
                                    Cancel Booking
                                  </Button>
                                );
                              } else {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-amber-200 text-amber-600 hover:bg-amber-50 h-auto py-2 whitespace-normal text-xs"
                                    onClick={() => handleRequestCancellation(booking.id)}
                                    disabled={requestCancellationMutation.isPending}
                                    data-testid={`button-request-cancel-${booking.id}`}
                                  >
                                    {requestCancellationMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 mr-1 flex-shrink-0 animate-spin" />
                                    ) : (
                                      <X className="h-3 w-3 mr-1 flex-shrink-0" />
                                    )}
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
                    You don't have any booking requests from other agents at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookingRequests.map((booking: Booking) => {
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
                              {getBookingStatusLabel(booking.status)}
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
                              <span>{parseFloat(booking.totalAmount.toString()).toFixed(2)}</span>
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
                              {booking.clientPhone || 'No phone provided'}
                            </div>
                            {booking.additionNote && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground">Notes: {booking.additionNote}</p>
                              </div>
                            )}
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
                                <p className="text-xs text-muted-foreground">{bookingAgent?.agency?.name || bookingAgent?.agency}</p>
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
                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-approve-${booking.id}`}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="mr-2 h-4 w-4" />
                                )}
                                Approve Booking
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-decline-${booking.id}`}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="mr-2 h-4 w-4" />
                                )}
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-approve-cancel-${booking.id}`}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="mr-2 h-4 w-4" />
                                )}
                                Approve Cancellation
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-deny-cancel-${booking.id}`}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="mr-2 h-4 w-4" />
                                )}
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
                {archivedMyBookings.map((booking: Booking) => {
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
                            <Badge variant="outline" className={getBookingStatusClass(booking.status)}>
                              {booking.status === 'cancelled' ? 'Cancelled' : 'Archived'}
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
                              {parseFloat(booking.totalAmount.toString()).toFixed(2)}
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
                              <p className="text-xs text-muted-foreground">{ownerAgent?.agency?.name || ownerAgent?.agency}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}a
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}