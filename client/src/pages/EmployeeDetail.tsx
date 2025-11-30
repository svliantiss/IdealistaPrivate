import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EmployeeDetail() {
  const [, params] = useRoute("/employee-stats/:agentId");
  const agentId = params?.agentId ? parseInt(params.agentId) : null;

  const { data: agent = null } = useQuery<any>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId,
  });

  const { data: properties = [] } = useQuery<any[]>({
    queryKey: [`/api/agents/${agentId}/properties`],
    enabled: !!agentId,
  });

  const { data: salesProperties = [] } = useQuery<any[]>({
    queryKey: [`/api/agents/${agentId}/sales-properties`],
    enabled: !!agentId,
  });

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: [`/api/bookings?agentId=${agentId}`],
    enabled: !!agentId,
  });

  const { data: commissions = [] } = useQuery<any[]>({
    queryKey: [`/api/commissions/agent/${agentId}`],
    enabled: !!agentId,
  });

  const { data: salesCommissions = [] } = useQuery<any[]>({
    queryKey: [`/api/sales-commissions/agent/${agentId}`],
    enabled: !!agentId,
  });

  if (!agentId || !agent) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading employee details...</div>
        </div>
      </Layout>
    );
  }

  const activeRentals = properties.filter((p: any) => p.status === 'active');
  const activeSales = salesProperties.filter((p: any) => p.status !== 'sold');
  const totalCommission = commissions.reduce((sum: number, c: any) => {
    const isOwner = c.ownerAgentId === agentId;
    const yourCommission = isOwner ? parseFloat(c.ownerCommission || 0) : parseFloat(c.bookingCommission || 0);
    return sum + yourCommission;
  }, 0);
  const totalSalesCommission = salesCommissions.reduce((sum: number, c: any) => {
    const isSeller = c.sellerAgentId === agentId;
    const yourCommission = isSeller ? parseFloat(c.sellerCommission || 0) : parseFloat(c.buyerCommission || 0);
    return sum + yourCommission;
  }, 0);

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/employee-stats">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">{agent.name}</h1>
            <p className="text-muted-foreground mt-1">{agent.email} • {agent.agency}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Bookings</div>
            <div className="text-2xl font-bold" data-testid="stat-total-bookings">{bookings.length}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rental Commission</div>
            <div className="text-2xl font-bold" data-testid="stat-rental-commission">€{totalCommission.toFixed(0)}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sales Commission</div>
            <div className="text-2xl font-bold" data-testid="stat-sales-commission">€{totalSalesCommission.toFixed(0)}</div>
          </div>
          <div className="bg-violet-50 dark:bg-violet-950/30 p-4 rounded-lg border border-violet-200 dark:border-violet-800">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Earnings</div>
            <div className="text-2xl font-bold" data-testid="stat-total-earnings">€{(totalCommission + totalSalesCommission).toFixed(0)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-4" data-testid="heading-rentals">Rental Properties ({activeRentals.length})</h2>
              {activeRentals.length > 0 ? (
                <div className="space-y-3">
                  {activeRentals.map((property: any) => (
                    <Card key={property.id} data-testid={`card-rental-${property.id}`}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold" data-testid={`text-title-${property.id}`}>{property.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                        <div className="flex gap-4 text-sm">
                          <span data-testid={`text-beds-${property.id}`}>{property.beds} beds</span>
                          <span data-testid={`text-baths-${property.id}`}>{property.baths} baths</span>
                          <span className="font-semibold" data-testid={`text-price-${property.id}`}>€{parseFloat(property.price).toLocaleString()}/night</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No active rental properties</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-4" data-testid="heading-sales">Sales Properties ({activeSales.length})</h2>
              {activeSales.length > 0 ? (
                <div className="space-y-3">
                  {activeSales.map((property: any) => (
                    <Card key={property.id} data-testid={`card-sale-${property.id}`}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold" data-testid={`text-title-${property.id}`}>{property.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                        <div className="flex gap-4 text-sm">
                          <span data-testid={`text-beds-${property.id}`}>{property.beds} beds</span>
                          <span data-testid={`text-baths-${property.id}`}>{property.baths} baths</span>
                          <span className="font-semibold" data-testid={`text-price-${property.id}`}>€{parseFloat(property.price).toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No active sales properties</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-primary mb-4" data-testid="heading-bookings">Recent Bookings ({bookings.length})</h2>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 10).map((booking: any) => (
                <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold" data-testid={`text-client-${booking.id}`}>{booking.clientName}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-dates-${booking.id}`}>
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`
                          ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                            'bg-slate-100 text-slate-800'}
                        `} data-testid={`badge-status-${booking.id}`}>
                          {booking.status}
                        </Badge>
                        <p className="font-semibold mt-1" data-testid={`text-amount-${booking.id}`}>€{parseFloat(booking.totalAmount).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No bookings yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
