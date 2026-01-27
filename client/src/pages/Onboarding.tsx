import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Phone,
  UserPlus,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import logoImg from "@assets/generated_images/minimalist_building_logo_icon.png";
import { useSendOtp, useVerifyOtp, useUpdateBranding, useUpdateContact } from "@/store/query/onboarding.queries";
import { Agent } from "@/store/slices/authSlice";
import { uploadToR2 } from "@/lib/utils";
import { useProfile, useUpdateProfile } from "@/store/api/profileApi";


interface AgentInvite {
  id: string;
  name: string;
  email: string;
  role: "AGENT" | "MANAGER";
}

interface OnboardingData {
  adminName: string;
  adminEmail: string;
  otp: string;
  agencyName: string;
  agencyLogo: File | null;
  agencyColor: string;
  agencySecondaryColor: string;
  agencyWebsite: string;
  agencyPhone: string;
  locations: string[];
  invites: AgentInvite[];
  acceptsTerms: boolean;
  acceptsPrivacy: boolean;
}

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const updateProfile = useUpdateProfile();
  const { data: profile } = useProfile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [locationInput, setLocationInput] = useState("");
  
  // Step 5 - Invite agents
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"AGENT" | "MANAGER">("AGENT");

  const [formData, setFormData] = useState<OnboardingData>({
    adminName: "",
    adminEmail: "",
    otp: "",
    agencyName: "",
    agencyLogo: null,
    agencyColor: "#0f172a",
    agencySecondaryColor: "#10b981",
    agencyWebsite: "",
    agencyPhone: "",
    locations: [],
    invites: [],
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



  // --- TanStack Query Mutations ---
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const updateBrandingMutation = useUpdateBranding();
  const updateContactMutation = useUpdateContact();


  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock API call
    try {
      await sendOtpMutation.mutateAsync({ email: formData.adminEmail, name: formData.adminName });
      toast.success(`Verification code sent to ${formData.adminEmail}`);
      nextStep();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP");
    }
    setLoading(false);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setLoading(true);
    // Mock API call
    try {
      await verifyOtpMutation.mutateAsync({ email: formData.adminEmail, otp: formData.otp });
      toast.success("Email verified successfully");
      nextStep();
    } catch (err) {
      console.error(err);
      toast.error("Invalid OTP");
    }
    setLoading(false);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agencyName) {
      toast.error("Please enter your agency name");
      return;
    }
    setLoading(true);

    try {
      console.log("🎨 [Step3] Starting branding update...");
      // 1️⃣ Upload logo if user selected a file
      let logoUrl: string | undefined = undefined;
      if (formData.agencyLogo) {
        console.log("📸 [Step3] Logo file detected, starting upload...");
        logoUrl = await uploadToR2(formData.agencyLogo)        
        updateProfile.mutate({ logo: logoUrl });
        console.log("✅ [Step3] Logo uploaded successfully:", logoUrl);
      } else {
        console.log("ℹ️ [Step3] No logo file selected, skipping upload");
      }

      console.log("💾 [Step3] Updating branding via mutation...");
      await updateBrandingMutation.mutateAsync({
        agencyName: formData.agencyName,
        agencyColor: formData.agencyColor,
        agencySecondaryColor: formData.agencySecondaryColor,
        agencyLogo: logoUrl, // include in case backend wants logo
      });
      console.log("✅ [Step3] Branding updated successfully");
      nextStep();
    } catch (err) {
      console.error("❌ [Step3] Error during step 3 submission:", err);
      toast.error("Failed to update branding");
    }
    setLoading(false);
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
    try {
      console.log("Submitting contact info:", { formData });
      await updateContactMutation.mutateAsync({ agencyPhone: formData.agencyPhone, website: formData.agencyWebsite, locations: formData.locations });
      toast.success("Contact information saved!");
      nextStep();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save contact information");
    }
    setLoading(false);
  };

  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Send invites to backend
      console.log("Sending invites:", formData.invites);
      toast.success("Agency account created successfully!");
      setLocation("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete setup");
    }
    setLoading(false);
  };

  // Extract dominant colors from an image
  const extractColorsFromImage = (file: File): Promise<{ primary: string; secondary: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Scale down image for faster processing
          const maxSize = 100;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Count color occurrences (simplified bucketing)
          const colorCounts: { [key: string]: number } = {};
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            // Skip transparent or nearly white/black pixels
            if (a < 125 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
              continue;
            }
            
            // Bucket colors to reduce variance
            const bucketedR = Math.floor(r / 32) * 32;
            const bucketedG = Math.floor(g / 32) * 32;
            const bucketedB = Math.floor(b / 32) * 32;
            
            const colorKey = `${bucketedR},${bucketedG},${bucketedB}`;
            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
          }
          
          // Sort by frequency
          const sortedColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([color]) => {
              const [r, g, b] = color.split(",").map(Number);
              return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
            });
          
          // Get primary and secondary colors
          const primary = sortedColors[0] || "#0f172a";
          const secondary = sortedColors[1] || "#10b981";
          
          resolve({ primary, secondary });
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be <2MB");
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    
    updateData("agencyLogo", file);
    
    // Extract colors from the image
    try {
      toast.info("Extracting brand colors from logo...");
      const { primary, secondary } = await extractColorsFromImage(file);
      updateData("agencyColor", primary);
      updateData("agencySecondaryColor", secondary);
      toast.success("Brand colors extracted successfully!");
    } catch (error) {
      console.error("Failed to extract colors:", error);
      toast.warning("Colors extracted, but you can adjust them manually");
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

  const addInvite = () => {
    if (!inviteName.trim()) {
      toast.error("Please enter agent name");
      return;
    }
    if (!inviteEmail.trim()) {
      toast.error("Please enter agent email");
      return;
    }
    if (formData.invites.some(inv => inv.email === inviteEmail.trim())) {
      toast.error("This email has already been invited");
      return;
    }
    
    const newInvite: AgentInvite = {
      id: Date.now().toString(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
    };
    
    updateData("invites", [...formData.invites, newInvite]);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("AGENT");
    toast.success(`Invite added for ${newInvite.name}`);
  };

  const removeInvite = (id: string) => {
    updateData("invites", formData.invites.filter(inv => inv.id !== id));
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

              <div className="space-y-3">
                <Label>Brand Colors</Label>
                <div className="grid grid-cols-2 gap-6">
                  {/* Primary Color */}
                  <div className="space-y-3">
                    <Label htmlFor="agencyColor" className="text-sm font-medium">Primary</Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-14 w-14 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                        style={{ backgroundColor: formData.agencyColor }}
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          id="agencyColor"
                          type="color"
                          value={formData.agencyColor}
                          onChange={(e) => updateData("agencyColor", e.target.value)}
                          className="h-10 cursor-pointer w-full"
                        />
                        <p className="text-xs text-muted-foreground font-mono">
                          {formData.agencyColor.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Secondary Color */}
                  <div className="space-y-3">
                    <Label htmlFor="agencySecondaryColor" className="text-sm font-medium">Secondary</Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-14 w-14 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                        style={{ backgroundColor: formData.agencySecondaryColor }}
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          id="agencySecondaryColor"
                          type="color"
                          value={formData.agencySecondaryColor}
                          onChange={(e) => updateData("agencySecondaryColor", e.target.value)}
                          className="h-10 cursor-pointer w-full"
                        />
                        <p className="text-xs text-muted-foreground font-mono">
                          {formData.agencySecondaryColor.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Colors are automatically extracted from your logo. You can adjust them manually.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" type="button" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button disabled={loading} type="submit">
                {loading ? "Updating..." : <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>}
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
                {loading ? "Saving..." : (
                  <>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 5 && (
          <form onSubmit={handleStep5Submit}>
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Invite Your Team</CardTitle>
              <CardDescription>Invite other agents to join your agency (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteName">Agent Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="inviteName"
                      placeholder="John Smith"
                      className="pl-9"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="john@agency.com"
                      className="pl-9"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: "AGENT" | "MANAGER") => setInviteRole(value)}>
                    <SelectTrigger id="inviteRole">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGENT">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Agent</div>
                            <div className="text-xs text-muted-foreground">Can manage properties and bookings</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="MANAGER">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Manager</div>
                            <div className="text-xs text-muted-foreground">Can manage properties, bookings, and view reports</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="button" variant="outline" onClick={addInvite} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Invite
                </Button>
              </div>

              <div className="space-y-3">
                <Label>Pending Invites ({formData.invites.length})</Label>
                <div className="space-y-2 min-h-[100px] max-h-[300px] overflow-y-auto">
                  {formData.invites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No invites yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add team members to collaborate on properties</p>
                    </div>
                  ) : (
                    formData.invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{invite.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{invite.email}</p>
                          </div>
                          <Badge variant={invite.role === "MANAGER" ? "default" : "secondary"} className="flex-shrink-0">
                            {invite.role === "MANAGER" ? "Manager" : "Agent"}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeInvite(invite.id)}
                          className="ml-3 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" type="button" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Completing Setup..." : (
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
