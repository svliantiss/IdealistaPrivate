import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, LogOut, Users, Building, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@assets/generated_images/minimalist_building_logo_icon.png";

export default function Admin() {
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", email: "", agency: "", phone: "" });
  const queryClient = useQueryClient();

  // Check admin status
  const { data: adminStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/admin/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/status");
      return res.json();
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (!statusLoading && !adminStatus?.isAdmin) {
      navigate("/admin/login");
    }
  }, [adminStatus, statusLoading, navigate]);

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/agents"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
    enabled: adminStatus?.isAdmin,
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (agent: typeof newAgent) => {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create agent");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setIsDialogOpen(false);
      setNewAgent({ name: "", email: "", agency: "", phone: "" });
      toast.success("Agent created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      const res = await fetch(`/api/admin/agents/${agentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      toast.success("Agent deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete agent");
    },
  });

  // Logout
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    navigate("/admin/login");
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!adminStatus?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Admin Header */}
      <header className="bg-sidebar text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="RentNetAgents" className="h-8 w-8 rounded-md" />
            <span className="font-serif font-bold text-xl">RentNetAgents Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-white/80 hover:text-white flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </a>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
              data-testid="button-admin-logout"
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-agents">{agents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Agencies</CardTitle>
              <Building className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(agents.map((a: any) => a.agency).filter(Boolean)).size}</div>
            </CardContent>
          </Card>
        </div>

        {/* Agents Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif">Manage Agents</CardTitle>
              <CardDescription>Add, view, or remove agents from the platform</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary hover:bg-secondary/90" data-testid="button-add-agent">
                  <Plus className="mr-2 h-4 w-4" /> Add Agent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Agent</DialogTitle>
                  <DialogDescription>
                    Create a new agent account. They will be able to access the platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      data-testid="input-agent-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@agency.com"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                      data-testid="input-agent-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agency">Agency</Label>
                    <Input
                      id="agency"
                      placeholder="Luxury Homes RE"
                      value={newAgent.agency}
                      onChange={(e) => setNewAgent({ ...newAgent, agency: e.target.value })}
                      data-testid="input-agent-agency"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+34 952 123 456"
                      value={newAgent.phone}
                      onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                      data-testid="input-agent-phone"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createAgentMutation.mutate(newAgent)}
                    disabled={!newAgent.name || !newAgent.email || createAgentMutation.isPending}
                    data-testid="button-save-agent"
                  >
                    {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No agents found. Add your first agent to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent: any) => (
                    <TableRow key={agent.id} data-testid={`row-agent-${agent.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${agent.id}`}>{agent.name}</TableCell>
                      <TableCell data-testid={`text-email-${agent.id}`}>{agent.email}</TableCell>
                      <TableCell>
                        {agent.agency ? (
                          <Badge variant="secondary">{agent.agency}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{agent.phone || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
                              deleteAgentMutation.mutate(agent.id);
                            }
                          }}
                          data-testid={`button-delete-${agent.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
