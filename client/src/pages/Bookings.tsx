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
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Bookings() {
  const bookings = [
    {
      id: "BK-7829",
      property: "Villa Paraiso",
      client: "Thomas Weber",
      agent: "Sarah Miller",
      dates: "Jun 12 - Jun 19, 2025",
      amount: "€3,150",
      status: "Confirmed",
      commission: "€315.00"
    },
    {
      id: "BK-7830",
      property: "Modern Sea View Penthouse",
      client: "Elena Rossi",
      agent: "Direct",
      dates: "Jul 01 - Jul 05, 2025",
      amount: "€1,120",
      status: "Pending",
      commission: "€112.00"
    },
    {
      id: "BK-7831",
      property: "Villa Paraiso",
      client: "James Smith",
      agent: "David Chen",
      dates: "Aug 10 - Aug 24, 2025",
      amount: "€6,300",
      status: "Paid",
      commission: "€630.00"
    }
  ];

  return (
    <Layout>
      <div className="p-8 space-y-6">
         <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Bookings</h1>
            <p className="text-muted-foreground mt-1">Track reservations and commissions.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold">Booking ID</TableHead>
                <TableHead className="font-semibold">Property</TableHead>
                <TableHead className="font-semibold">Client / Agent</TableHead>
                <TableHead className="font-semibold">Dates</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Total</TableHead>
                <TableHead className="text-right font-semibold">Commission</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                    {booking.id}
                  </TableCell>
                  <TableCell className="font-medium">{booking.property}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{booking.client}</span>
                      <span className="text-xs text-muted-foreground">via {booking.agent}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{booking.dates}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        booking.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'}
                    `}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{booking.amount}</TableCell>
                  <TableCell className="text-right text-emerald-600 font-medium">{booking.commission}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
