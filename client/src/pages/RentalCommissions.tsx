import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";

const CURRENT_AGENT_ID = 1;

export default function RentalCommissions() {
  const [dateFilter, setDateFilter] = useState('all');

  const { data: commissions = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/commissions/agent/${CURRENT_AGENT_ID}`],
  });

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: [`/api/bookings?agentId=${CURRENT_AGENT_ID}`],
  });

  const { data: properties = [] } = useQuery<any[]>({
    queryKey: [`/api/properties`],
  });

  const { data: agents = [] } = useQuery<any[]>({
    queryKey: [`/api/admin/agents`],
  });

  const getPropertyTitle = (bookingId: number) => {
    const booking = bookings.find((b: any) => b.id === bookingId);
    if (!booking) return 'Unknown Property';
    const property = properties.find((p: any) => p.id === booking.propertyId);
    return property?.title || 'Unknown Property';
  };

  const getOtherAgent = (commission: any) => {
    if (commission.ownerAgentId === CURRENT_AGENT_ID) {
      return agents.find((a: any) => a.id === commission.bookingAgentId);
    } else {
      return agents.find((a: any) => a.id === commission.ownerAgentId);
    }
  };

  const getBooking = (bookingId: number) => {
    return bookings.find((b: any) => b.id === bookingId);
  };

  const calculateDaysBooked = (bookingId: number) => {
    const booking = getBooking(bookingId);
    if (!booking) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const days = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const filterCommissionsByDate = (commissions: any[]) => {
    if (dateFilter === 'all') return commissions;
    
    const now = new Date();
    const startDate = new Date();

    if (dateFilter === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (dateFilter === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (dateFilter === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    return commissions.filter((c: any) => new Date(c.createdAt) >= startDate);
  };

  const filteredCommissions = filterCommissionsByDate(commissions);
  const totalCommissions = filteredCommissions.reduce((sum: number, c: any) => {
    const isOwner = c.ownerAgentId === CURRENT_AGENT_ID;
    const yourCommission = isOwner ? parseFloat(c.ownerCommission || 0) : parseFloat(c.bookingCommission || 0);
    return sum + yourCommission;
  }, 0);
  const totalPlatformFee = filteredCommissions.reduce((sum: number, c: any) => 
    sum + parseFloat(c.platformFee || 0), 0
  );

  const downloadCSV = () => {
    const headers = ['Commission ID', 'Booking ID', 'Property', 'Owner Commission', 'Booking Commission', 'Platform Fee', 'Status', 'Check-In Date', 'Check-Out Date', 'Total Days Booked'];
    const rows = filteredCommissions.map((c: any) => {
      const booking = getBooking(c.bookingId);
      const checkInDate = booking ? new Date(booking.checkIn).toLocaleDateString() : 'N/A';
      const checkOutDate = booking ? new Date(booking.checkOut).toLocaleDateString() : 'N/A';
      const days = calculateDaysBooked(c.bookingId);
      return [
        c.id,
        c.bookingId,
        getPropertyTitle(c.bookingId),
        parseFloat(c.ownerCommission || 0).toFixed(2),
        parseFloat(c.bookingCommission || 0).toFixed(2),
        parseFloat(c.platformFee || 0).toFixed(2),
        c.status,
        checkInDate,
        checkOutDate,
        days
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rental-commissions-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading commissions...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-primary">Rental Commissions</h1>
            <p className="text-muted-foreground mt-1">Track your earnings from rental bookings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Your Total Commissions</p>
            <p className="text-2xl font-bold text-emerald-600" data-testid="text-total-commissions">
              €{totalCommissions.toFixed(2)}
            </p>
          </div>
          <div className="bg-white border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Platform Fees Paid</p>
            <p className="text-2xl font-bold text-amber-600" data-testid="text-total-fees">
              €{totalPlatformFee.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-border">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Filter by Period</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'month', label: 'Past Month' },
                { value: 'quarter', label: 'Past Quarter' },
                { value: 'year', label: 'Past Year' }
              ].map(filter => (
                <Button
                  key={filter.value}
                  variant={dateFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter(filter.value)}
                  data-testid={`button-filter-${filter.value}`}
                  className={dateFilter === filter.value ? 'bg-sidebar text-white' : ''}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          <Button 
            onClick={downloadCSV}
            className="bg-sidebar text-white hover:bg-sidebar/90"
            data-testid="button-download-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold">Commission ID</TableHead>
                <TableHead className="font-semibold">Booking</TableHead>
                <TableHead className="font-semibold">Property</TableHead>
                <TableHead className="font-semibold">Other Agent / Agency</TableHead>
                <TableHead className="text-right font-semibold">Your Commission</TableHead>
                <TableHead className="text-right font-semibold">Other Commission</TableHead>
                <TableHead className="text-right font-semibold">Platform Fee</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Check-In</TableHead>
                <TableHead className="font-semibold">Check-Out</TableHead>
                <TableHead className="font-semibold text-right">Total Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.map((commission: any) => {
                const otherAgent = getOtherAgent(commission);
                const isOwner = commission.ownerAgentId === CURRENT_AGENT_ID;
                const yourCommission = isOwner ? commission.ownerCommission : commission.bookingCommission;
                const otherCommission = isOwner ? commission.bookingCommission : commission.ownerCommission;
                
                return (
                  <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                    <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                      COM-{commission.id}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-booking-${commission.id}`}>
                      BK-{commission.bookingId}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-property-${commission.id}`}>
                      {getPropertyTitle(commission.bookingId)}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-agent-${commission.id}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{otherAgent?.name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{otherAgent?.agency || 'No agency'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600" data-testid={`text-your-commission-${commission.id}`}>
                      €{parseFloat(yourCommission || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600" data-testid={`text-other-commission-${commission.id}`}>
                      €{parseFloat(otherCommission || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-amber-600" data-testid={`text-fee-${commission.id}`}>
                      €{parseFloat(commission.platformFee || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={commission.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}
                        data-testid={`badge-status-${commission.id}`}
                      >
                        {commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-checkin-${commission.id}`}>
                      {getBooking(commission.bookingId) ? 
                        new Date(getBooking(commission.bookingId)!.checkIn).toLocaleDateString() 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-checkout-${commission.id}`}>
                      {getBooking(commission.bookingId) ? 
                        new Date(getBooking(commission.bookingId)!.checkOut).toLocaleDateString() 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium" data-testid={`text-days-${commission.id}`}>
                      {calculateDaysBooked(commission.bookingId)} days
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredCommissions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No commissions found for the selected period
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
