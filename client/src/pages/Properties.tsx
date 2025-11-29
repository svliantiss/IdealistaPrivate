import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import villaImg from "@assets/generated_images/modern_luxury_villa_exterior_with_pool.png";
import aptImg from "@assets/generated_images/modern_apartment_interior_living_room.png";

export default function Properties() {
  const myProperties = [
    {
      id: 1,
      title: "Villa Paraiso with Infinity Pool",
      location: "Marbella, Golden Mile",
      price: 450,
      status: "Active",
      bookings: 3,
      image: villaImg,
      lastUpdated: "2 days ago"
    },
    {
      id: 2,
      title: "Downtown Modern Loft",
      location: "Malaga Centro",
      price: 180,
      status: "Draft",
      bookings: 0,
      image: aptImg,
      lastUpdated: "1 week ago"
    }
  ];

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">My Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage your listings and availability.</p>
          </div>
          <Button className="bg-secondary hover:bg-secondary/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Property
          </Button>
        </div>

        <div className="space-y-4">
          {myProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto relative">
                    <img src={property.image} alt={property.title} className="object-cover w-full h-full" />
                    <div className="absolute top-3 left-3">
                      <Badge className={property.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}>
                        {property.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-xl font-bold text-primary mb-1">{property.title}</h3>
                          <p className="text-muted-foreground text-sm">{property.location}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Public Page</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit Listing</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex gap-6 mt-4 text-sm">
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Price</span>
                          <span className="font-semibold">€{property.price}/night</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Bookings</span>
                          <span className="font-semibold">{property.bookings} active</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Last Updated</span>
                          <span className="font-semibold">{property.lastUpdated}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3 justify-end">
                      <Button variant="outline" size="sm">Calendar</Button>
                      <Button variant="outline" size="sm">Edit Details</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
