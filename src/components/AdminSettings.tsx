import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings2, Save, Loader2 } from 'lucide-react';
import { ReservationSettings, DaySettings } from '@/lib/types';
import { useDataService } from '@/hooks/use-data-service';
import { toast } from 'sonner';

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hrs' },
  { value: 120, label: '2 hrs' },
];

const BREAK_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
];

const VISIBILITY_OPTIONS = [
  { value: '1_week', label: '1 Week' },
  { value: '2_weeks', label: '2 Weeks' },
  { value: '4_weeks', label: '4 Weeks' },
  { value: '6_weeks', label: '6 Weeks' },
  { value: '8_weeks', label: '8 Weeks' },
];

function formatTime12h(time24: string): string {
  const hour = parseInt(time24.split(':')[0]);
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

const AdminSettings: React.FC = () => {
  const { reservationSettings, updateSettings } = useDataService();
  const [settings, setSettings] = useState<ReservationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync from context on mount and when context updates
  useEffect(() => {
    if (reservationSettings) {
      setSettings(reservationSettings);
      setHasChanges(false);
    }
  }, [reservationSettings]);

  const handleChange = useCallback((key: keyof ReservationSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    setHasChanges(true);
  }, []);

  const handleDayChange = useCallback((dayIndex: number, key: keyof DaySettings, value: any) => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        operatingHours: prev.operatingHours.map((day, i) =>
          i === dayIndex ? { ...day, [key]: value } : day
        ),
      };
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!settings || saving) return;

    // Basic validation
    for (const day of settings.operatingHours) {
      if (day.isOpen && day.startTime >= day.endTime) {
        toast.error(`${day.dayOfWeek}: start time must be before end time`);
        return;
      }
    }
    if (settings.minPlayersPerSlot > settings.maxPlayersPerSlot) {
      toast.error('Minimum players cannot exceed maximum players');
      return;
    }

    setSaving(true);
    try {
      await updateSettings(settings);
      setHasChanges(false);
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = useCallback(() => {
    if (reservationSettings) {
      setSettings(reservationSettings);
      setHasChanges(false);
    }
  }, [reservationSettings]);

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with save bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Court Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Operating hours, booking rules, and court configuration
          </p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscard}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Operating Hours */}
      <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Operating Hours
          </CardTitle>
          <CardDescription className="text-xs">
            Set when courts are open for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.operatingHours.map((day, index) => (
            <div
              key={day.dayOfWeek}
              className={`rounded-lg border p-3 transition-colors ${
                day.isOpen ? 'border-border/50 bg-background' : 'border-border/20 bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                {/* Day name + toggle */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Switch
                    checked={day.isOpen}
                    onCheckedChange={(checked) => handleDayChange(index, 'isOpen', checked)}
                  />
                  <Badge variant={day.isOpen ? "default" : "secondary"} className="text-xs">
                    {day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1)}
                  </Badge>
                </div>

                {day.isOpen ? (
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    {/* Start time */}
                    <Select
                      value={day.startTime}
                      onValueChange={(v) => handleDayChange(index, 'startTime', v)}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">{formatTime12h(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-xs text-muted-foreground">to</span>

                    {/* End time */}
                    <Select
                      value={day.endTime}
                      onValueChange={(v) => handleDayChange(index, 'endTime', v)}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">{formatTime12h(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-muted-foreground/40">|</span>

                    {/* Slot duration */}
                    <Select
                      value={day.timeSlotDuration?.toString() || '60'}
                      onValueChange={(v) => handleDayChange(index, 'timeSlotDuration', parseInt(v))}
                    >
                      <SelectTrigger className="w-[85px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value.toString()} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Break time */}
                    <Select
                      value={day.breakTime?.toString() || '0'}
                      onValueChange={(v) => handleDayChange(index, 'breakTime', parseInt(v))}
                    >
                      <SelectTrigger className="w-[80px] h-8 text-xs">
                        <SelectValue placeholder="Break" />
                      </SelectTrigger>
                      <SelectContent>
                        {BREAK_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value.toString()} className="text-xs">
                            {o.value === 0 ? 'No break' : `${o.label} break`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Closed</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Booking Rules */}
      <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Booking Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Court name */}
          <div className="space-y-1">
            <Label htmlFor="courtName" className="text-xs">Court Name</Label>
            <Input
              id="courtName"
              value={settings.courtName || ''}
              onChange={(e) => handleChange('courtName', e.target.value)}
              placeholder="Pickleball Court"
              className="max-w-sm h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Advance booking limit */}
            <div className="space-y-1">
              <Label htmlFor="advanceBooking" className="text-xs">Advance Booking Limit</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="advanceBooking"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.advanceBookingLimit || 24}
                  onChange={(e) => handleChange('advanceBookingLimit', parseInt(e.target.value) || 1)}
                  className="h-9 text-sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">hours</span>
              </div>
            </div>

            {/* Cancellation deadline */}
            <div className="space-y-1">
              <Label htmlFor="cancellation" className="text-xs">Cancellation Deadline</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cancellation"
                  type="number"
                  min="0"
                  max="24"
                  value={settings.cancellationDeadline || 0}
                  onChange={(e) => handleChange('cancellationDeadline', parseInt(e.target.value) || 0)}
                  className="h-9 text-sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">hours before</span>
              </div>
            </div>

            {/* Visibility period */}
            <div className="space-y-1">
              <Label className="text-xs">Slot Visibility</Label>
              <Select
                value={settings.timeSlotVisibilityPeriod}
                onValueChange={(v) => handleChange('timeSlotVisibilityPeriod', v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max players */}
            <div className="space-y-1">
              <Label htmlFor="maxPlayers" className="text-xs">Max Players / Slot</Label>
              <Input
                id="maxPlayers"
                type="number"
                min="1"
                max="8"
                value={settings.maxPlayersPerSlot || 4}
                onChange={(e) => handleChange('maxPlayersPerSlot', parseInt(e.target.value) || 1)}
                className="h-9 text-sm"
              />
            </div>

            {/* Min players */}
            <div className="space-y-1">
              <Label htmlFor="minPlayers" className="text-xs">Min Players / Slot</Label>
              <Input
                id="minPlayers"
                type="number"
                min="1"
                max={settings.maxPlayersPerSlot || 4}
                value={settings.minPlayersPerSlot || 1}
                onChange={(e) => handleChange('minPlayersPerSlot', parseInt(e.target.value) || 1)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
              <div>
                <Label htmlFor="walkIns" className="text-sm">Allow Walk-ins</Label>
                <p className="text-xs text-muted-foreground">Same-day booking</p>
              </div>
              <Switch
                id="walkIns"
                checked={settings.allowWalkIns}
                onCheckedChange={(checked) => handleChange('allowWalkIns', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/30">
              <div>
                <Label htmlFor="payment" className="text-sm">Require Payment</Label>
                <p className="text-xs text-muted-foreground">Payment for bookings</p>
              </div>
              <Switch
                id="payment"
                checked={settings.requirePayment}
                onCheckedChange={(checked) => handleChange('requirePayment', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar at bottom when changes exist */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end gap-2 p-3 rounded-lg bg-background/95 border border-border/50 shadow-lg backdrop-blur">
          <Button variant="outline" size="sm" onClick={handleDiscard}>
            Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
