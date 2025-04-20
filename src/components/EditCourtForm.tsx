
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface EditCourtFormProps {
  court: {
    id: string;
    name: string;
    location: string;
    indoor: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (courtData: any) => void;
}

const EditCourtForm = ({ court, isOpen, onClose, onSave }: EditCourtFormProps) => {
  const [courtData, setCourtData] = useState({
    name: court.name,
    location: court.location,
    indoor: court.indoor,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...court, ...courtData });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Court Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Court Name</Label>
            <Input
              id="name"
              value={courtData.name}
              onChange={(e) =>
                setCourtData({ ...courtData, name: e.target.value })
              }
              className="w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={courtData.location}
              onChange={(e) =>
                setCourtData({ ...courtData, location: e.target.value })
              }
              className="w-full"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="indoor"
              checked={courtData.indoor}
              onCheckedChange={(checked) =>
                setCourtData({ ...courtData, indoor: checked === true })
              }
            />
            <Label htmlFor="indoor">Indoor Court</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourtForm;
