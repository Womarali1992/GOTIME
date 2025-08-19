
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScheduleCourtFormProps {
  court: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: any) => void;
}

const ScheduleCourtForm = ({ court, isOpen, onClose, onSave }: ScheduleCourtFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAvailable, setIsAvailable] = useState(true);
  const [startTime, setStartTime] = useState("8:00");
  const [endTime, setEndTime] = useState("9:00");

  // Generate time slots (8am to 10pm)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 22; hour++) {
      options.push(`${hour}:00`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      courtId: court.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime,
      endTime,
      available: isAvailable,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gradient-card gradient-border neon-border max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">Schedule {court.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="gradient-text">Select Date</Label>
            <div className="gradient-border rounded-xl p-[1px]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-xl glass-card border-0 shadow-lg"
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-lg font-semibold text-foreground",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-primary/10 hover:bg-primary/20 text-primary border-0 rounded-lg transition-colors",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-10 font-medium text-sm",
                  row: "flex w-full mt-2",
                  cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-muted/30 [&:has([aria-selected])]:bg-muted/30 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-lg transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground shadow-lg",
                  day_today: "bg-secondary/20 text-secondary-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-50 aria-selected:bg-muted/30 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-muted/30 aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="gradient-text">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="startTime" className="gradient-border glass-card">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`start-${time}`} value={time} className="gradient-hover">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime" className="gradient-text">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="endTime" className="gradient-border glass-card">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.filter(time => {
                    // Only show end times that are after the selected start time
                    const startHour = parseInt(startTime.split(':')[0]);
                    const timeHour = parseInt(time.split(':')[0]);
                    return timeHour > startHour;
                  }).map((time) => (
                    <SelectItem key={`end-${time}`} value={time} className="gradient-hover">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="available"
              checked={isAvailable}
              onCheckedChange={(checked) => setIsAvailable(checked === true)}
              className="gradient-border"
            />
            <Label htmlFor="available" className="gradient-text">Court Available</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="gradient-hover">
              Cancel
            </Button>
            <Button type="submit" className="gradient-border gradient-hover">Save Schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleCourtForm;
