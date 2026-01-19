; import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadToR2 } from './../lib/utils';
import { useDispatch } from 'react-redux';
const API_BASE = 'http://localhost:3003/api'; // adjust your backend URL



import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Palette,
  Upload,
  Bell,
  Lock,
  Eye,
  Shield,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/store/api/profileApi";

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("agency");
  const [locationInput, setLocationInput] = useState("");


  // --- Fetch profile with TanStack Query ---
  const updateProfile = useUpdateProfile();
  const { data: profile, isLoading } = useProfile();

  // Agency data
  const [agencyData, setAgencyData] = useState({
    name: profile?.name || "",
    logo: null as File | null,
    color: profile?.color || "#0f172a",
    website: profile?.website || "",
    phone: profile?.agencyPhone || "",
    locations: profile?.locations || [],
    logoUrl: profile?.logo || "",
  });

  const [userData, setUserData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    role: "Agency Owner",
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    bookingAlerts: true,
    marketingEmails: false,
    twoFactorAuth: false,
    publicProfile: true,
  });

  useEffect(() => {
    if (!profile) return;

    setAgencyData({
      name: profile.name ?? "",
      logo: null,
      color: profile.color ?? "#0f172a",
      website: profile.website ?? "",
      phone: profile.agencyPhone ?? "",
      locations: profile.locations ?? [],
      logoUrl: profile.logo ?? "",
    });

    setUserData({
      name: profile.name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      role: "Agency Owner",
    });
  }, [profile]);

  const updateAgencyData = (key: string, value: any) =>
    setAgencyData((prev) => ({ ...prev, [key]: value }));
  const updateUserData = (key: string, value: any) =>
    setUserData((prev) => ({ ...prev, [key]: value }));
  const updateSettings = (key: string, value: boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const addLocation = () => {
    if (locationInput.trim() && !agencyData.locations.includes(locationInput.trim())) {
      updateAgencyData("locations", [...agencyData.locations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    updateAgencyData("locations", agencyData.locations.filter((l: string) => l !== loc));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be less than 2MB");
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");

    updateAgencyData("logo", file);
  };

  const handleSaveAgency = () => {
    updateProfile.mutate({
      agency: agencyData.name,
      color: agencyData.color,
      website: agencyData.website,
      agencyPhone: agencyData.phone,
      locations: agencyData.locations,
      logoFile: agencyData.logo,
    });
  };

  const handleSaveUser = () => {
    updateProfile.mutate({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
    });
  };

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully"); // You can integrate settings API if needed
  };



  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your agency and personal information</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="agency">Agency</TabsTrigger>
            <TabsTrigger value="user">User Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Agency Information Tab */}
          <TabsContent value="agency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Agency Information</CardTitle>
                <CardDescription>Update your agency's profile and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="agencyName"
                      placeholder="Agency Name"
                      className="pl-9"
                      value={agencyData.name}
                      onChange={(e) => updateAgencyData("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencyLogo">Agency Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                        {(agencyData.logo || agencyData.logoUrl )? (
                          <img
                            src={agencyData.logo ? URL.createObjectURL(agencyData.logo) : agencyData.logoUrl}
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
                        className="h-12 w-12 rounded-lg border-2 border-border"
                        style={{ backgroundColor: agencyData.color }}
                      />
                    </div>
                    <div className="flex-1 flex gap-2 items-center">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="agencyColor"
                        type="color"
                        value={agencyData.color}
                        onChange={(e) => updateAgencyData("color", e.target.value)}
                        className="h-10 w-24 cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{agencyData.color}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencyWebsite">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="agencyWebsite"
                      placeholder="www.agency.com"
                      className="pl-9"
                      value={agencyData.website}
                      onChange={(e) => updateAgencyData("website", e.target.value)}
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
                      value={agencyData.phone}
                      onChange={(e) => updateAgencyData("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Operating Locations</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Add a city"
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
                    {agencyData.locations.map((loc: string) => (
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
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveAgency}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Info Tab */}
          <TabsContent value="user" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="userName"
                      placeholder="Your name"
                      className="pl-9"
                      value={userData.name}
                      onChange={(e) => updateUserData("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="email@example.com"
                      className="pl-9"
                      value={userData.email}
                      onChange={(e) => updateUserData("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="userPhone"
                      placeholder="+34 612 345 678"
                      className="pl-9"
                      value={userData.phone}
                      onChange={(e) => updateUserData("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userRole">Role</Label>
                  <Input
                    id="userRole"
                    placeholder="Your role"
                    value={userData.role}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Contact support to change your role</p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveUser}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="emailNotifications" className="font-medium">Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about important updates
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSettings("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="bookingAlerts" className="font-medium">Booking Alerts</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new bookings and requests
                    </p>
                  </div>
                  <Switch
                    id="bookingAlerts"
                    checked={settings.bookingAlerts}
                    onCheckedChange={(checked) => updateSettings("bookingAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="marketingEmails" className="font-medium">Marketing Emails</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and updates
                    </p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => updateSettings("marketingEmails", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Security</CardTitle>
                <CardDescription>Manage your security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="twoFactorAuth" className="font-medium">Two-Factor Authentication</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => updateSettings("twoFactorAuth", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="publicProfile" className="font-medium">Public Profile</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Make your agency profile visible to other agents
                    </p>
                  </div>
                  <Switch
                    id="publicProfile"
                    checked={settings.publicProfile}
                    onCheckedChange={(checked) => updateSettings("publicProfile", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
