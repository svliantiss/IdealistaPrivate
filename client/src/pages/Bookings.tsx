import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const CURRENT_AGENT_ID = 1;

export default function Bookings() {
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
         <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Bookings</h1>
            <p className="text-muted-foreground mt-1">Track reservations and commissions.</p>
          </div>
          <Link href="/employee-stats">
            <Button className="bg-sidebar text-white hover:bg-sidebar/90 gap-2" data-testid="button-employee-stats">
              <Users className="h-4 w-4" />
              Team Stats
            </Button>
          </Link>
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
              {bookings.map((booking: any) => (
                <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                  <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                    BK-{booking.id}
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-property-${booking.id}`}>{getPropertyTitle(booking.propertyId)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm" data-testid={`text-client-${booking.id}`}>{booking.clientName}</span>
                      <span className="text-xs text-muted-foreground">{booking.clientEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        booking.status === 'paid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'}
                    `} data-testid={`badge-status-${booking.id}`}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium" data-testid={`text-amount-${booking.id}`}>€{parseFloat(booking.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {bookings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No bookings found
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
