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
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const CURRENT_AGENT_ID = 1;

export default function TotalBookings() {
  const { data: bookings = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/bookings?agentId=${CURRENT_AGENT_ID}`],
  });

  const { data: properties = [] } = useQuery<any[]>({
    queryKey: [`/api/properties`],
  });

  const getPropertyTitle = (propertyId: number) => {
    const property = properties.find((p: any) => p.id === propertyId);
    return property?.title || 'Unknown Property';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'paid':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filter out cancelled and archived bookings - they should only appear in Archive
  const activeBookings = bookings.filter((b: any) => b.status !== 'cancelled' && b.status !== 'archived');
  const totalValue = activeBookings.reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0);

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
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-primary">All Bookings</h1>
            <p className="text-muted-foreground mt-1">Complete view of all your bookings and reservations.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-total-value">€{totalValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold">Booking ID</TableHead>
                <TableHead className="font-semibold">Property</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Dates</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeBookings.map((booking: any) => (
                <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                  <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                    BK-{booking.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-property-${booking.id}`}>
                    {getPropertyTitle(booking.propertyId)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm" data-testid={`text-client-${booking.id}`}>
                        {booking.clientName}
                      </span>
                      <span className="text-xs text-muted-foreground">{booking.clientEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(booking.status)} data-testid={`badge-status-${booking.id}`}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium" data-testid={`text-amount-${booking.id}`}>
                    €{parseFloat(booking.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-menu-${booking.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {activeBookings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No active bookings found
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
