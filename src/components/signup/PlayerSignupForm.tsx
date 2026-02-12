import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playerSignupSchema, type PlayerSignupData } from '@/lib/validation/signup-schemas';
import { signupService } from '@/lib/services/signup-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PlayerSignupFormProps {
  onSuccess: (result: any) => void;
}

export function PlayerSignupForm({ onSuccess }: PlayerSignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [venues, setVenues] = useState<{ id: string; slug: string; name: string }[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<PlayerSignupData>({
    resolver: zodResolver(playerSignupSchema),
  });

  useEffect(() => {
    signupService.fetchVenues().then(setVenues).catch(() => {
      toast.error('Failed to load venues');
    });
  }, []);

  const onSubmit = async (data: PlayerSignupData) => {
    setIsLoading(true);
    try {
      const result = await signupService.player(data);
      onSuccess(result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">Player Registration</h2>

      <div className="space-y-2">
        <Label htmlFor="player-venue">Select Your Venue *</Label>
        <select
          id="player-venue"
          {...register('tenantId')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Choose a venue...</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        {errors.tenantId && <p className="text-sm text-destructive">{errors.tenantId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-name">Name *</Label>
        <Input id="player-name" placeholder="Your name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-email">Email *</Label>
        <Input id="player-email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-phone">Phone</Label>
        <Input id="player-phone" type="tel" placeholder="555-123-4567" {...register('phone')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-dupr">DUPR Rating (optional)</Label>
        <Input id="player-dupr" type="number" step="0.1" min="1.0" max="8.0" placeholder="e.g., 3.5" {...register('duprRating')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-password">Password *</Label>
        <Input id="player-password" type="password" placeholder="At least 6 characters" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-confirm">Confirm Password *</Label>
        <Input id="player-confirm" type="password" placeholder="Confirm your password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
