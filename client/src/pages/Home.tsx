import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Users, Network, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="font-serif font-bold text-2xl tracking-tight text-primary">RentNetAgents</span>
          </div>
          <Link href="/login">
            <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Agent Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden bg-primary text-primary-foreground pt-7 md:pt-10 lg:pt-12 pb-24 md:pb-32 lg:pb-40">
          {/* Background Pattern/Gradient */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-sm font-medium backdrop-blur-xl">
                <span className="flex h-2 w-2 rounded-full bg-secondary mr-2"></span>
                Exclusive Agency Network
              </div>
              
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-tight">
                Connect, Collaborate, <span className="text-secondary italic">Close Deals.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-2xl mx-auto font-light leading-relaxed">
                The private B2B platform for agencies to find, manage, and distribute properties within a trusted network of professionals.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-lg bg-secondary text-white hover:bg-secondary/90 w-full sm:w-auto">
                    Access Platform
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto">
                  <Network className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-primary">Agency Network</h3>
                <p className="text-muted-foreground">
                  Instantly distribute your listings to hundreds of partner agencies to maximize exposure while maintaining control.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-primary">Collaborative Sales</h3>
                <p className="text-muted-foreground">
                  Find the perfect property for your clients from the shared pool of exclusive listings.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold text-primary">Secure Platform</h3>
                <p className="text-muted-foreground">
                  A verified environment where commissions, bookings, and agent performance are tracked transparently.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
