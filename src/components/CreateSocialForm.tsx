import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
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
import type { CreateSocial } from "@/lib/validation/schemas";

interface CreateSocialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (socialData: CreateSocial) => void;
  currentUserId: string;
  currentUserName: string;
  courts: Array<{ id: string; name: string }>;
  initialDate?: Date;
  initialCourtId?: string;
  initialTime?: string; // The start time of the selected slot (e.g., "10:00")
}

const CreateSocialForm = ({
  isOpen,
  onClose,
  onSave,
  currentUserId,
  currentUserName,
  courts,
  initialDate,
  initialCourtId,
  initialTime
}: CreateSocialFormProps) => {
  // Calculate default time window based on initialTime
  const getDefaultTimeWindow = () => {
    if (initialTime) {
      const [hours, minutes] = initialTime.split(':');
      const startHour = parseInt(hours);
      // Default to 30-minute window centered on the selected time
      const endHour = startHour + 1;
      return {
        start: initialTime, // Use exact time clicked (e.g., "10:00")
        end: `${endHour.toString().padStart(2, '0')}:${minutes || '00'}` // e.g., "11:00"
      };
    }
    return { start: "18:00", end: "21:00" }; // Default 6pm-9pm
  };

  const defaultWindow = getDefaultTimeWindow();

  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [windowStart, setWindowStart] = useState(defaultWindow.start);
  const [windowEnd, setWindowEnd] = useState(defaultWindow.end);
  const [selectedCourt, setSelectedCourt] = useState<string>(initialCourtId || "");

  // Update state when initial props change
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (initialCourtId) {
      setSelectedCourt(initialCourtId);
    }
  }, [initialCourtId]);

  useEffect(() => {
    if (initialTime) {
      const [hours, minutes] = initialTime.split(':');
      const startHour = parseInt(hours);
      const endHour = startHour + 1;
      setWindowStart(initialTime);
      setWindowEnd(`${endHour.toString().padStart(2, '0')}:${minutes || '00'}`);
    }
  }, [initialTime]);

  // Generate time slots (6am to 11pm in 30-minute increments)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 23; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) {
        options.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Generate suggested time slots based on window (only :00 and :30)
  const generateSuggestedSlots = (start: string, end: string) => {
    const startHour = parseInt(start.split(':')[0]);
    const startMinute = parseInt(start.split(':')[1]);
    const endHour = parseInt(end.split(':')[0]);
    const endMinute = parseInt(end.split(':')[1]);

    const slots = [];
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    // Generate all :00 and :30 slots within the window
    let currentMinutes = startTimeMinutes;

    // Round up to next :00 or :30
    const remainder = currentMinutes % 30;
    if (remainder !== 0) {
      currentMinutes += (30 - remainder);
    }

    // Generate slots at :00 and :30 intervals
    let slotIndex = 0;
    while (currentMinutes <= endTimeMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      slots.push({
        id: `slot-${Date.now()}-${slotIndex}`,
        time: timeStr,
        votes: [],
        isLocked: false
      });

      currentMinutes += 30;
      slotIndex++;
    }

    return slots;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourt) {
      alert("Please select a court");
      return;
    }

    const timeSlots = generateSuggestedSlots(windowStart, windowEnd);

    onSave({
      title,
      hostId: currentUserId,
      hostName: currentUserName,
      date: format(selectedDate, "yyyy-MM-dd"),
      timeWindowStart: windowStart,
      timeWindowEnd: windowEnd,
      timeSlots,
      courtId: selectedCourt,
    });

    // Reset form
    setTitle("");
    setSelectedDate(new Date());
    setWindowStart("18:00");
    setWindowEnd("21:00");
    setSelectedCourt("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gradient-card gradient-border neon-border max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">Create a Social</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="gradient-text">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pickle + Beers @ Memorial Park"
              required
              className="gradient-border glass-card"
            />
          </div>

          {!initialCourtId ? (
            <div className="space-y-2">
              <Label htmlFor="court" className="gradient-text">Court</Label>
              <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                <SelectTrigger id="court" className="gradient-border glass-card">
                  <SelectValue placeholder="Select a court" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((court) => (
                    <SelectItem key={court.id} value={court.id} className="gradient-hover">
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="gradient-text">Court</Label>
              <div className="gradient-border glass-card p-3 rounded-lg">
                <p className="text-center font-semibold">
                  {courts.find(c => c.id === selectedCourt)?.name || "Selected Court"}
                </p>
              </div>
            </div>
          )}

          {!initialDate ? (
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
                    cell: "h-10 w-10 text-center text-sm p-0 relative",
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-lg transition-colors",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground shadow-lg",
                    day_today: "bg-secondary/20 text-secondary-foreground font-semibold",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="gradient-text">Date</Label>
              <div className="gradient-border glass-card p-3 rounded-lg">
                <p className="text-center font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="windowStart" className="gradient-text">Window Start</Label>
              <Select value={windowStart} onValueChange={setWindowStart}>
                <SelectTrigger id="windowStart" className="gradient-border glass-card">
                  <SelectValue placeholder="Select start" />
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
              <Label htmlFor="windowEnd" className="gradient-text">Window End</Label>
              <Select value={windowEnd} onValueChange={setWindowEnd}>
                <SelectTrigger id="windowEnd" className="gradient-border glass-card">
                  <SelectValue placeholder="Select end" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.filter(time => {
                    const startMinutes = parseInt(windowStart.split(':')[0]) * 60 + parseInt(windowStart.split(':')[1]);
                    const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
                    return timeMinutes > startMinutes;
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

          <div className="text-sm text-muted-foreground">
            The app will auto-generate time slots within your window for players to vote on.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="gradient-hover">
              Cancel
            </Button>
            <Button type="submit" className="gradient-border gradient-hover">Create Social</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSocialForm;
