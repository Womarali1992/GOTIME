
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      courtId: court.id,
      date: format(selectedDate, "yyyy-MM-dd"),
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
            <div className="gradient-border rounded-lg p-[1px]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md glass-card"
              />
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
