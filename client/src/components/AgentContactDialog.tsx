import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, Building2, MapPin } from "lucide-react";
import { useState } from "react";

interface Agent {
  id: number;
  name: string;
  email: string;
  agency?: string;
  phone?: string;
  agencyPhone?: string;
  agencyEmail?: string;
}

interface AgentContactDialogProps {
  agent: Agent;
}

export function AgentContactDialog({ agent }: AgentContactDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4" data-testid="button-contact-agent">
          Contact Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Contact Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {agent.name?.charAt(0) || 'A'}
            </div>
            <div>
              <h3 className="text-lg font-semibold" data-testid="dialog-agent-name">{agent.name}</h3>
              <p className="text-muted-foreground">Real Estate Agent</p>
            </div>
          </div>

          <Card className="bg-muted/30">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Email</p>
                  <a 
                    href={`mailto:${agent.email}`} 
                    className="text-sm font-medium text-primary hover:underline"
                    data-testid="dialog-agent-email"
                  >
                    {agent.email}
                  </a>
                </div>
              </div>

              {agent.phone && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium">Phone</p>
                    <a 
                      href={`tel:${agent.phone}`} 
                      className="text-sm font-medium text-primary hover:underline"
                      data-testid="dialog-agent-phone"
                    >
                      {agent.phone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {agent.agency && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium">Agency</p>
                    <p className="text-sm font-semibold" data-testid="dialog-agency-name">{agent.agency}</p>
                  </div>
                </div>

                {agent.agencyEmail && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Agency Email</p>
                      <a 
                        href={`mailto:${agent.agencyEmail}`} 
                        className="text-sm font-medium text-secondary hover:underline"
                        data-testid="dialog-agency-email"
                      >
                        {agent.agencyEmail}
                      </a>
                    </div>
                  </div>
                )}

                {agent.agencyPhone && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium">Agency Phone</p>
                      <a 
                        href={`tel:${agent.agencyPhone}`} 
                        className="text-sm font-medium text-secondary hover:underline"
                        data-testid="dialog-agency-phone"
                      >
                        {agent.agencyPhone}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1 bg-primary text-white" 
              onClick={() => window.location.href = `mailto:${agent.email}`}
              data-testid="button-send-email"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
            {agent.phone && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = `tel:${agent.phone}`}
                data-testid="button-call-agent"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
