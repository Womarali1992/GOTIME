import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountTypeSelector, type AccountType } from '@/components/signup/AccountTypeSelector';
import { VenueSignupForm } from '@/components/signup/VenueSignupForm';
import { CoachSignupForm } from '@/components/signup/CoachSignupForm';
import { SocialGroupSignupForm } from '@/components/signup/SocialGroupSignupForm';
import { PlayerSignupForm } from '@/components/signup/PlayerSignupForm';
import { SignupSuccess } from '@/components/signup/SignupSuccess';

type Step = 'choose-type' | 'form' | 'success';

const stepLabels: Record<Step, string> = {
  'choose-type': 'Account Type',
  form: 'Details',
  success: 'Done',
};

const steps: Step[] = ['choose-type', 'form', 'success'];

export default function Signup() {
  const [step, setStep] = useState<Step>('choose-type');
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setStep('form');
  };

  const handleSuccess = (res: any) => {
    setResult(res);
    setStep('success');
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('choose-type');
      setAccountType(null);
    }
  };

  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="text-primary font-bold text-xl">PicklePop</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to home
          </Link>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full ${i <= currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              {i < steps.length - 1 && <div className="w-0" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Step {currentStepIndex + 1} of {steps.length}: {stepLabels[step]}
        </p>

        {/* Back button */}
        {step === 'form' && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        {/* Step content */}
        {step === 'choose-type' && (
          <AccountTypeSelector onSelect={handleTypeSelect} />
        )}

        {step === 'form' && accountType === 'venue' && (
          <VenueSignupForm onSuccess={handleSuccess} />
        )}
        {step === 'form' && accountType === 'coach' && (
          <CoachSignupForm onSuccess={handleSuccess} />
        )}
        {step === 'form' && accountType === 'social-group' && (
          <SocialGroupSignupForm onSuccess={handleSuccess} />
        )}
        {step === 'form' && accountType === 'player' && (
          <PlayerSignupForm onSuccess={handleSuccess} />
        )}

        {step === 'success' && accountType && result && (
          <SignupSuccess accountType={accountType} result={result} />
        )}
      </div>
    </div>
  );
}
