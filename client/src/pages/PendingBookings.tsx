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

export default function PendingBookings() {
  const { data: bookings = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/bookings?agentId=${CURRENT_AGENT_ID}`],
  });

  const { data: properties = [] } = useQuery<any[]>({
    queryKey: [`/api/properties`],
  });

  const pendingBookings = bookings.filter((b: any) => b.status === 'pending');

  const getPropertyTitle = (propertyId: number) => {
    const property = properties.find((p: any) => p.id === propertyId);
    return property?.title || 'Unknown Property';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading pending bookings...</div>
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
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Pending Bookings</h1>
            <p className="text-muted-foreground mt-1">Bookings awaiting confirmation or action.</p>
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
              {pendingBookings.map((booking: any) => (
                <TableRow key={booking.id} data-testid={`row-pending-booking-${booking.id}`}>
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
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200" data-testid={`badge-status-${booking.id}`}>
                      Pending
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
          
          {pendingBookings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No pending bookings
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
