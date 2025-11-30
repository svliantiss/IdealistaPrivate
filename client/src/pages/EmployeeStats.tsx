import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";

const CURRENT_AGENT_ID = 1;
const COMPANY_AGENCY = "Velmont Properties";

export default function EmployeeStats() {
  const { data: currentAgent = null } = useQuery<any>({
    queryKey: [`/api/agents/${CURRENT_AGENT_ID}`],
  });

  const { data: employeeStats = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/employees/agency/${COMPANY_AGENCY}/stats`],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-12">Loading employee stats...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Employee Stats</h1>
            <p className="text-muted-foreground mt-1">Team performance for {COMPANY_AGENCY}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {employeeStats.map((employee: any) => (
            <Card key={employee.id} className="overflow-hidden hover:shadow-md transition-shadow border-border/50" data-testid={`card-employee-${employee.id}`}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg" data-testid={`text-name-${employee.id}`}>{employee.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{employee.email}</p>
                </div>
                <Badge className={employee.id === CURRENT_AGENT_ID ? "bg-sidebar text-white" : "bg-blue-100 text-blue-800"}>
                  {employee.id === CURRENT_AGENT_ID ? "You (Manager)" : "Team Member"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Bookings</div>
                    <div className="text-2xl font-bold" data-testid={`stat-bookings-${employee.id}`}>{employee.totalBookings}</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rental Commission</div>
                    <div className="text-2xl font-bold" data-testid={`stat-rental-commission-${employee.id}`}>€{employee.totalCommission.toFixed(0)}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sales Commission</div>
                    <div className="text-2xl font-bold" data-testid={`stat-sales-commission-${employee.id}`}>€{employee.totalSalesCommission.toFixed(0)}</div>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-950/30 p-4 rounded-lg border border-violet-200 dark:border-violet-800">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Earnings</div>
                    <div className="text-2xl font-bold" data-testid={`stat-total-earnings-${employee.id}`}>€{(employee.totalCommission + employee.totalSalesCommission).toFixed(0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {employeeStats.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-serif text-xl font-bold mb-2">No employees yet</h3>
              <p className="text-muted-foreground">You can add employees to your team through the Admin panel.</p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
