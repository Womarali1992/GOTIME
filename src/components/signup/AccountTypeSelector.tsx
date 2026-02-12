import { Building2, GraduationCap, Users, User } from 'lucide-react';

export type AccountType = 'venue' | 'coach' | 'social-group' | 'player';

interface AccountTypeOption {
  type: AccountType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const options: AccountTypeOption[] = [
  {
    type: 'venue',
    title: 'Court / Venue',
    description: 'Register your pickleball facility and manage courts, bookings, and players.',
    icon: <Building2 className="h-8 w-8" />,
  },
  {
    type: 'coach',
    title: 'Coach',
    description: 'Set up your coaching profile — go independent or join an existing venue.',
    icon: <GraduationCap className="h-8 w-8" />,
  },
  {
    type: 'social-group',
    title: 'Social Group',
    description: 'Organize open play sessions and manage your group of players.',
    icon: <Users className="h-8 w-8" />,
  },
  {
    type: 'player',
    title: 'Player',
    description: 'Join an existing venue to book courts and sign up for clinics.',
    icon: <User className="h-8 w-8" />,
  },
];

interface AccountTypeSelectorProps {
  onSelect: (type: AccountType) => void;
}

export function AccountTypeSelector({ onSelect }: AccountTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What type of account do you need?</h2>
        <p className="text-muted-foreground">Choose the option that best describes you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onSelect(opt.type)}
            className="flex flex-col items-center text-center p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer space-y-3"
          >
            <div className="text-primary">{opt.icon}</div>
            <h3 className="font-semibold text-lg">{opt.title}</h3>
            <p className="text-sm text-muted-foreground">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
