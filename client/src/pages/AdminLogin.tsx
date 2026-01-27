import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import logoImg from "@assets/generated_images/minimalist_building_logo_icon.png";

export default function AdminLogin() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-xl bg-sidebar flex items-center justify-center">
              <img src={logoImg} alt="RentNetAgents" className="h-10 w-10 rounded-md" />
            </div>
          </div>
          <CardTitle className="font-serif text-2xl">Admin Login</CardTitle>
          <CardDescription>Admin authentication via OTP is required</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Admin login functionality will be implemented with OTP authentication.
            </p>
            <Button 
              onClick={() => navigate("/dashboard")}
              className="w-full bg-sidebar hover:bg-sidebar/90"
            >
              <LogIn className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
