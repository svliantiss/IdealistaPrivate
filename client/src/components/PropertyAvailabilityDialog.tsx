import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface PropertyAvailabilityDialogProps {
  propertyId: number;
  propertyTitle: string;
  showLabel?: boolean;
}

export function PropertyAvailabilityDialog({ propertyId, propertyTitle, showLabel = true }: PropertyAvailabilityDialogProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [open, setOpen] = useState(false);

  const { data: availability = [] } = useQuery<any[]>({
    queryKey: [`/api/property-availability/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/property-availability/${propertyId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && propertyId > 0,
  });

  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    availability.forEach((a: any) => {
      if (a.isAvailable === 0) {
        const start = new Date(a.startDate);
        const end = new Date(a.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
      }
    });
    return dates;
  }, [availability]);

  const isDateBooked = (date: Date) => {
    return bookedDates.some(d => 
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={showLabel ? "h-8" : "h-8 px-2"}
          data-testid={`button-calendar-${propertyId}`}
        >
          <Calendar className={showLabel ? "mr-2 h-4 w-4" : "h-4 w-4"} />
          {showLabel && "Calendar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif">Availability Calendar</DialogTitle>
          <p className="text-sm text-muted-foreground">{propertyTitle}</p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300"></div>
              <span>Past</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              ← Previous
            </Button>
            <h3 className="text-lg font-semibold">
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              Next →
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {getDaysInMonth(selectedMonth).map((date, i) => (
              <div 
                key={i} 
                className={`text-center py-2 rounded text-sm transition-colors ${
                  date 
                    ? isPast(date)
                      ? 'bg-slate-50 text-slate-400 border border-slate-100'
                      : isDateBooked(date)
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : ''
                } ${date && isToday(date) ? 'ring-2 ring-primary ring-offset-1' : ''}`}
              >
                {date?.getDate() || ''}
              </div>
            ))}
          </div>

          {availability.filter((a: any) => a.isAvailable === 0).length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Booked Periods:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                {availability.filter((a: any) => a.isAvailable === 0).slice(0, 5).map((a: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {new Date(a.startDate).toLocaleDateString()} - {new Date(a.endDate).toLocaleDateString()}
                    </span>
                    {a.notes && <span className="text-xs italic">{a.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
