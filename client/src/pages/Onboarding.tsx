import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Phone 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import logoImg from "@assets/generated_images/minimalist_building_logo_icon.png";

interface OnboardingData {
  adminName: string;
  adminEmail: string;
  otp: string;
  agencyName: string;
  agencyLogo: File | null;
  agencyColor: string;
  agencyWebsite: string;
  agencyPhone: string;
  locations: string[];
  acceptsTerms: boolean;
  acceptsPrivacy: boolean;
}

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [locationInput, setLocationInput] = useState("");
  
  const [formData, setFormData] = useState<OnboardingData>({
    adminName: "",
    adminEmail: "",
    otp: "",
    agencyName: "",
    agencyLogo: null,
    agencyColor: "#0f172a",
    agencyWebsite: "",
    agencyPhone: "",
    locations: [],
    acceptsTerms: false,
    acceptsPrivacy: false
  });

  const updateData = (key: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success(`Verification code sent to ${formData.adminEmail}`);
    nextStep();
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    toast.success("Email verified successfully");
    nextStep();
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agencyName) {
      toast.error("Please enter your agency name");
      return;
    }
    nextStep();
  };

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agencyPhone) {
      toast.error("Please enter your office phone");
      return;
    }
    if (formData.locations.length === 0) {
      toast.error("Please add at least one location");
      return;
    }
    if (!formData.acceptsTerms) {
      toast.error("You must accept the terms and conditions");
      return;
    }
    if (!formData.acceptsPrivacy) {
      toast.error("You must accept the privacy policy");
      return;
    }

    setLoading(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    toast.success("Agency account created successfully!");
    setLocation("/dashboard");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      updateData("agencyLogo", file);
    }
  };

  const addLocation = () => {
    if (locationInput.trim() && !formData.locations.includes(locationInput.trim())) {
      updateData("locations", [...formData.locations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    updateData("locations", formData.locations.filter(l => l !== loc));
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-lg mb-8 space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl bg-sidebar flex items-center justify-center shadow-lg">
            <img src={logoImg} alt="RentNetAgents" className="h-10 w-10 rounded-md" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Card className="w-full max-w-lg shadow-lg border-0 sm:border">
        {step === 1 && (
          <form onSubmit={handleStep1Submit}>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Welcome to Idealista</CardTitle>
              <CardDescription>Let's start by getting to know you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="adminName" 
                    placeholder="John Doe" 
                    className="pl-9"
                    value={formData.adminName}
                    onChange={(e) => updateData("adminName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="adminEmail" 
                    type="email" 
                    placeholder="john@agency.com" 
                    className="pl-9"
                    value={formData.adminEmail}
                    onChange={(e) => updateData("adminEmail", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" type="button" onClick={() => setLocation("/login")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Continue"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Verify your email</CardTitle>
              <CardDescription>
                We sent a 6-digit code to <span className="font-medium text-foreground">{formData.adminEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex flex-col items-center">
              <InputOTP 
                maxLength={6} 
                value={formData.otp} 
                onChange={(val) => updateData("otp", val)}
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
              <p className="text-sm text-muted-foreground">
                Didn't receive it? <Button variant="link" className="p-0 h-auto" type="button">Resend code</Button>
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" type="button" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={loading || formData.otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit}>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Agency Branding</CardTitle>
              <CardDescription>Customize your agency's appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="agencyName" 
                    placeholder="Luxury Estates" 
                    className="pl-9"
                    value={formData.agencyName}
                    onChange={(e) => updateData("agencyName", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agencyLogo">Agency Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                      {formData.agencyLogo ? (
                        <img 
                          src={URL.createObjectURL(formData.agencyLogo)} 
                          alt="Logo preview" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Input 
                      id="agencyLogo" 
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyColor">Brand Color</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div 
                      className="h-20 w-20 rounded-lg border-2 border-border"
                      style={{ backgroundColor: formData.agencyColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input 
                      id="agencyColor" 
                      type="color"
                      value={formData.agencyColor}
                      onChange={(e) => updateData("agencyColor", e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {formData.agencyColor}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" type="button" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleStep4Submit}>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Contact & Location</CardTitle>
              <CardDescription>Tell us where and how to reach your agency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agencyWebsite">Website (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="agencyWebsite" 
                    placeholder="www.luxuryestates.com" 
                    className="pl-9"
                    value={formData.agencyWebsite}
                    onChange={(e) => updateData("agencyWebsite", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agencyPhone">Office Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="agencyPhone" 
                    placeholder="+34 123 456 789" 
                    className="pl-9"
                    value={formData.agencyPhone}
                    onChange={(e) => updateData("agencyPhone", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Primary Locations</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. Marbella, Malaga" 
                      className="pl-9"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLocation();
                        }
                      }}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addLocation}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {formData.locations.map(loc => (
                    <Badge key={loc} variant="secondary" className="px-3 py-1 text-sm">
                      {loc}
                      <button 
                        type="button" 
                        onClick={() => removeLocation(loc)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {formData.locations.length === 0 && (
                    <span className="text-sm text-muted-foreground italic py-1">No locations added yet</span>
                  )}
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={formData.acceptsTerms}
                    onCheckedChange={(checked) => updateData("acceptsTerms", checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I agree to the Terms and Conditions
                    </label>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="privacy" 
                    checked={formData.acceptsPrivacy}
                    onCheckedChange={(checked) => updateData("acceptsPrivacy", checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="privacy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I acknowledge the Privacy Policy
                    </label>
                    <p className="text-sm text-muted-foreground">
                      I understand how my data will be processed as described in the <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" type="button" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating Account..." : (
                  <>
                    Complete Setup <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}

      </Card>
    </div>
  );
}
