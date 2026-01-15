import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowRight, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [, setLocation] = useLocation();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setShowOtp(true);
    }
  };

  const handleOtpSubmit = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      // Mock verification success
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-serif font-bold text-center">
            {showOtp ? "Check your email" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-center">
            {showOtp
              ? `We've sent a 6-digit code to ${email}`
              : "Enter your email to sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOtp ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Log In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" type="button">
                Sign up your agency
              </Button>
            </form>
          ) : (
            <div className="space-y-6 flex flex-col items-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOtpSubmit}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the code?{" "}
                <button
                  className="text-primary hover:underline font-medium"
                  onClick={() => setShowOtp(false)}
                >
                  Change email
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
