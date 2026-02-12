import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { coachSignupSchema, type CoachSignupData } from '@/lib/validation/signup-schemas';
import { signupService } from '@/lib/services/signup-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CoachSignupFormProps {
  onSuccess: (result: any) => void;
}

export function CoachSignupForm({ onSuccess }: CoachSignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [venues, setVenues] = useState<{ id: string; slug: string; name: string }[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CoachSignupData>({
    resolver: zodResolver(coachSignupSchema),
    defaultValues: { mode: 'standalone' },
  });

  const mode = watch('mode');

  useEffect(() => {
    if (mode === 'join') {
      signupService.fetchVenues().then(setVenues).catch(() => {
        toast.error('Failed to load venues');
      });
    }
  }, [mode]);

  const onSubmit = async (data: CoachSignupData) => {
    setIsLoading(true);
    try {
      const result = await signupService.coach(data);
      onSuccess(result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coach account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">Coach Registration</h2>

      <div className="space-y-2">
        <Label htmlFor="coach-name">Name *</Label>
        <Input id="coach-name" placeholder="Your name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach-email">Email *</Label>
        <Input id="coach-email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach-phone">Phone</Label>
        <Input id="coach-phone" type="tel" placeholder="555-123-4567" {...register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach-bio">Bio</Label>
        <Input id="coach-bio" placeholder="Tell players about your coaching experience" {...register('bio')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach-specialties">Specialties (comma-separated)</Label>
        <Input id="coach-specialties" placeholder="Beginners, Doubles Strategy, Dinking" {...register('specialties')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach-rate">Hourly Rate ($)</Label>
        <Input id="coach-rate" type="number" min="0" step="5" placeholder="75" {...register('hourlyRate')} />
      </div>

      <hr className="my-2" />

      <div className="space-y-3">
        <Label>How do you want to set up?</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="standalone" {...register('mode')} className="accent-primary" />
            <span className="text-sm">Independent (own site)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="join" {...register('mode')} className="accent-primary" />
            <span className="text-sm">Join a venue</span>
          </label>
        </div>
      </div>

      {mode === 'join' && (
        <div className="space-y-2">
          <Label htmlFor="coach-venue">Select Venue *</Label>
          <select
            id="coach-venue"
            {...register('venueId')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose a venue...</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          {errors.venueId && <p className="text-sm text-destructive">{errors.venueId.message}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="coach-password">Password *</Label>
        <Input id="coach-password" type="password" placeholder="At least 6 characters" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coach-confirm">Confirm Password *</Label>
        <Input id="coach-confirm" type="password" placeholder="Confirm your password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Coach Account'}
      </Button>
    </form>
  );
}
