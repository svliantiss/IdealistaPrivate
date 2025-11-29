import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search as SearchIcon, MapPin, Calendar, Filter, Heart, Share2, ArrowRight } from "lucide-react";
import { useState } from "react";
import villaImg from "@assets/generated_images/modern_luxury_villa_exterior_with_pool.png";
import aptImg from "@assets/generated_images/modern_apartment_interior_living_room.png";
import studioImg from "@assets/generated_images/cozy_studio_apartment_interior.png";

// Mock Data
const PROPERTIES = [
  {
    id: 1,
    title: "Villa Paraiso with Infinity Pool",
    location: "Marbella, Golden Mile",
    price: 450,
    period: "night",
    beds: 5,
    baths: 6,
    sqm: 450,
    type: "Villa",
    image: villaImg,
    agent: "Luxury Living SL",
    tags: ["Sea View", "Pool", "Private Parking"]
  },
  {
    id: 2,
    title: "Modern Sea View Penthouse",
    location: "Puerto Banus, Malaga",
    price: 280,
    period: "night",
    beds: 3,
    baths: 2,
    sqm: 140,
    type: "Apartment",
    image: aptImg,
    agent: "Coastal Homes",
    tags: ["Terrace", "Wifi", "AC"]
  },
  {
    id: 3,
    title: "Historic Center Chic Studio",
    location: "Malaga Centro",
    price: 120,
    period: "night",
    beds: 1,
    baths: 1,
    sqm: 45,
    type: "Studio",
    image: studioImg,
    agent: "Urban Stays",
    tags: ["Historic", "Central", "Design"]
  },
  {
    id: 4,
    title: "Golf Front Family Villa",
    location: "Nueva Andalucia",
    price: 380,
    period: "night",
    beds: 4,
    baths: 3,
    sqm: 320,
    type: "Villa",
    image: villaImg,
    agent: "Golf Properties",
    tags: ["Golf View", "Garden", "BBQ"]
  }
];

export default function Search() {
  const [priceRange, setPriceRange] = useState([0, 1000]);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] flex-col">
        {/* Search Header */}
        <div className="bg-white border-b border-border p-6 shadow-sm z-10 sticky top-0">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="City, neighborhood..." className="pl-9 bg-slate-50 border-slate-200" />
                </div>
              </div>
              
              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Dates</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Select dates" className="pl-9 bg-slate-50 border-slate-200" />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Type</label>
                <Select>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex items-end">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium">
                  <SearchIcon className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </div>
          </div>
          
          {/* Active Filters Row */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            <Button variant="outline" size="sm" className="h-8 border-dashed text-muted-foreground">
              <Filter className="mr-2 h-3 w-3" /> More Filters
            </Button>
            <Badge variant="secondary" className="h-7 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-normal">
              Pool X
            </Badge>
            <Badge variant="secondary" className="h-7 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-normal">
              WiFi X
            </Badge>
            <div className="ml-auto text-sm text-muted-foreground">
              Found <strong>124</strong> results
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content - Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {PROPERTIES.map((property) => (
                <div key={property.id} className="group bg-white rounded-lg border border-border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
                  {/* Image Carousel Placeholder */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={property.image} 
                      alt={property.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 text-slate-900 hover:bg-white hover:text-red-500 shadow-sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm shadow-sm border-0">
                        {property.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{property.agent}</div>
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        ★ 4.9
                      </div>
                    </div>
                    
                    <h3 className="font-serif text-lg font-bold text-primary mb-1 line-clamp-1 group-hover:text-secondary transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-muted-foreground text-sm mb-4">
                      <MapPin className="h-3 w-3 mr-1" />
                      {property.location}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{property.beds}</span> <span className="text-muted-foreground text-xs">Beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{property.baths}</span> <span className="text-muted-foreground text-xs">Baths</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{property.sqm}</span> <span className="text-muted-foreground text-xs">m²</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-primary">€{property.price}</span>
                        <span className="text-muted-foreground text-sm">/{property.period}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 px-2">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="h-8 bg-primary text-white hover:bg-primary/90">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
