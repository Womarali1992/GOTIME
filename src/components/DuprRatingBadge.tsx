import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DuprRatingBadgeProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'default';
}

const DuprRatingBadge: React.FC<DuprRatingBadgeProps> = ({ rating, className = '', size = 'default' }) => {
  // Determine skill level and color based on DUPR rating
  const getSkillLevel = (rating: number): { level: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string } => {
    if (rating < 3.0) {
      return { level: 'Beginner', variant: 'outline', color: 'text-green-700 border-green-500/30 bg-green-50' };
    } else if (rating < 5.0) {
      return { level: 'Intermediate', variant: 'secondary', color: 'text-blue-700 border-blue-500/30 bg-blue-50' };
    } else {
      return { level: 'Advanced', variant: 'default', color: 'text-purple-700 border-purple-500/30 bg-purple-50' };
    }
  };

  const skillInfo = getSkillLevel(rating);
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';
  const gapClass = size === 'sm' ? 'gap-1' : 'gap-2';

  return (
    <div className={`flex items-center ${gapClass} ${className}`}>
      <Badge 
        variant="outline" 
        className={`font-mono ${sizeClasses} ${skillInfo.color}`}
      >
        {rating.toFixed(1)}
      </Badge>
      <Badge 
        variant={skillInfo.variant}
        className={sizeClasses}
      >
        {skillInfo.level}
      </Badge>
    </div>
  );
};

export default DuprRatingBadge;
export { DuprRatingBadge };
