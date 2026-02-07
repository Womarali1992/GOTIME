import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { socialGroupSignupSchema, type SocialGroupSignupData } from '@/lib/validation/signup-schemas';
import { signupService } from '@/lib/services/signup-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SocialGroupSignupFormProps {
  onSuccess: (result: any) => void;
}

export function SocialGroupSignupForm({ onSuccess }: SocialGroupSignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SocialGroupSignupData>({
    resolver: zodResolver(socialGroupSignupSchema),
  });

  const onSubmit = async (data: SocialGroupSignupData) => {
    setIsLoading(true);
    try {
      const result = await signupService.socialGroup(data);
      onSuccess(result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">Create a Social Group</h2>

      <div className="space-y-2">
        <Label htmlFor="groupName">Group Name *</Label>
        <Input id="groupName" placeholder="Saturday Morning Dinkers" {...register('groupName')} />
        {errors.groupName && <p className="text-sm text-destructive">{errors.groupName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sg-description">Description</Label>
        <Input id="sg-description" placeholder="What your group is about" {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sg-skill">Skill Level</Label>
        <select
          id="sg-skill"
          {...register('skillLevel')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Any / All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="all-levels">All Levels</option>
        </select>
      </div>

      <hr className="my-2" />
      <p className="text-sm text-muted-foreground">Your organizer account</p>

      <div className="space-y-2">
        <Label htmlFor="sg-organizer">Your Name *</Label>
        <Input id="sg-organizer" placeholder="Jane Doe" {...register('organizerName')} />
        {errors.organizerName && <p className="text-sm text-destructive">{errors.organizerName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sg-email">Email *</Label>
        <Input id="sg-email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sg-phone">Phone</Label>
        <Input id="sg-phone" type="tel" placeholder="555-123-4567" {...register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sg-password">Password *</Label>
        <Input id="sg-password" type="password" placeholder="At least 6 characters" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sg-confirm">Confirm Password *</Label>
        <Input id="sg-confirm" type="password" placeholder="Confirm your password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating group...' : 'Create Social Group'}
      </Button>
    </form>
  );
}
