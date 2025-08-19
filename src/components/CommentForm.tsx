import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar, MessageSquare, Plus, Edit, Trash2 } from "lucide-react";
import { Comment } from "@/lib/types";

interface CommentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comments: Comment[]) => void;
  currentComments: Comment[];
  title: string;
  description: string;
  type: 'reservation' | 'user' | 'timeSlot';
  data: {
    name: string;
    email?: string;
    date?: string;
    time?: string;
    court?: string;
    membershipType?: string;
  };
}

const CommentForm = ({
  isOpen,
  onClose,
  onSave,
  currentComments = [],
  title,
  description,
  type,
  data
}: CommentFormProps) => {
  const [comments, setComments] = useState<Comment[]>(currentComments);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setComments(currentComments);
  }, [currentComments]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      text: newComment.trim(),
      authorId: 'admin', // This would come from user context in a real app
      authorName: 'Admin',
      createdAt: new Date().toISOString(),
    };
    
    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
  };

  const handleUpdateComment = (commentId: string, newText: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, text: newText, updatedAt: new Date().toISOString() }
        : comment
    ));
    setEditingComment(null);
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(comments);
      onClose();
    } catch (error) {
      console.error("Error saving comments:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
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

          {/* Add New Comment */}
          <div className="space-y-2">
            <Label htmlFor="newComment" className="text-sm font-medium">
              Add New Comment
            </Label>
            <div className="flex gap-2">
              <Textarea
                id="newComment"
                placeholder="Add a new comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none flex-1"
              />
              <Button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="sm"
                className="h-10 px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Comments are only visible to administrators and will not be shown to users.
            </p>
          </div>

          {/* Existing Comments */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Existing Comments ({comments.length})
            </Label>
            
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Add your first comment above.
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted/20 rounded-lg border">
                    {editingComment?.id === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingComment.text}
                          onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                          rows={2}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateComment(comment.id, editingComment.text)}
                            disabled={!editingComment.text.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingComment(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm">{comment.text}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{comment.authorName}</span>
                              <span>•</span>
                              <span>{formatDate(comment.createdAt)}</span>
                              {comment.updatedAt && (
                                <>
                                  <span>•</span>
                                  <span>edited {formatDate(comment.updatedAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditComment(comment)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
              {isSubmitting ? "Saving..." : "Save Comments"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommentForm;
