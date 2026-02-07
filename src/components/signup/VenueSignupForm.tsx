import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { venueSignupSchema, type VenueSignupData } from '@/lib/validation/signup-schemas';
import { signupService } from '@/lib/services/signup-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface VenueSignupFormProps {
  onSuccess: (result: any) => void;
}

export function VenueSignupForm({ onSuccess }: VenueSignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<VenueSignupData>({
    resolver: zodResolver(venueSignupSchema),
    defaultValues: { numCourts: '2' },
  });

  const onSubmit = async (data: VenueSignupData) => {
    setIsLoading(true);
    try {
      const result = await signupService.venue(data);
      onSuccess(result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create venue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">Register Your Venue</h2>

      <div className="space-y-2">
        <Label htmlFor="venueName">Venue Name *</Label>
        <Input id="venueName" placeholder="Sunshine Pickleball Club" {...register('venueName')} />
        {errors.venueName && <p className="text-sm text-destructive">{errors.venueName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="123 Court Ln, City, ST" {...register('address')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="numCourts">Number of Courts *</Label>
        <Input id="numCourts" type="number" min="1" max="20" {...register('numCourts')} />
        {errors.numCourts && <p className="text-sm text-destructive">{errors.numCourts.message}</p>}
      </div>

      <hr className="my-2" />
      <p className="text-sm text-muted-foreground">Your admin account details</p>

      <div className="space-y-2">
        <Label htmlFor="contactName">Your Name *</Label>
        <Input id="contactName" placeholder="Jane Doe" {...register('contactName')} />
        {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Email *</Label>
        <Input id="contactEmail" type="email" placeholder="you@example.com" {...register('contactEmail')} />
        {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Phone *</Label>
        <Input id="contactPhone" type="tel" placeholder="555-123-4567" {...register('contactPhone')} />
        {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue-password">Password *</Label>
        <Input id="venue-password" type="password" placeholder="At least 6 characters" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue-confirm">Confirm Password *</Label>
        <Input id="venue-confirm" type="password" placeholder="Confirm your password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating venue...' : 'Create Venue'}
      </Button>
    </form>
  );
}
