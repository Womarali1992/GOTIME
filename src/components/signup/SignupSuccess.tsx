import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AccountType } from './AccountTypeSelector';

interface SignupSuccessProps {
  accountType: AccountType;
  result: {
    tenant: { id: string; slug: string; name: string };
    user?: { id: string; name: string; email: string };
    coach?: { id: string; name: string; email: string };
    group?: { id: string; name: string };
    redirectUrl: string | null;
  };
}

const typeLabels: Record<AccountType, string> = {
  venue: 'Venue',
  coach: 'Coach',
  'social-group': 'Social Group',
  player: 'Player',
};

export function SignupSuccess({ accountType, result }: SignupSuccessProps) {
  const isDev = !import.meta.env.PROD;
  const person = result.user || result.coach;

  return (
    <div className="text-center space-y-6 py-4">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">You're all set!</h2>
        <p className="text-muted-foreground">
          Your {typeLabels[accountType].toLowerCase()} account has been created.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm text-left">
        {result.tenant && (
          <p><span className="font-medium">Venue:</span> {result.tenant.name}</p>
        )}
        {person && (
          <>
            <p><span className="font-medium">Name:</span> {person.name}</p>
            <p><span className="font-medium">Email:</span> {person.email}</p>
          </>
        )}
        {result.group && (
          <p><span className="font-medium">Group:</span> {result.group.name}</p>
        )}
        {isDev && result.tenant && (
          <p><span className="font-medium">Slug:</span> {result.tenant.slug}</p>
        )}
      </div>

      {result.redirectUrl && !isDev ? (
        <Button asChild className="w-full">
          <a href={result.redirectUrl}>Go to your dashboard</a>
        </Button>
      ) : result.redirectUrl && isDev ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            In production, you'd be redirected to <code className="text-xs bg-muted px-1 py-0.5 rounded">{result.redirectUrl}</code>
          </p>
          <p className="text-sm text-muted-foreground">
            In dev mode, set <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_TENANT_ID={result.tenant.slug}</code> and sign in.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign in at your venue to get started. Ask your venue admin for the link, or look for <code className="text-xs bg-muted px-1 py-0.5 rounded">{result.tenant.slug}.picklepop.com</code>.
          </p>
        </div>
      )}
    </div>
  );
}
