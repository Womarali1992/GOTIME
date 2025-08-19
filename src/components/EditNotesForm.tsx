/**
 * @deprecated This component is deprecated. Use CommentForm instead for multiple comment support.
 * EditNotesForm only supports single notes, while CommentForm supports multiple comments per item.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar } from "lucide-react";

interface EditNotesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  currentNotes?: string;
  title: string;
  description: string;
  type: 'reservation' | 'user';
  data: {
    name: string;
    email?: string;
    date?: string;
    time?: string;
    court?: string;
    membershipType?: string;
  };
}

const EditNotesForm = ({
  isOpen,
  onClose,
  onSave,
  currentNotes = "",
  title,
  description,
  type,
  data
}: EditNotesFormProps) => {
  const [notes, setNotes] = useState(currentNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNotes(currentNotes);
  }, [currentNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(notes);
      onClose();
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'reservation' ? <Calendar className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data Display */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{data.name}</span>
            </div>
            
            {data.email && (
              <div className="text-sm text-muted-foreground">
                {data.email}
              </div>
            )}
            
            {type === 'reservation' && data.date && data.time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {data.date} at {data.time}
              </div>
            )}
            
            {type === 'reservation' && data.court && (
              <div className="text-sm text-muted-foreground">
                Court: {data.court}
              </div>
            )}
            
            {type === 'user' && data.membershipType && (
              <div className="flex items-center gap-2">
                <Badge variant={data.membershipType === 'premium' ? 'default' : 'outline'}>
                  {data.membershipType}
                </Badge>
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Admin Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this reservation/user (only visible to admins)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              These notes are only visible to administrators and will not be shown to users.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditNotesForm;
